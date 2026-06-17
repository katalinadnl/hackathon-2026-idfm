import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { InvoiceData } from './invoice-pdf.service';
import {
  BillingRole,
  CurrentMonthStatus,
  MandateResponse,
  MonthGroup,
  PassSummary,
  PaymentMethodInfo,
  PaymentModeLabel,
  PaymentMethodResponse,
  SepaMandate,
  Transaction,
  TransactionsResponse,
  TransactionStatus,
} from './dto/billing.types';
import { PaymentMode } from '../generated/prisma/enums';
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
      },
      orderBy: { startDate: 'desc' },
    });

    return subs.map((sub) => {
      const roles: BillingRole[] = [];
      if (sub.beneficiary.account?.id === accountId) roles.push('holder');
      if (sub.referrerId === accountId) roles.push('referrer');
      if (sub.payerId === accountId) roles.push('payer');
      return { sub, roles };
    });
  }

  private toModeLabel(mode: PaymentMode): PaymentModeLabel {
    switch (mode) {
      case PaymentMode.CARD_ONCE:
        return 'card_once';
      case PaymentMode.SEPA_ONCE:
        return 'sepa_once';
      case PaymentMode.SEPA_MONTHLY:
        return 'sepa_monthly';
    }
  }

  async getPasses(accountId: number): Promise<PassSummary[]> {
    const visible = await this.getVisibleSubscriptions(accountId);
    return visible.map(({ sub, roles }) => {
      const mode = this.toModeLabel(sub.paymentMode);
      return {
        subscriptionId: sub.id,
        navigoNumber: sub.navigoNumber,
        subscriptionType: sub.subscriptionType,
        status: sub.status,
        holderName: `${sub.beneficiary.firstName} ${sub.beneficiary.lastName}`,
        roles,
        startDate: sub.startDate.toISOString(),
        endDate: sub.endDate.toISOString(),
        paymentMode: mode,
        annualAmount: sub.annualAmount,
        monthlyAmount: sub.monthlyAmount,
        hasSepa: mode !== 'card_once',
      };
    });
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

    const targetSub = subscriptionId
      ? visible.find((v) => v.sub.id === subscriptionId)?.sub
      : visible[0]?.sub;
    const targetIds = subscriptionId ? [subscriptionId] : [...visibleIds];

    const mode = targetSub
      ? this.toModeLabel(targetSub.paymentMode)
      : 'sepa_monthly';

    if (targetIds.length === 0) {
      return {
        total: 0,
        outstanding: 0,
        currency: 'EUR',
        transactions: [],
        monthGroups: null,
        paymentMode: mode,
        currentMonthStatus: 'not_applicable',
        nextPayment: null,
        annualPaid: false,
      };
    }

    const payments = await this.prisma.payment.findMany({
      where: { subscriptionId: { in: targetIds } },
      include: {
        subscription: {
          include: {
            beneficiary: true,
            payer: { include: { beneficiary: true } },
          },
        },
      },
      orderBy: { paidAt: 'desc' },
    });

    const payerSubIds = new Set(
      visible.filter((v) => v.roles.includes('payer')).map((v) => v.sub.id),
    );

    const transactions: Transaction[] = payments.map((p) => {
      const status = this.normalizeStatus(p.status);
      const signedAmount =
        status === 'refunded' ? Math.abs(p.amount) : -Math.abs(p.amount);
      const holder = p.subscription.beneficiary;
      const isMine = payerSubIds.has(p.subscriptionId);
      const payer = p.subscription.payer;
      return {
        id: String(p.id),
        date: p.paidAt.toISOString(),
        label: `${p.subscription.subscriptionType} — ${holder.firstName} ${holder.lastName}`,
        amount: Number(signedAmount.toFixed(2)),
        status,
        method: p.method,
        navigoNumber: p.subscription.navigoNumber,
        paidByOther: isMine
          ? null
          : payer?.beneficiary
            ? `${payer.beneficiary.firstName} ${payer.beneficiary.lastName}`
            : null,
      };
    });

    const isAllPasses = subscriptionId === undefined;

    const billableTx = isAllPasses
      ? transactions.filter((t) => t.paidByOther === null)
      : transactions;

    const total = billableTx
      .filter((t) => t.status !== 'failed')
      .reduce((sum, t) => sum + t.amount, 0);

    const outstanding = billableTx
      .filter((t) => t.status === 'failed')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const payerSubs = visible
      .filter((v) => v.roles.includes('payer'))
      .map((v) => v.sub);
    const targetSubs = isAllPasses
      ? payerSubs
      : [targetSub].filter(Boolean);

    const statusPayments = isAllPasses
      ? payments.filter((p) => payerSubIds.has(p.subscriptionId))
      : payments;
    const { currentMonthStatus, nextPayment, annualPaid } =
      this.computePaymentStatus(targetSubs, statusPayments, outstanding);

    const monthGroups = isAllPasses
      ? this.buildMonthGroups(transactions)
      : null;

    return {
      total: Number(total.toFixed(2)),
      outstanding: Number(outstanding.toFixed(2)),
      currency: 'EUR',
      transactions,
      monthGroups,
      paymentMode: mode,
      currentMonthStatus,
      nextPayment,
      annualPaid,
    };
  }

  private buildMonthGroups(transactions: Transaction[]): MonthGroup[] {
    const groups = new Map<string, { label: string; txs: Transaction[] }>();
    for (const tx of transactions) {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('fr-FR', {
        month: 'long',
        year: 'numeric',
      });
      if (!groups.has(key)) groups.set(key, { label, txs: [] });
      groups.get(key)!.txs.push(tx);
    }
    return [...groups.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([month, { label, txs }]) => ({
        month,
        label,
        total: Number(
          txs
            .filter((t) => t.status !== 'failed')
            .reduce((s, t) => s + t.amount, 0)
            .toFixed(2),
        ),
        outstanding: Number(
          txs
            .filter((t) => t.status === 'failed')
            .reduce((s, t) => s + Math.abs(t.amount), 0)
            .toFixed(2),
        ),
        transactions: txs,
      }));
  }

  private computePaymentStatus(
    subs: any[],
    payments: any[],
    totalOutstanding: number,
  ): {
    currentMonthStatus: CurrentMonthStatus;
    nextPayment: { date: string; amount: number } | null;
    annualPaid: boolean;
  } {
    if (subs.length === 0) {
      return {
        currentMonthStatus: 'not_applicable',
        nextPayment: null,
        annualPaid: false,
      };
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const hasMonthly = subs.some(
      (s) => s.paymentMode === PaymentMode.SEPA_MONTHLY,
    );
    const onceOnly = !hasMonthly;

    if (onceOnly) {
      const hasSucceeded = payments.some((p) => p.status === 'succeeded');
      const hasFailed = payments.some(
        (p) =>
          p.status === 'failed' &&
          !payments.some(
            (s: any) => s.status === 'succeeded' && s.amount === p.amount,
          ),
      );
      return {
        currentMonthStatus: hasSucceeded
          ? 'paid'
          : hasFailed
            ? 'failed'
            : 'pending',
        nextPayment: null,
        annualPaid: hasSucceeded,
      };
    }

    // At least one SEPA_MONTHLY sub
    const thisMonthPayments = payments.filter((p) => {
      const d = new Date(p.paidAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    let currentMonthStatus: CurrentMonthStatus;
    if (thisMonthPayments.length === 0) {
      currentMonthStatus = 'upcoming';
    } else if (thisMonthPayments.some((p) => p.status === 'failed')) {
      currentMonthStatus = 'failed';
    } else if (thisMonthPayments.every((p) => p.status === 'succeeded')) {
      currentMonthStatus = 'paid';
    } else {
      currentMonthStatus = 'pending';
    }

    const nextMonth = new Date(currentYear, currentMonth + 1, 5);

    let regularAmount = 0;
    for (const s of subs) {
      if (
        s.paymentMode === PaymentMode.SEPA_MONTHLY &&
        s.monthlyAmount &&
        nextMonth <= new Date(s.endDate)
      ) {
        regularAmount += Number(s.monthlyAmount);
      }
    }

    const nextAmount = regularAmount + totalOutstanding;

    const nextPayment =
      nextAmount > 0
        ? { date: nextMonth.toISOString(), amount: nextAmount }
        : null;

    return { currentMonthStatus, nextPayment, annualPaid: false };
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
    subscriptionId?: number,
  ): Promise<MandateResponse> {
    const subId =
      subscriptionId ?? (await this.firstSepaSubId(accountId));
    if (!subId) {
      return { connected: false, active: null, history: [] };
    }
    await this.assertCanAccessPass(accountId, subId);

    if (this.stripe.isConnected) {
      const [active, history] = await Promise.all([
        this.stripe.getMandate(subId),
        this.stripe.getMandateHistory(subId),
      ]);
      if (active) {
        return { connected: true, active, history };
      }
    }
    const { active, history } = await this.buildLocalMandates(subId);
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
      },
    });

    const payer = sub.payer;
    const debtorName = payer?.beneficiary
      ? `${payer.beneficiary.firstName} ${payer.beneficiary.lastName}`
      : payer?.email
        ? payer.email
            .split('@')[0]
            .replace(/[._]/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase())
        : `${sub.beneficiary.firstName} ${sub.beneficiary.lastName}`;

    const seed = payer?.accountNumber ?? sub.navigoNumber;
    const mask = (tail: string) => `FR76 •••• •••• •••• •••• ••${tail}`;

    const active: SepaMandate = {
      reference: `IDFM-${sub.navigoNumber}`,
      status: sub.status === 'active' ? 'active' : 'revoked',
      scheme: 'CORE',
      creditorName: CREDITOR_NAME,
      creditorIcs: CREDITOR_ICS,
      debtorName,
      ibanMasked: mask(this.deriveIbanLast2(seed)),
      signedAt: sub.startDate.toISOString(),
      revokedAt: null,
      navigoNumber: sub.navigoNumber,
      source: 'local',
    };

    const prevSigned = new Date(sub.startDate.getTime());
    prevSigned.setUTCFullYear(prevSigned.getUTCFullYear() - 1);
    const previous: SepaMandate = {
      ...active,
      reference: `IDFM-${sub.navigoNumber}-ANT`,
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
    const { active } = await this.getMandate(accountId, subscriptionId);
    if (!active) {
      return '<!doctype html><meta charset="utf-8"><p>Aucun mandat disponible pour ce pass.</p>';
    }
    return this.renderMandateHtml(active);
  }

  private renderMandateHtml(m: SepaMandate): string {
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
      <dt>Créancier</dt><dd>${esc(m.creditorName)}</dd>
      <dt>ICS</dt><dd>${esc(m.creditorIcs)}</dd>
      <dt>Débiteur</dt><dd>${esc(m.debtorName)}</dd>
      <dt>IBAN</dt><dd>${esc(m.ibanMasked)}</dd>
      <dt>Pass Navigo</dt><dd>${esc(m.navigoNumber)}</dd>
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
    subscriptionId?: number,
  ): Promise<PaymentMethodResponse> {
    const subId =
      subscriptionId ?? (await this.firstSepaSubId(accountId));
    if (!subId) {
      return { connected: false, paymentMethod: null };
    }
    await this.assertCanAccessPass(accountId, subId);
    if (this.stripe.isConnected) {
      const pm = await this.stripe.getDefaultPaymentMethod(subId);
      if (pm) {
        return { connected: true, paymentMethod: pm };
      }
    }
    return {
      connected: false,
      paymentMethod: await this.buildLocalPaymentMethod(subId),
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

  async startRibChange(accountId: number, subscriptionId?: number) {
    const subId =
      subscriptionId ?? (await this.firstSepaSubId(accountId));
    if (!subId) {
      return {
        connected: false,
        clientSecret: null,
        billingName: null,
        billingEmail: null,
        message: 'Aucun pass SEPA trouvé.',
      };
    }
    await this.assertCanAccessPass(accountId, subId);
    if (this.stripe.isConnected) {
      const intent = await this.stripe.createSepaSetupIntent(subId);
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
    subscriptionId: number | undefined,
    setupIntentId: string,
  ) {
    const subId =
      subscriptionId ?? (await this.firstSepaSubId(accountId));
    if (!subId) return { ok: false, connected: false };
    await this.assertCanAccessPass(accountId, subId);
    if (!this.stripe.isConnected) return { ok: false, connected: false };
    const res = await this.stripe.finalizeRibChange(
      subId,
      setupIntentId,
    );
    return { ok: res.ok, connected: true };
  }

  async retryPayment(accountId: number, paymentId: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { subscription: true },
    });
    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found.`);
    }

    const visible = await this.getVisibleSubscriptions(accountId);
    const allowed = visible.some(
      (v) => v.sub.id === payment.subscriptionId,
    );
    if (!allowed) {
      throw new ForbiddenException(
        'This payment is not linked to your account.',
      );
    }

    if (payment.status !== 'failed') {
      throw new ForbiddenException(
        'Only failed payments can be retried.',
      );
    }

    if (this.stripe.isConnected) {
      const result = await this.stripe.retryPayment(
        payment.subscriptionId,
        payment.amount,
      );
      if (result.ok) {
        await this.prisma.payment.update({
          where: { id: paymentId },
          data: { status: 'succeeded' },
        });
        return { ok: true, message: 'Paiement relancé avec succès.' };
      }
      return {
        ok: false,
        message: result.error ?? 'Échec de la relance du paiement.',
      };
    }

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'succeeded' },
    });
    return { ok: true, message: 'Paiement marqué comme réglé.' };
  }

  async payByCard(
    accountId: number,
    paymentId: number,
    baseUrl: string,
  ): Promise<{ url: string | null; sessionId: string | null; message: string }> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        subscription: {
          include: { beneficiary: true, payer: true },
        },
      },
    });
    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found.`);
    }

    const visible = await this.getVisibleSubscriptions(accountId);
    const allowed = visible.some(
      (v) => v.sub.id === payment.subscriptionId,
    );
    if (!allowed) {
      throw new ForbiddenException(
        'This payment is not linked to your account.',
      );
    }

    if (payment.status !== 'failed') {
      throw new ForbiddenException(
        'Only failed payments can be paid by card.',
      );
    }

    if (!this.stripe.isConnected) {
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'succeeded', method: 'card' },
      });
      return {
        url: null,
        sessionId: null,
        message: 'Paiement marqué comme réglé (mode local).',
      };
    }

    const holder = payment.subscription.beneficiary;
    const description = `Régularisation ${payment.subscription.subscriptionType} — ${holder.firstName} ${holder.lastName}`;
    const payerId = payment.subscription.payerId ?? accountId;
    const apiBase = process.env.API_BASE_URL ?? 'http://localhost:3000/api';
    const successUrl = `${apiBase}/billing/payment/card-return?paymentId=${paymentId}&sessionId={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/billing`;

    const result = await this.stripe.createCardCheckoutSession(
      payerId,
      payment.amount,
      description,
      successUrl,
      cancelUrl,
    );

    if (!result) {
      return { url: null, sessionId: null, message: 'Impossible de créer la session de paiement.' };
    }

    return { url: result.url, sessionId: result.sessionId, message: 'Redirection vers la page de paiement.' };
  }

  async confirmCardPayment(
    paymentId: number,
    sessionId: string,
  ): Promise<{ ok: boolean; message: string }> {
    if (this.stripe.isConnected) {
      const { paid } = await this.stripe.checkCheckoutSession(sessionId);
      if (!paid) {
        return { ok: false, message: 'Le paiement n\'a pas été finalisé.' };
      }
    }
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'succeeded', method: 'card' },
    });
    return { ok: true, message: 'Paiement confirmé.' };
  }

  async getInvoiceData(
    accountId: number,
    paymentId: number,
  ): Promise<InvoiceData> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        subscription: {
          include: {
            beneficiary: true,
            payer: { include: { beneficiary: true } },
          },
        },
      },
    });
    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found.`);
    }

    const visible = await this.getVisibleSubscriptions(accountId);
    if (!visible.some((v) => v.sub.id === payment.subscriptionId)) {
      throw new ForbiddenException(
        'This payment is not linked to your account.',
      );
    }

    const sub = payment.subscription;
    const holder = sub.beneficiary;
    const payer = sub.payer;
    const payerName = payer?.beneficiary
      ? `${payer.beneficiary.firstName} ${payer.beneficiary.lastName}`
      : `${holder.firstName} ${holder.lastName}`;

    const paidAt = new Date(payment.paidAt);
    const month = paidAt.toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric',
    });
    const period =
      sub.paymentMode === 'SEPA_MONTHLY' ? month : `Année ${paidAt.getFullYear()}`;

    const fmtDate = (d: Date) =>
      d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const subscriptionPeriod = `${fmtDate(sub.startDate)} — ${fmtDate(sub.endDate)}`;

    return {
      invoiceNumber: `F-${sub.navigoNumber}-${String(payment.id).padStart(4, '0')}`,
      date: payment.paidAt.toISOString(),
      holderName: `${holder.firstName} ${holder.lastName}`,
      navigoNumber: sub.navigoNumber,
      subscriptionType: sub.subscriptionType,
      subscriptionPeriod,
      paymentMethod: payment.method,
      amount: payment.amount,
      status: payment.status,
      payerName,
      period,
    };
  }

  async getMonthInvoiceData(
    accountId: number,
    month: string,
  ): Promise<InvoiceData[]> {
    const [yearStr, monthStr] = month.split('-');
    const year = Number(yearStr);
    const mon = Number(monthStr) - 1;
    const from = new Date(year, mon, 1);
    const to = new Date(year, mon + 1, 1);

    const visible = await this.getVisibleSubscriptions(accountId);
    const visibleIds = visible.map((v) => v.sub.id);

    const payments = await this.prisma.payment.findMany({
      where: {
        subscriptionId: { in: visibleIds },
        paidAt: { gte: from, lt: to },
      },
      include: {
        subscription: {
          include: {
            beneficiary: true,
            payer: { include: { beneficiary: true } },
          },
        },
      },
      orderBy: { paidAt: 'asc' },
    });

    if (payments.length === 0) {
      throw new NotFoundException(
        `Aucune facture pour le mois ${month}.`,
      );
    }

    return payments.map((p) => {
      const sub = p.subscription;
      const holder = sub.beneficiary;
      const payer = sub.payer;
      const payerName = payer?.beneficiary
        ? `${payer.beneficiary.firstName} ${payer.beneficiary.lastName}`
        : `${holder.firstName} ${holder.lastName}`;

      const paidAt = new Date(p.paidAt);
      const monthLabel = paidAt.toLocaleDateString('fr-FR', {
        month: 'long',
        year: 'numeric',
      });
      const period =
        sub.paymentMode === 'SEPA_MONTHLY'
          ? monthLabel
          : `Année ${paidAt.getFullYear()}`;

      const fmtDate = (d: Date) =>
        d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      const subscriptionPeriod = `${fmtDate(sub.startDate)} — ${fmtDate(sub.endDate)}`;

      return {
        invoiceNumber: `F-${sub.navigoNumber}-${String(p.id).padStart(4, '0')}`,
        date: p.paidAt.toISOString(),
        holderName: `${holder.firstName} ${holder.lastName}`,
        navigoNumber: sub.navigoNumber,
        subscriptionType: sub.subscriptionType,
        subscriptionPeriod,
        paymentMethod: p.method,
        amount: p.amount,
        status: p.status,
        payerName,
        period,
      };
    });
  }

  private async firstSepaSubId(accountId: number): Promise<number | null> {
    const visible = await this.getVisibleSubscriptions(accountId);
    const isSepa = (v: (typeof visible)[number]) =>
      v.sub.paymentMode === PaymentMode.SEPA_MONTHLY ||
      v.sub.paymentMode === PaymentMode.SEPA_ONCE;
    const asPayer = visible.find(
      (v) => isSepa(v) && v.roles.includes('payer'),
    );
    if (asPayer) return asPayer.sub.id;
    const any = visible.find(isSepa);
    return any?.sub.id ?? null;
  }

  private hash(seed: string): number {
    let h = 0;
    for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) % 100000;
    return h;
  }
}
