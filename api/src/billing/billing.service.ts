import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { PassStatus } from 'src/generated/prisma/enums';
import {
  BillingRole,
  MandateResponse,
  PassSummary,
  PaymentMethodInfo,
  PaymentMethodResponse,
  SepaMandate,
  Transaction,
  TransactionsResponse,
  TransactionStatus,
} from './dto/billing.types';
import { StripeProvider } from './stripe/stripe.provider';

const CREDITOR_NAME = 'Île-de-France Mobilités';
const CREDITOR_ICS = 'FR93ZZZ123456';

const BANKS = [
  'Crédit Agricole',
  'BNP Paribas',
  'Société Générale',
  'La Banque Postale',
  "Caisse d'Épargne",
  'Crédit Mutuel',
];

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeProvider,
  ) {}

  private async getVisibleSubscriptions(accountId: number) {
    const subs = await this.prisma.subscription.findMany({
      where: {
        OR: [
          { payerId: accountId },
          { referrerId: accountId },
          { beneficiary: { account: { id: accountId } } },
        ],
      },
      include: {
        beneficiary: { include: { account: true } },
        passes: { where: { status: PassStatus.active }, take: 1 },
      },
      orderBy: { startDate: 'desc' },
    });

    return subs.map((sub) => {
      const roles: BillingRole[] = [];
      if (sub.beneficiary.account?.id === accountId) roles.push('holder');
      if (sub.referrerId === accountId) roles.push('referrer');
      if (sub.payerId === accountId) roles.push('payer');
      return { sub, roles, activePass: sub.passes[0] ?? null };
    });
  }

  async getPasses(accountId: number): Promise<PassSummary[]> {
    const visible = await this.getVisibleSubscriptions(accountId);
    return visible.map(({ sub, roles, activePass }) => ({
      subscriptionId: sub.id,
      navigoNumber: activePass?.navigoNumber ?? null,
      passStatus: activePass?.status ?? null,
      subscriptionType: sub.subscriptionType,
      status: sub.status,
      holderName: `${sub.beneficiary.firstName} ${sub.beneficiary.lastName}`,
      roles,
      startDate: sub.startDate.toISOString(),
      endDate: sub.endDate.toISOString(),
    }));
  }

  async getTransactions(
    accountId: number,
    subscriptionId?: number,
  ): Promise<TransactionsResponse> {
    const visible = await this.getVisibleSubscriptions(accountId);
    const visibleIds = new Set(visible.map((v) => v.sub.id));

    if (subscriptionId !== undefined && !visibleIds.has(subscriptionId)) {
      throw new ForbiddenException(
        `Pass ${subscriptionId} is not linked to this account.`,
      );
    }

    const targetIds = subscriptionId ? [subscriptionId] : [...visibleIds];

    if (targetIds.length === 0) {
      return { total: 0, outstanding: 0, currency: 'EUR', transactions: [] };
    }

    const payments = await this.prisma.payment.findMany({
      where: { subscriptionId: { in: targetIds } },
      include: {
        subscription: {
          include: {
            beneficiary: true,
            passes: { where: { status: PassStatus.active }, take: 1 },
          },
        },
      },
      orderBy: { paidAt: 'desc' },
    });

    const transactions: Transaction[] = payments.map((p) => {
      const status = this.normalizeStatus(p.status);

      const signedAmount =
        status === 'refunded' ? Math.abs(p.amount) : -Math.abs(p.amount);
      const holder = p.subscription.beneficiary;
      const activePass = p.subscription.passes[0] ?? null;

      return {
        id: String(p.id),
        date: p.paidAt.toISOString(),
        label: `${p.subscription.subscriptionType} — ${holder.firstName} ${holder.lastName}`,
        amount: Number(signedAmount.toFixed(2)),
        status,
        method: p.method,
        subscriptionId: p.subscriptionId,
        navigoNumber: activePass?.navigoNumber ?? null,
      };
    });

    const total = transactions
      .filter((t) => t.status !== 'failed')
      .reduce((sum, t) => sum + t.amount, 0);

    const outstanding = transactions
      .filter((t) => t.status === 'failed')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      total: Number(total.toFixed(2)),
      outstanding: Number(outstanding.toFixed(2)),
      currency: 'EUR',
      transactions,
    };
  }

  private normalizeStatus(raw: string): TransactionStatus {
    switch (raw) {
      case 'failed':
        return 'failed';
      case 'refunded':
        return 'refunded';
      default:
        return 'succeeded';
    }
  }

  async assertCanAccessPass(accountId: number, subscriptionId: number) {
    const visible = await this.getVisibleSubscriptions(accountId);
    const found = visible.find((v) => v.sub.id === subscriptionId);
    if (!found) {
      throw new NotFoundException(
        `Pass ${subscriptionId} not found for this account.`,
      );
    }
    return found;
  }

  async getMandate(
    accountId: number,
    subscriptionId: number,
  ): Promise<MandateResponse> {
    await this.assertCanAccessPass(accountId, subscriptionId);

    if (this.stripe.isConnected) {
      const [active, history] = await Promise.all([
        this.stripe.getMandate(subscriptionId),
        this.stripe.getMandateHistory(subscriptionId),
      ]);
      return { connected: true, active, history };
    }
    const { active, history } = await this.buildLocalMandates(subscriptionId);
    return { connected: false, active, history };
  }

  private async buildLocalMandates(
    subscriptionId: number,
  ): Promise<{ active: SepaMandate; history: SepaMandate[] }> {
    const sub = await this.prisma.subscription.findUniqueOrThrow({
      where: { id: subscriptionId },
      include: {
        beneficiary: true,
        payer: { include: { beneficiary: true } },
        passes: { orderBy: { issuedAt: 'desc' } },
      },
    });

    const activePass =
      sub.passes.find((p) => p.status === PassStatus.active) ?? null;

    const payer = sub.payer;
    const debtorName = payer?.beneficiary
      ? `${payer.beneficiary.firstName} ${payer.beneficiary.lastName}`
      : payer?.email
        ? payer.email
            .split('@')[0]
            .replace(/[._]/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase())
        : `${sub.beneficiary.firstName} ${sub.beneficiary.lastName}`;

    // Seed déterministe pour l'IBAN masqué : on retombe sur l'id d'abonnement
    // si aucun pass actif n'existe (cas juste après un blocage, avant remplacement).
    const seed =
      payer?.accountNumber ?? activePass?.navigoNumber ?? String(sub.id);
    const mask = (tail: string) => `FR76 •••• •••• •••• •••• ••${tail}`;

    const active: SepaMandate = {
      reference: `IDFM-SUB-${sub.id}`,
      status: sub.status === 'active' ? 'active' : 'revoked',
      scheme: 'CORE',
      creditorName: CREDITOR_NAME,
      creditorIcs: CREDITOR_ICS,
      debtorName,
      ibanMasked: mask(this.deriveIbanLast2(seed)),
      signedAt: sub.startDate.toISOString(),
      revokedAt: null,
      subscriptionId: sub.id,
      source: 'local',
    };

    const prevSigned = new Date(sub.startDate.getTime());
    prevSigned.setUTCFullYear(prevSigned.getUTCFullYear() - 1);
    const previous: SepaMandate = {
      ...active,
      reference: `IDFM-SUB-${sub.id}-ANT`,
      status: 'revoked',
      ibanMasked: mask(this.deriveIbanLast2(`${seed}-prev`)),
      signedAt: prevSigned.toISOString(),
      revokedAt: sub.startDate.toISOString(),
    };

    return { active, history: [previous] };
  }

  private deriveIbanLast2(seed: string): string {
    let h = 0;
    for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) % 100;
    return String(h).padStart(2, '0');
  }

  async getMandateDocumentHtml(
    accountId: number,
    subscriptionId: number,
  ): Promise<string> {
    await this.assertCanAccessPass(accountId, subscriptionId);
    const { active } = await this.getMandate(accountId, subscriptionId);
    if (!active) {
      return '<!doctype html><meta charset="utf-8"><p>Aucun mandat disponible pour ce pass.</p>';
    }

    const sub = await this.prisma.subscription.findUniqueOrThrow({
      where: { id: subscriptionId },
      select: { reference: true },
    });

    return this.renderMandateHtml(active, sub.reference);
  }

  private renderMandateHtml(
    m: SepaMandate,
    subscriptionReference: string,
  ): string {
    const esc = (s: string) =>
      s.replace(
        /[&<>"]/g,
        (c) =>
          ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[
            c
          ] as string,
      );
    const signed = new Date(m.signedAt).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    const statusLabel =
      m.status === 'active'
        ? 'Actif'
        : m.status === 'pending'
          ? 'En attente'
          : 'Révoqué';

    return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<title>Mandat SEPA ${esc(m.reference)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; color: #25303B; margin: 0; background: #F9F9F9; }
  .sheet { max-width: 760px; margin: 24px auto; background: #fff; border: 1px solid #DDD; border-radius: 12px; padding: 40px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .sub { color: #53606E; font-size: 13px; margin-bottom: 24px; }
  .badge { display: inline-block; background: #E3F4EA; color: #045C34; font-weight: 700; font-size: 12px; padding: 3px 10px; border-radius: 999px; }
  .grid { display: grid; grid-template-columns: 180px 1fr; gap: 10px 16px; font-size: 14px; margin: 20px 0; }
  .grid dt { color: #53606E; }
  .grid dd { margin: 0; font-weight: 600; }
  .legal { font-size: 11px; color: #53606E; line-height: 1.5; border-top: 1px solid #EEE; padding-top: 16px; margin-top: 24px; }
  .sign { display: flex; justify-content: space-between; margin-top: 32px; font-size: 13px; }
  .sign .box { border-top: 1px solid #999; padding-top: 6px; width: 45%; color: #53606E; }
  .print { margin: 16px auto; display: block; background: #1972D2; color: #fff; border: 0; padding: 12px 20px; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; }
  @media print { body { background: #fff; } .sheet { border: 0; margin: 0; } .print { display: none; } }
</style></head>
<body>
  <button class="print" onclick="window.print()">Enregistrer en PDF / Imprimer</button>
  <div class="sheet">
    <h1>Mandat de prélèvement SEPA</h1>
    <div class="sub">Type : prélèvement récurrent (CORE) · Statut : <span class="badge">${esc(statusLabel)}</span></div>
    <dl class="grid">
      <dt>Référence (RUM)</dt><dd>${esc(m.reference)}</dd>
      <dt>Référence abonnement</dt><dd>${esc(subscriptionReference)}</dd>
      <dt>Créancier</dt><dd>${esc(m.creditorName)}</dd>
      <dt>ICS</dt><dd>${esc(m.creditorIcs)}</dd>
      <dt>Débiteur</dt><dd>${esc(m.debtorName)}</dd>
      <dt>IBAN</dt><dd>${esc(m.ibanMasked)}</dd>
      <dt>Signé le</dt><dd>${esc(signed)}</dd>
    </dl>
    <p class="legal">
      En signant ce formulaire de mandat, vous autorisez ${esc(m.creditorName)} à
      envoyer des instructions à votre banque pour débiter votre compte, et votre
      banque à débiter votre compte conformément aux instructions de ${esc(m.creditorName)}.
      Vous bénéficiez d'un droit à remboursement par votre banque selon les conditions
      décrites dans la convention que vous avez passée avec elle. Toute demande de
      remboursement doit être présentée dans les 8 semaines suivant la date de débit.
    </p>
    <div class="sign">
      <div class="box">Fait à&nbsp;: …………………………………</div>
      <div class="box">Signature</div>
    </div>
  </div>
</body></html>`;
  }

  async getPaymentMethod(
    accountId: number,
    subscriptionId: number,
  ): Promise<PaymentMethodResponse> {
    await this.assertCanAccessPass(accountId, subscriptionId);
    if (this.stripe.isConnected) {
      return {
        connected: true,
        paymentMethod:
          await this.stripe.getDefaultPaymentMethod(subscriptionId),
      };
    }
    return {
      connected: false,
      paymentMethod: await this.buildLocalPaymentMethod(subscriptionId),
    };
  }

  private async buildLocalPaymentMethod(
    subscriptionId: number,
  ): Promise<PaymentMethodInfo> {
    const { active } = await this.buildLocalMandates(subscriptionId);
    return {
      type: 'sepa_debit',
      ibanMasked: active.ibanMasked,
      bankName: BANKS[this.hash(active.ibanMasked) % BANKS.length],
      holderName: active.debtorName,
      isDefault: true,
      source: 'local',
    };
  }

  async startRibChange(accountId: number, subscriptionId: number) {
    await this.assertCanAccessPass(accountId, subscriptionId);
    if (this.stripe.isConnected) {
      const intent = await this.stripe.createSepaSetupIntent(subscriptionId);
      return {
        connected: true,
        clientSecret: intent?.clientSecret ?? null,
        billingName: intent?.billingName ?? null,
        billingEmail: intent?.billingEmail ?? null,
        message: 'SetupIntent prêt — confirmez le nouvel IBAN.',
      };
    }
    return {
      connected: false,
      clientSecret: null,
      billingName: null,
      billingEmail: null,
      message:
        "La collecte du nouvel IBAN se fait à l'inscription. Le changement en self-service sera disponible au branchement de Stripe.",
    };
  }

  async finalizeRibChange(
    accountId: number,
    subscriptionId: number,
    setupIntentId: string,
  ) {
    await this.assertCanAccessPass(accountId, subscriptionId);
    if (!this.stripe.isConnected) return { ok: false, connected: false };
    const res = await this.stripe.finalizeRibChange(
      subscriptionId,
      setupIntentId,
    );
    return { ok: res.ok, connected: true };
  }

  private hash(seed: string): number {
    let h = 0;
    for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) % 100000;
    return h;
  }
}
