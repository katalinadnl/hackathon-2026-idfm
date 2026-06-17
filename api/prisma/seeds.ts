import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcrypt';
import { PrismaClient } from '../src/generated/prisma/client';
import {
  AddressType,
  BeneficiaryStatus,
  DeliveryReason,
  DeliveryStatus,
  PassStatus,
  VerificationSource,
} from '../src/generated/prisma/enums';
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
async function main() {
  // ── Departments ──────────────────────────────────────────────────────────────
  const departments = await Promise.all([
    prisma.department.upsert({
      where: { code: '75' },
      update: {},
      create: { code: '75', name: 'Paris', region: 'Île-de-France' },
    }),
    prisma.department.upsert({
      where: { code: '92' },
      update: {},
      create: { code: '92', name: 'Hauts-de-Seine', region: 'Île-de-France' },
    }),
    prisma.department.upsert({
      where: { code: '93' },
      update: {},
      create: {
        code: '93',
        name: 'Seine-Saint-Denis',
        region: 'Île-de-France',
      },
    }),
    prisma.department.upsert({
      where: { code: '94' },
      update: {},
      create: { code: '94', name: 'Val-de-Marne', region: 'Île-de-France' },
    }),
    prisma.department.upsert({
      where: { code: '77' },
      update: {},
      create: { code: '77', name: 'Seine-et-Marne', region: 'Île-de-France' },
    }),
  ]);

  const [paris, hautseDeSeine, seineSaintDenis, valDeMarne, seineMarne] =
    departments;

  // ── Beneficiaries ─────────────────────────────────────────────────────────────
  const alice = await prisma.beneficiary.upsert({
    where: { email: 'alice.martin@email.fr' },
    update: {},
    create: {
      firstName: 'Alice',
      lastName: 'Martin',
      email: 'alice.martin@email.fr',
      phone: '0612345678',
      birthDate: new Date('1998-03-15'),
      socialSecurityNumber: '298031512345678',
      status: BeneficiaryStatus.STUDENT,
      residenceDepartmentId: paris.id,
      workStudyDepartmentId: hautseDeSeine.id,
    },
  });

  const bernard = await prisma.beneficiary.upsert({
    where: { email: 'bernard.dupont@email.fr' },
    update: {},
    create: {
      firstName: 'Bernard',
      lastName: 'Dupont',
      email: 'bernard.dupont@email.fr',
      phone: '0623456789',
      birthDate: new Date('1955-07-22'),
      socialSecurityNumber: '155072212345678',
      status: BeneficiaryStatus.SENIOR,
      residenceDepartmentId: hautseDeSeine.id,
      workStudyDepartmentId: null,
    },
  });

  const clara = await prisma.beneficiary.upsert({
    where: { email: 'clara.petit@email.fr' },
    update: {},
    create: {
      firstName: 'Clara',
      lastName: 'Petit',
      email: 'clara.petit@email.fr',
      phone: '0634567890',
      birthDate: new Date('1990-11-05'),
      socialSecurityNumber: '290112312345678',
      status: BeneficiaryStatus.DISABLED,
      residenceDepartmentId: seineSaintDenis.id,
      workStudyDepartmentId: paris.id,
    },
  });

  const theo = await prisma.beneficiary.upsert({
    where: { email: 'theo.moreau@email.fr' },
    update: {},
    create: {
      firstName: 'Théo',
      lastName: 'Moreau',
      email: 'theo.moreau@email.fr',
      phone: null,
      birthDate: new Date('2010-04-30'),
      socialSecurityNumber: null,
      status: BeneficiaryStatus.MINOR,
      residenceDepartmentId: valDeMarne.id,
      workStudyDepartmentId: null,
    },
  });

  const emma = await prisma.beneficiary.upsert({
    where: { email: 'emma.leroy@email.fr' },
    update: {},
    create: {
      firstName: 'Emma',
      lastName: 'Leroy',
      email: 'emma.leroy@email.fr',
      phone: '0645678901',
      birthDate: new Date('1985-09-18'),
      socialSecurityNumber: '285092312345678',
      status: BeneficiaryStatus.UNEMPLOYED,
      residenceDepartmentId: seineMarne.id,
      workStudyDepartmentId: null,
    },
  });

  // ── Addresses ─────────────────────────────────────────────────────────────────

  const addressAlice = await prisma.address.upsert({
    where: { id: 1 },
    update: {},
    create: {
      beneficiaryId: alice.id,
      type: AddressType.home,
      isDefault: true,
      line1: '12 rue de la République',
      city: 'Paris',
      postalCode: '75011',
    },
  });

  const addressBernard = await prisma.address.upsert({
    where: { id: 2 },
    update: {},
    create: {
      beneficiaryId: bernard.id,
      type: AddressType.home,
      isDefault: true,
      line1: '5 avenue Charles de Gaulle',
      city: 'Neuilly-sur-Seine',
      postalCode: '92200',
    },
  });

  await prisma.address.upsert({
    where: { id: 3 },
    update: {},
    create: {
      beneficiaryId: clara.id,
      type: AddressType.home,
      isDefault: true,
      line1: '8 rue Jean Jaurès',
      line2: 'Bâtiment B, 3e étage',
      city: 'Saint-Denis',
      postalCode: '93200',
    },
  });

  await prisma.address.upsert({
    where: { id: 4 },
    update: {},
    create: {
      beneficiaryId: theo.id,
      type: AddressType.home,
      isDefault: true,
      line1: '20 rue des Tilleuls',
      city: 'Créteil',
      postalCode: '94000',
    },
  });

  await prisma.address.upsert({
    where: { id: 5 },
    update: {},
    create: {
      beneficiaryId: emma.id,
      type: AddressType.home,
      isDefault: true,
      line1: '3 place de la Mairie',
      city: 'Melun',
      postalCode: '77000',
    },
  });

  // ── Status verifications ──────────────────────────────────────────────────────

  // Alice : étudiante vérifiée via API
  await prisma.statusVerification.upsert({
    where: { id: 1 },
    update: {},
    create: {
      beneficiaryId: alice.id,
      status: BeneficiaryStatus.STUDENT,
      source: VerificationSource.STATE_API,
      verified: true,
      apiName: 'API Étudiant',
      apiReference: 'STU-2024-00123',
      apiQueriedAt: new Date('2024-09-01'),
      validFrom: new Date('2024-09-01'),
      validUntil: new Date('2025-06-30'),
    },
  });

  // Bernard : senior vérifié via justificatif
  await prisma.statusVerification.upsert({
    where: { id: 2 },
    update: {},
    create: {
      beneficiaryId: bernard.id,
      status: BeneficiaryStatus.SENIOR,
      source: VerificationSource.MANUAL_DOCUMENT,
      verified: true,
      documentUrl: 'https://storage.navigo.fr/docs/bernard-dupont-cni.pdf',
      expirationDate: new Date('2030-07-22'),
      validFrom: new Date('2020-07-22'),
      validUntil: null,
    },
  });

  // Clara : handicap vérifié via API
  await prisma.statusVerification.upsert({
    where: { id: 3 },
    update: {},
    create: {
      beneficiaryId: clara.id,
      status: BeneficiaryStatus.DISABLED,
      source: VerificationSource.STATE_API,
      verified: true,
      apiName: 'API Particulier - MDPH',
      apiReference: 'MDPH-93-2023-00456',
      apiQueriedAt: new Date('2023-01-15'),
      validFrom: new Date('2023-01-15'),
      validUntil: new Date('2026-01-15'),
    },
  });

  // Emma : chômage déclaratif, non encore vérifié
  await prisma.statusVerification.upsert({
    where: { id: 4 },
    update: {},
    create: {
      beneficiaryId: emma.id,
      status: BeneficiaryStatus.UNEMPLOYED,
      source: VerificationSource.DECLARATIVE,
      verified: false,
      validFrom: new Date('2024-06-01'),
      validUntil: new Date('2025-06-01'),
    },
  });

  // ── Accounts ──────────────────────────────────────────────────────────────────
  const passwordHash = await hash('Password123!', 10);

  // Compte lié à Alice
  const accountAlice = await prisma.account.upsert({
    where: { email: 'alice.martin@email.fr' },
    update: {},
    create: {
      email: 'alice.martin@email.fr',
      passwordHash,
      accountNumber: 'ACC-000001',
      beneficiaryId: alice.id,
    },
  });

  // Compte lié à Bernard
  const accountBernard = await prisma.account.upsert({
    where: { email: 'bernard.dupont@email.fr' },
    update: {},
    create: {
      email: 'bernard.dupont@email.fr',
      passwordHash,
      accountNumber: 'ACC-000002',
      beneficiaryId: bernard.id,
    },
  });

  // Compte du père de Théo (non lié à un beneficiary propre)
  const accountPereTheo = await prisma.account.upsert({
    where: { email: 'pierre.moreau@email.fr' },
    update: {},
    create: {
      email: 'pierre.moreau@email.fr',
      passwordHash,
      accountNumber: 'ACC-000003',
      beneficiaryId: null, // compte sans beneficiary direct
    },
  });

  // Compte lié à Clara
  const accountClara = await prisma.account.upsert({
    where: { email: 'clara.petit@email.fr' },
    update: {},
    create: {
      email: 'clara.petit@email.fr',
      passwordHash,
      accountNumber: 'ACC-000004',
      beneficiaryId: clara.id,
    },
  });

  // ── Subscriptions ─────────────────────────────────────────────────────────────
  // navigoNumber et status (blocked/active du pass) ont migré vers Pass.
  // Subscription.status reste le statut du CONTRAT (active/expired/cancelled),
  // indépendant du fait que le support physique ait été perdu/volé.

  // Alice : abonnement étudiant, elle paie elle-même
  const subAlice = await prisma.subscription.upsert({
    where: { id: 1 },
    update: {},
    create: {
      beneficiaryId: alice.id,
      referrerId: accountAlice.id,
      payerId: accountAlice.id,
      subscriptionType: 'Navigo Mois Étudiant',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-06-30'),
      status: 'active',
    },
  });

  // Bernard : abonnement senior — toujours actif, c'est le PASS qui sera bloqué
  const subBernard = await prisma.subscription.upsert({
    where: { id: 2 },
    update: {},
    create: {
      beneficiaryId: bernard.id,
      referrerId: accountBernard.id,
      payerId: accountBernard.id,
      subscriptionType: 'Navigo Mois Senior',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      status: 'active',
    },
  });

  // Théo : abonnement mineur, le père est référant et payeur
  const subTheo = await prisma.subscription.upsert({
    where: { id: 3 },
    update: {},
    create: {
      beneficiaryId: theo.id,
      referrerId: accountPereTheo.id,
      payerId: accountPereTheo.id,
      subscriptionType: 'Navigo Mois Imagine R',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-06-30'),
      status: 'active',
    },
  });

  // Clara : abonnement handicap, référant = Clara, payeur = Clara
  const subClara = await prisma.subscription.upsert({
    where: { id: 4 },
    update: {},
    create: {
      beneficiaryId: clara.id,
      referrerId: accountClara.id,
      payerId: accountClara.id,
      subscriptionType: 'Navigo Mois PMR',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2025-02-28'),
      status: 'active',
    },
  });

  // ── Passes ────────────────────────────────────────────────────────────────────
  // Un seul pass ACTIVE par abonnement à la fois. Pour Bernard (volé), l'ancien
  // pass passe en "blocked" et un nouveau pass "active" est émis — c'est ce
  // nouveau pass qui reçoit la livraison de remplacement.

  const passAlice = await prisma.pass.upsert({
    where: { navigoNumber: 'NAV-2024-001' },
    update: {},
    create: {
      subscriptionId: subAlice.id,
      navigoNumber: 'NAV-2024-001',
      status: PassStatus.active,
      issuedAt: new Date('2024-08-25'),
    },
  });

  // Pass original de Bernard, désormais bloqué (volé)
  const passBernardOld = await prisma.pass.upsert({
    where: { navigoNumber: 'NAV-2024-002' },
    update: {},
    create: {
      subscriptionId: subBernard.id,
      navigoNumber: 'NAV-2024-002',
      status: PassStatus.blocked,
      issuedAt: new Date('2024-01-01'),
    },
  });

  // Pass de remplacement de Bernard, actif — un seul pass actif par abonnement
  const passBernardNew = await prisma.pass.upsert({
    where: { navigoNumber: 'NAV-2024-002-R1' },
    update: {},
    create: {
      subscriptionId: subBernard.id,
      navigoNumber: 'NAV-2024-002-R1',
      status: PassStatus.active,
      issuedAt: new Date('2024-11-20'),
    },
  });

  const passTheo = await prisma.pass.upsert({
    where: { navigoNumber: 'NAV-2024-003' },
    update: {},
    create: {
      subscriptionId: subTheo.id,
      navigoNumber: 'NAV-2024-003',
      status: PassStatus.active,
      issuedAt: new Date('2024-09-01'),
    },
  });

  const passClara = await prisma.pass.upsert({
    where: { navigoNumber: 'NAV-2024-004' },
    update: {},
    create: {
      subscriptionId: subClara.id,
      navigoNumber: 'NAV-2024-004',
      status: PassStatus.active,
      issuedAt: new Date('2024-03-01'),
    },
  });

  // ── Deliveries ────────────────────────────────────────────────────────────────
  // Chaque livraison concerne un PASS précis, pas l'abonnement directement.

  // Alice : livraison initiale, déjà reçue
  await prisma.delivery.upsert({
    where: { id: 1 },
    update: {},
    create: {
      passId: passAlice.id,
      addressId: addressAlice.id,
      reason: DeliveryReason.initial_order,
      status: DeliveryStatus.delivered,
      orderedAt: new Date('2024-08-25'),
      estimatedAt: new Date('2024-09-01'),
      trackingNumber: '8R0001112223FR',
    },
  });

  // Bernard : livraison initiale de son premier pass, déjà reçue
  await prisma.delivery.upsert({
    where: { id: 2 },
    update: {},
    create: {
      passId: passBernardOld.id,
      addressId: addressBernard.id,
      reason: DeliveryReason.initial_order,
      status: DeliveryStatus.delivered,
      orderedAt: new Date('2023-12-20'),
      estimatedAt: new Date('2024-01-01'),
      trackingNumber: '8R0009998887FR',
    },
  });

  // Bernard : pass volé -> livraison du pass de remplacement, en cours d'expédition
  await prisma.delivery.upsert({
    where: { id: 3 },
    update: {},
    create: {
      passId: passBernardNew.id,
      addressId: addressBernard.id,
      reason: DeliveryReason.stolen,
      status: DeliveryStatus.shipped,
      orderedAt: new Date('2024-11-20'),
      estimatedAt: new Date('2024-11-29'),
      trackingNumber: '2C4567891234FR',
    },
  });

  // ── Pass usages ───────────────────────────────────────────────────────────────
  // Quelques validations dans le mois en cours, pour Alice et Théo, afin de
  // pouvoir tester un compteur "utilisations ce mois-ci".

  await prisma.passUsage.createMany({
    skipDuplicates: true,
    data: [
      {
        passId: passAlice.id,
        usedAt: new Date('2024-11-04T08:12:00'),
        station: 'Châtelet',
      },
      {
        passId: passAlice.id,
        usedAt: new Date('2024-11-04T18:30:00'),
        station: 'Nation',
      },
      {
        passId: passAlice.id,
        usedAt: new Date('2024-11-05T08:05:00'),
        station: 'Châtelet',
      },
      {
        passId: passTheo.id,
        usedAt: new Date('2024-11-06T07:50:00'),
        station: 'Créteil-Préfecture',
      },
      {
        passId: passTheo.id,
        usedAt: new Date('2024-11-06T17:15:00'),
        station: 'Créteil-Préfecture',
      },
    ],
  });

  // ── Payments ──────────────────────────────────────────────────────────────────

  // Alice : 3 mensualités
  await prisma.payment.createMany({
    skipDuplicates: true,
    data: [
      {
        subscriptionId: subAlice.id,
        amount: 38.1,
        paidAt: new Date('2024-09-01'),
        method: 'card',
        status: 'succeeded',
      },
      {
        subscriptionId: subAlice.id,
        amount: 38.1,
        paidAt: new Date('2024-10-01'),
        method: 'card',
        status: 'succeeded',
      },
      {
        subscriptionId: subAlice.id,
        amount: 38.1,
        paidAt: new Date('2024-11-01'),
        method: 'card',
        status: 'succeeded',
      },
    ],
  });

  // Bernard : abonnement actuel
  await prisma.payment.createMany({
    skipDuplicates: true,
    data: [
      {
        subscriptionId: subBernard.id,
        amount: 51.75,
        paidAt: new Date('2024-01-01'),
        method: 'direct_debit',
        status: 'succeeded',
      },
      {
        subscriptionId: subBernard.id,
        amount: 51.75,
        paidAt: new Date('2024-02-01'),
        method: 'direct_debit',
        status: 'succeeded',
      },
      {
        subscriptionId: subBernard.id,
        amount: 51.75,
        paidAt: new Date('2024-03-01'),
        method: 'direct_debit',
        status: 'failed',
      },
      {
        subscriptionId: subBernard.id,
        amount: 51.75,
        paidAt: new Date('2024-03-05'),
        method: 'direct_debit',
        status: 'succeeded',
      },
    ],
  });

  // Théo : payé par le père
  await prisma.payment.createMany({
    skipDuplicates: true,
    data: [
      {
        subscriptionId: subTheo.id,
        amount: 19.1,
        paidAt: new Date('2024-09-01'),
        method: 'card',
        status: 'succeeded',
      },
      {
        subscriptionId: subTheo.id,
        amount: 19.1,
        paidAt: new Date('2024-10-01'),
        method: 'card',
        status: 'succeeded',
      },
    ],
  });

  // Clara
  await prisma.payment.createMany({
    skipDuplicates: true,
    data: [
      {
        subscriptionId: subClara.id,
        amount: 22.5,
        paidAt: new Date('2024-03-01'),
        method: 'card',
        status: 'succeeded',
      },
      {
        subscriptionId: subClara.id,
        amount: 22.5,
        paidAt: new Date('2024-04-01'),
        method: 'card',
        status: 'succeeded',
      },
    ],
  });

  console.log('✅ Seed terminé');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
