import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import Stripe from 'stripe';

import { PrismaClient } from '../src/generated/prisma/client';

const TEST_IBAN = 'FR1420041010050500013M02606';

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error(
      '✗ STRIPE_SECRET_KEY manquant. Ajoute-le à api/.env puis relance.',
    );
    process.exit(1);
  }

  const stripe = new Stripe(key);
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  // Un compte est "payeur" s'il possède au moins un BankInfo réellement
  // utilisé par un abonnement — payerId n'existe plus, le lien passe par
  // BankInfo.subscriptions.
  const payers = await prisma.account.findMany({
    where: {
      bankInfos: {
        some: { subscriptions: { some: {} } },
      },
    },
  });

  console.log(`→ ${payers.length} compte(s) payeur(s) à provisionner`);

  for (const account of payers) {
    if (account.stripeCustomerId) {
      console.log(
        `  • ${account.email} déjà lié (${account.stripeCustomerId})`,
      );
      continue;
    }

    const name = account.email.split('@')[0];

    const customer = await stripe.customers.create({
      name,
      email: account.email,
      metadata: { accountNumber: account.accountNumber },
    });

    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ['sepa_debit'],
      payment_method_data: {
        type: 'sepa_debit',
        sepa_debit: { iban: TEST_IBAN },
        billing_details: { name, email: account.email },
      },
      mandate_data: {
        customer_acceptance: {
          type: 'offline',
        },
      },
      confirm: true,
      usage: 'off_session',
    });

    const paymentMethodId =
      typeof setupIntent.payment_method === 'string'
        ? setupIntent.payment_method
        : (setupIntent.payment_method?.id ?? null);
    const mandateId =
      typeof setupIntent.mandate === 'string'
        ? setupIntent.mandate
        : (setupIntent.mandate?.id ?? null);

    if (paymentMethodId) {
      await stripe.customers.update(customer.id, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });
    }

    await prisma.account.update({
      where: { id: account.id },
      data: {
        stripeCustomerId: customer.id,
        stripePaymentMethodId: paymentMethodId,
        stripeMandateId: mandateId,
      },
    });

    console.log(
      `  ✓ ${account.email} → customer ${customer.id} · pm ${paymentMethodId} · mandate ${mandateId}`,
    );
  }

  console.log('✅ Provisioning Stripe terminé');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
