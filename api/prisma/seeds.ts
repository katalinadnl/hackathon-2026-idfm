import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcrypt';
import { PrismaClient } from '../src/generated/prisma/client';
import {
  BeneficiaryStatus,
  PaymentMode,
  VerificationSource,
} from '../src/generated/prisma/enums';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // ── Departments ──────────────────────────────────────────────────────────────
  const departments = await Promise.all([
    prisma.department.upsert({ where: { code: '75' }, update: {}, create: { code: '75', name: 'Paris', region: 'Île-de-France' } }),
    prisma.department.upsert({ where: { code: '92' }, update: {}, create: { code: '92', name: 'Hauts-de-Seine', region: 'Île-de-France' } }),
    prisma.department.upsert({ where: { code: '93' }, update: {}, create: { code: '93', name: 'Seine-Saint-Denis', region: 'Île-de-France' } }),
    prisma.department.upsert({ where: { code: '94' }, update: {}, create: { code: '94', name: 'Val-de-Marne', region: 'Île-de-France' } }),
    prisma.department.upsert({ where: { code: '77' }, update: {}, create: { code: '77', name: 'Seine-et-Marne', region: 'Île-de-France' } }),
    prisma.department.upsert({ where: { code: '78' }, update: {}, create: { code: '78', name: 'Yvelines', region: 'Île-de-France' } }),
    prisma.department.upsert({ where: { code: '91' }, update: {}, create: { code: '91', name: 'Essonne', region: 'Île-de-France' } }),
    prisma.department.upsert({ where: { code: '95' }, update: {}, create: { code: '95', name: "Val-d'Oise", region: 'Île-de-France' } }),
  ]);
  const [paris, hauts92, seine93, val94, seine77, yvelines78, essonne91, valdoise95] = departments;

  // ── Beneficiaries (15 personnes) ─────────────────────────────────────────────
  // Famille Moreau : Pierre (père, actif), Théo (fils 15 ans, mineur), Léa (fille 12 ans, mineur)
  // Famille Moreau élargie : Monique (grand-mère de Théo/Léa, senior)
  //   → Pierre est référent de Théo, Léa et Monique
  //   → Monique (senior) paie elle-même son pass, mais c'est elle qui paie aussi celui de Pierre
  // Autres : Alice (étudiante), Bernard (senior), Clara (handicap), Emma (chômage),
  //          Hugo (actif), Fatima (active), Lucas (étudiant), Nadia (active),
  //          Olivier (actif, pas de pass), Sophie (active, pas de pass)

  const pierre = await prisma.beneficiary.upsert({
    where: { email: 'pierre.moreau@email.fr' },
    update: {},
    create: { firstName: 'Pierre', lastName: 'Moreau', email: 'pierre.moreau@email.fr', phone: '0611111111', birthDate: new Date('1980-06-12'), socialSecurityNumber: '180061212345678', status: BeneficiaryStatus.ACTIVE, residenceDepartmentId: val94.id, workStudyDepartmentId: paris.id },
  });
  const theo = await prisma.beneficiary.upsert({
    where: { email: 'theo.moreau@email.fr' },
    update: {},
    create: { firstName: 'Théo', lastName: 'Moreau', email: 'theo.moreau@email.fr', phone: null, birthDate: new Date('2011-04-30'), socialSecurityNumber: null, status: BeneficiaryStatus.MINOR, residenceDepartmentId: val94.id },
  });
  const lea = await prisma.beneficiary.upsert({
    where: { email: 'lea.moreau@email.fr' },
    update: {},
    create: { firstName: 'Léa', lastName: 'Moreau', email: 'lea.moreau@email.fr', phone: null, birthDate: new Date('2014-09-15'), socialSecurityNumber: null, status: BeneficiaryStatus.MINOR, residenceDepartmentId: val94.id },
  });
  const monique = await prisma.beneficiary.upsert({
    where: { email: 'monique.moreau@email.fr' },
    update: {},
    create: { firstName: 'Monique', lastName: 'Moreau', email: 'monique.moreau@email.fr', phone: '0622222222', birthDate: new Date('1950-01-08'), socialSecurityNumber: '150011212345678', status: BeneficiaryStatus.SENIOR, residenceDepartmentId: val94.id },
  });

  const alice = await prisma.beneficiary.upsert({
    where: { email: 'alice.martin@email.fr' },
    update: {},
    create: { firstName: 'Alice', lastName: 'Martin', email: 'alice.martin@email.fr', phone: '0612345678', birthDate: new Date('1998-03-15'), socialSecurityNumber: '298031512345678', status: BeneficiaryStatus.STUDENT, residenceDepartmentId: paris.id, workStudyDepartmentId: hauts92.id },
  });
  const bernard = await prisma.beneficiary.upsert({
    where: { email: 'bernard.dupont@email.fr' },
    update: {},
    create: { firstName: 'Bernard', lastName: 'Dupont', email: 'bernard.dupont@email.fr', phone: '0623456789', birthDate: new Date('1955-07-22'), socialSecurityNumber: '155072212345678', status: BeneficiaryStatus.SENIOR, residenceDepartmentId: hauts92.id },
  });
  const clara = await prisma.beneficiary.upsert({
    where: { email: 'clara.petit@email.fr' },
    update: {},
    create: { firstName: 'Clara', lastName: 'Petit', email: 'clara.petit@email.fr', phone: '0634567890', birthDate: new Date('1990-11-05'), socialSecurityNumber: '290112312345678', status: BeneficiaryStatus.DISABLED, residenceDepartmentId: seine93.id, workStudyDepartmentId: paris.id },
  });
  const emma = await prisma.beneficiary.upsert({
    where: { email: 'emma.leroy@email.fr' },
    update: {},
    create: { firstName: 'Emma', lastName: 'Leroy', email: 'emma.leroy@email.fr', phone: '0645678901', birthDate: new Date('1985-09-18'), socialSecurityNumber: '285092312345678', status: BeneficiaryStatus.UNEMPLOYED, residenceDepartmentId: seine77.id },
  });
  const hugo = await prisma.beneficiary.upsert({
    where: { email: 'hugo.garcia@email.fr' },
    update: {},
    create: { firstName: 'Hugo', lastName: 'Garcia', email: 'hugo.garcia@email.fr', phone: '0656789012', birthDate: new Date('1992-02-28'), socialSecurityNumber: '192022812345678', status: BeneficiaryStatus.ACTIVE, residenceDepartmentId: yvelines78.id, workStudyDepartmentId: paris.id },
  });
  const fatima = await prisma.beneficiary.upsert({
    where: { email: 'fatima.benali@email.fr' },
    update: {},
    create: { firstName: 'Fatima', lastName: 'Benali', email: 'fatima.benali@email.fr', phone: '0667890123', birthDate: new Date('1988-12-03'), socialSecurityNumber: '288121212345678', status: BeneficiaryStatus.ACTIVE, residenceDepartmentId: essonne91.id, workStudyDepartmentId: paris.id },
  });
  const lucas = await prisma.beneficiary.upsert({
    where: { email: 'lucas.roux@email.fr' },
    update: {},
    create: { firstName: 'Lucas', lastName: 'Roux', email: 'lucas.roux@email.fr', phone: '0678901234', birthDate: new Date('2001-08-20'), socialSecurityNumber: '201082012345678', status: BeneficiaryStatus.STUDENT, residenceDepartmentId: valdoise95.id, workStudyDepartmentId: paris.id },
  });
  const nadia = await prisma.beneficiary.upsert({
    where: { email: 'nadia.cohen@email.fr' },
    update: {},
    create: { firstName: 'Nadia', lastName: 'Cohen', email: 'nadia.cohen@email.fr', phone: '0689012345', birthDate: new Date('1978-05-14'), socialSecurityNumber: '278051412345678', status: BeneficiaryStatus.ACTIVE, residenceDepartmentId: paris.id, workStudyDepartmentId: hauts92.id },
  });
  const olivier = await prisma.beneficiary.upsert({
    where: { email: 'olivier.blanc@email.fr' },
    update: {},
    create: { firstName: 'Olivier', lastName: 'Blanc', email: 'olivier.blanc@email.fr', phone: '0690123456', birthDate: new Date('1995-11-30'), socialSecurityNumber: '195111212345678', status: BeneficiaryStatus.ACTIVE, residenceDepartmentId: hauts92.id },
  });
  const sophie = await prisma.beneficiary.upsert({
    where: { email: 'sophie.lambert@email.fr' },
    update: {},
    create: { firstName: 'Sophie', lastName: 'Lambert', email: 'sophie.lambert@email.fr', phone: '0601234567', birthDate: new Date('1999-07-07'), socialSecurityNumber: '299071212345678', status: BeneficiaryStatus.ACTIVE, residenceDepartmentId: seine93.id },
  });
  const youssef = await prisma.beneficiary.upsert({
    where: { email: 'youssef.amrani@email.fr' },
    update: {},
    create: { firstName: 'Youssef', lastName: 'Amrani', email: 'youssef.amrani@email.fr', phone: '0612349876', birthDate: new Date('1975-03-25'), socialSecurityNumber: '175031212345678', status: BeneficiaryStatus.ACTIVE, residenceDepartmentId: paris.id, workStudyDepartmentId: seine93.id },
  });

  // ── Status verifications ──────────────────────────────────────────────────────
  await prisma.statusVerification.deleteMany();
  await prisma.statusVerification.createMany({
    data: [
      { beneficiaryId: alice.id, status: BeneficiaryStatus.STUDENT, source: VerificationSource.STATE_API, verified: true, apiName: 'API Étudiant', apiReference: 'STU-2025-00123', apiQueriedAt: new Date('2025-09-01'), validFrom: new Date('2025-09-01'), validUntil: new Date('2026-06-30') },
      { beneficiaryId: bernard.id, status: BeneficiaryStatus.SENIOR, source: VerificationSource.MANUAL_DOCUMENT, verified: true, documentUrl: 'https://storage.navigo.fr/docs/bernard-cni.pdf', expirationDate: new Date('2030-07-22'), validFrom: new Date('2020-07-22') },
      { beneficiaryId: clara.id, status: BeneficiaryStatus.DISABLED, source: VerificationSource.STATE_API, verified: true, apiName: 'API Particulier - MDPH', apiReference: 'MDPH-93-2023-00456', apiQueriedAt: new Date('2023-01-15'), validFrom: new Date('2023-01-15'), validUntil: new Date('2027-01-15') },
      { beneficiaryId: emma.id, status: BeneficiaryStatus.UNEMPLOYED, source: VerificationSource.DECLARATIVE, verified: false, validFrom: new Date('2026-01-01'), validUntil: new Date('2026-12-31') },
      { beneficiaryId: monique.id, status: BeneficiaryStatus.SENIOR, source: VerificationSource.MANUAL_DOCUMENT, verified: true, documentUrl: 'https://storage.navigo.fr/docs/monique-cni.pdf', expirationDate: new Date('2028-01-08'), validFrom: new Date('2018-01-08') },
      { beneficiaryId: lucas.id, status: BeneficiaryStatus.STUDENT, source: VerificationSource.STATE_API, verified: true, apiName: 'API Étudiant', apiReference: 'STU-2025-00789', apiQueriedAt: new Date('2025-09-01'), validFrom: new Date('2025-09-01'), validUntil: new Date('2026-06-30') },
    ],
  });

  // ── Clean up old data (order matters for FK constraints) ───────────────────
  await prisma.payment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.account.deleteMany();

  // ── Accounts (20 comptes) ────────────────────────────────────────────────────
  const passwordHash = await hash('Password123!', 10);
  const mk = (email: string, num: string, benId: number | null, role: 'client' | 'admin' = 'client') =>
    prisma.account.upsert({ where: { email }, update: {}, create: { email, passwordHash, accountNumber: num, beneficiaryId: benId, role } });

  const accPierre   = await mk('pierre.moreau@email.fr',   'ACC-000001', pierre.id);
  const accMonique  = await mk('monique.moreau@email.fr',  'ACC-000002', monique.id);
  const accAlice    = await mk('alice.martin@email.fr',    'ACC-000003', alice.id);
  const accBernard  = await mk('bernard.dupont@email.fr',  'ACC-000004', bernard.id);
  const accClara    = await mk('clara.petit@email.fr',     'ACC-000005', clara.id);
  const accEmma     = await mk('emma.leroy@email.fr',      'ACC-000006', emma.id);
  const accHugo     = await mk('hugo.garcia@email.fr',     'ACC-000007', hugo.id);
  const accFatima   = await mk('fatima.benali@email.fr',   'ACC-000008', fatima.id);
  const accLucas    = await mk('lucas.roux@email.fr',      'ACC-000009', lucas.id);
  const accNadia    = await mk('nadia.cohen@email.fr',     'ACC-000010', nadia.id);
  const accOlivier  = await mk('olivier.blanc@email.fr',   'ACC-000011', olivier.id);  // pas de pass
  const accSophie   = await mk('sophie.lambert@email.fr',  'ACC-000012', sophie.id);   // pas de pass
  const accYoussef  = await mk('youssef.amrani@email.fr',  'ACC-000013', youssef.id);
  // Comptes sans bénéficiaire direct (parents qui gèrent pour d'autres)
  const accCaroline = await mk('caroline.moreau@email.fr', 'ACC-000014', null); // mère de Théo/Léa, pas bénéficiaire
  // Comptes admin
  const accAdmin    = await mk('admin@idfm.fr',            'ACC-000015', null, 'admin');
  // Comptes "vides" — inscrits mais n'ont rien fait
  await mk('marc.henry@email.fr',     'ACC-000016', null);
  await mk('julie.fournier@email.fr', 'ACC-000017', null);
  await mk('david.nguyen@email.fr',   'ACC-000018', null);
  await mk('camille.robert@email.fr', 'ACC-000019', null);
  await mk('thomas.girard@email.fr',  'ACC-000020', null);

  // ── Subscriptions ─────────────────────────────────────────────────────────────
  //
  // Famille Moreau :
  //   Pierre   → Navigo Annuel, SEPA mensuel, paie lui-même, référent = Pierre
  //   Théo     → Imagine R, SEPA mensuel, référent = Pierre, payeur = Pierre
  //   Léa      → Imagine R, SEPA mensuel, référent = Pierre, payeur = Pierre
  //   Monique  → Navigo Annuel Senior, SEPA une fois, paie elle-même, référent = Pierre
  //   Pierre 2 → le pass de Pierre est AUSSI payé par Monique (la grand-mère paie pour lui)
  //
  // Autres :
  //   Alice    → Navigo Annuel Étudiant, SEPA mensuel
  //   Bernard  → Navigo Annuel Senior, SEPA annuel une fois
  //   Clara    → Navigo Annuel PMR, CB une fois
  //   Hugo     → Navigo Annuel, CB une fois
  //   Fatima   → Navigo Annuel, SEPA mensuel
  //   Lucas    → Imagine R (étudiant), SEPA mensuel
  //   Nadia    → Navigo Annuel, SEPA mensuel (2 mois impayés)
  //   Youssef  → Navigo Annuel, SEPA annuel une fois (impayé)
  //   Emma     → Navigo Solidarité, CB une fois (chômage, tarif réduit)

  // Pierre : actif, SEPA mensuel, payé par Monique (grand-mère)
  const subPierre = await prisma.subscription.upsert({
    where: { navigoNumber: 'NAV-2026-001' },
    update: {},
    create: { beneficiaryId: pierre.id, referrerId: accPierre.id, payerId: accMonique.id, navigoNumber: 'NAV-2026-001', subscriptionType: 'Navigo Annuel', startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31'), status: 'active', paymentMode: PaymentMode.SEPA_MONTHLY, annualAmount: 924.0, monthlyAmount: 77.0 },
  });

  // Théo : mineur, SEPA mensuel, référent + payeur = Pierre
  const subTheo = await prisma.subscription.upsert({
    where: { navigoNumber: 'NAV-2026-002' },
    update: {},
    create: { beneficiaryId: theo.id, referrerId: accPierre.id, payerId: accPierre.id, navigoNumber: 'NAV-2026-002', subscriptionType: 'Imagine R', startDate: new Date('2025-09-01'), endDate: new Date('2026-08-31'), status: 'active', paymentMode: PaymentMode.SEPA_MONTHLY, annualAmount: 350.0, monthlyAmount: 35.0 },
  });

  // Léa : mineur, SEPA mensuel, référent + payeur = Pierre
  const subLea = await prisma.subscription.upsert({
    where: { navigoNumber: 'NAV-2026-003' },
    update: {},
    create: { beneficiaryId: lea.id, referrerId: accPierre.id, payerId: accPierre.id, navigoNumber: 'NAV-2026-003', subscriptionType: 'Imagine R', startDate: new Date('2025-09-01'), endDate: new Date('2026-08-31'), status: 'active', paymentMode: PaymentMode.SEPA_MONTHLY, annualAmount: 350.0, monthlyAmount: 35.0 },
  });

  // Monique : senior, SEPA annuel une fois, référent = Pierre
  const subMonique = await prisma.subscription.upsert({
    where: { navigoNumber: 'NAV-2026-004' },
    update: {},
    create: { beneficiaryId: monique.id, referrerId: accPierre.id, payerId: accMonique.id, navigoNumber: 'NAV-2026-004', subscriptionType: 'Navigo Annuel Senior', startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31'), status: 'active', paymentMode: PaymentMode.SEPA_ONCE, annualAmount: 621.0, monthlyAmount: null },
  });

  // Alice : étudiante, SEPA mensuel
  const subAlice = await prisma.subscription.upsert({
    where: { navigoNumber: 'NAV-2026-005' },
    update: {},
    create: { beneficiaryId: alice.id, referrerId: accAlice.id, payerId: accAlice.id, navigoNumber: 'NAV-2026-005', subscriptionType: 'Navigo Annuel Étudiant', startDate: new Date('2025-09-01'), endDate: new Date('2026-08-31'), status: 'active', paymentMode: PaymentMode.SEPA_MONTHLY, annualAmount: 381.0, monthlyAmount: 38.1 },
  });

  // Bernard : senior, SEPA annuel une fois
  const subBernard = await prisma.subscription.upsert({
    where: { navigoNumber: 'NAV-2026-006' },
    update: {},
    create: { beneficiaryId: bernard.id, referrerId: accBernard.id, payerId: accBernard.id, navigoNumber: 'NAV-2026-006', subscriptionType: 'Navigo Annuel Senior', startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31'), status: 'active', paymentMode: PaymentMode.SEPA_ONCE, annualAmount: 621.0, monthlyAmount: null },
  });

  // Clara : handicap, CB une fois
  const subClara = await prisma.subscription.upsert({
    where: { navigoNumber: 'NAV-2026-007' },
    update: {},
    create: { beneficiaryId: clara.id, referrerId: accClara.id, payerId: accClara.id, navigoNumber: 'NAV-2026-007', subscriptionType: 'Navigo Annuel PMR', startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31'), status: 'active', paymentMode: PaymentMode.CARD_ONCE, annualAmount: 270.0, monthlyAmount: null },
  });

  // Hugo : actif, CB une fois
  const subHugo = await prisma.subscription.upsert({
    where: { navigoNumber: 'NAV-2026-008' },
    update: {},
    create: { beneficiaryId: hugo.id, referrerId: accHugo.id, payerId: accHugo.id, navigoNumber: 'NAV-2026-008', subscriptionType: 'Navigo Annuel', startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31'), status: 'active', paymentMode: PaymentMode.CARD_ONCE, annualAmount: 924.0, monthlyAmount: null },
  });

  // Fatima : active, SEPA mensuel
  const subFatima = await prisma.subscription.upsert({
    where: { navigoNumber: 'NAV-2026-009' },
    update: {},
    create: { beneficiaryId: fatima.id, referrerId: accFatima.id, payerId: accFatima.id, navigoNumber: 'NAV-2026-009', subscriptionType: 'Navigo Annuel', startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31'), status: 'active', paymentMode: PaymentMode.SEPA_MONTHLY, annualAmount: 924.0, monthlyAmount: 77.0 },
  });

  // Lucas : étudiant, SEPA mensuel
  const subLucas = await prisma.subscription.upsert({
    where: { navigoNumber: 'NAV-2026-010' },
    update: {},
    create: { beneficiaryId: lucas.id, referrerId: accLucas.id, payerId: accLucas.id, navigoNumber: 'NAV-2026-010', subscriptionType: 'Imagine R', startDate: new Date('2025-09-01'), endDate: new Date('2026-08-31'), status: 'active', paymentMode: PaymentMode.SEPA_MONTHLY, annualAmount: 381.0, monthlyAmount: 38.1 },
  });

  // Nadia : active, SEPA mensuel, 2 mois impayés
  const subNadia = await prisma.subscription.upsert({
    where: { navigoNumber: 'NAV-2026-011' },
    update: {},
    create: { beneficiaryId: nadia.id, referrerId: accNadia.id, payerId: accNadia.id, navigoNumber: 'NAV-2026-011', subscriptionType: 'Navigo Annuel', startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31'), status: 'active', paymentMode: PaymentMode.SEPA_MONTHLY, annualAmount: 924.0, monthlyAmount: 77.0 },
  });

  // Youssef : actif, SEPA annuel une fois — premier prélèvement échoué
  const subYoussef = await prisma.subscription.upsert({
    where: { navigoNumber: 'NAV-2026-012' },
    update: {},
    create: { beneficiaryId: youssef.id, referrerId: accYoussef.id, payerId: accYoussef.id, navigoNumber: 'NAV-2026-012', subscriptionType: 'Navigo Annuel', startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31'), status: 'active', paymentMode: PaymentMode.SEPA_ONCE, annualAmount: 924.0, monthlyAmount: null },
  });

  // Emma : chômage, tarif solidarité, CB une fois
  const subEmma = await prisma.subscription.upsert({
    where: { navigoNumber: 'NAV-2026-013' },
    update: {},
    create: { beneficiaryId: emma.id, referrerId: accEmma.id, payerId: accEmma.id, navigoNumber: 'NAV-2026-013', subscriptionType: 'Navigo Solidarité', startDate: new Date('2026-03-01'), endDate: new Date('2027-02-28'), status: 'active', paymentMode: PaymentMode.CARD_ONCE, annualAmount: 19.95, monthlyAmount: null },
  });

  // ── Payments ──────────────────────────────────────────────────────────────────
  const monthly = (subId: number, amount: number, months: { m: string; s: string }[]) =>
    months.map(({ m, s }) => ({ subscriptionId: subId, amount, paidAt: new Date(m), method: 'direct_debit', status: s }));

  // Pierre : SEPA mensuel, jan→mai payés (payé par Monique)
  await prisma.payment.createMany({ data: monthly(subPierre.id, 77.0, [
    { m: '2026-01-05', s: 'succeeded' }, { m: '2026-02-05', s: 'succeeded' }, { m: '2026-03-05', s: 'succeeded' },
    { m: '2026-04-05', s: 'succeeded' }, { m: '2026-05-05', s: 'succeeded' },
  ]) });

  // Théo : SEPA mensuel, sept→mai payés, mai échoué
  await prisma.payment.createMany({ data: monthly(subTheo.id, 35.0, [
    { m: '2025-09-05', s: 'succeeded' }, { m: '2025-10-05', s: 'succeeded' }, { m: '2025-11-05', s: 'succeeded' },
    { m: '2025-12-05', s: 'succeeded' }, { m: '2026-01-05', s: 'succeeded' }, { m: '2026-02-05', s: 'succeeded' },
    { m: '2026-03-05', s: 'succeeded' }, { m: '2026-04-05', s: 'succeeded' }, { m: '2026-05-05', s: 'failed' },
  ]) });

  // Léa : SEPA mensuel, sept→mai tout payé
  await prisma.payment.createMany({ data: monthly(subLea.id, 35.0, [
    { m: '2025-09-05', s: 'succeeded' }, { m: '2025-10-05', s: 'succeeded' }, { m: '2025-11-05', s: 'succeeded' },
    { m: '2025-12-05', s: 'succeeded' }, { m: '2026-01-05', s: 'succeeded' }, { m: '2026-02-05', s: 'succeeded' },
    { m: '2026-03-05', s: 'succeeded' }, { m: '2026-04-05', s: 'succeeded' }, { m: '2026-05-05', s: 'succeeded' },
  ]) });

  // Monique : SEPA annuel une fois, réglé
  await prisma.payment.createMany({ data: [
    { subscriptionId: subMonique.id, amount: 621.0, paidAt: new Date('2026-01-05'), method: 'direct_debit', status: 'succeeded' },
  ] });

  // Alice : SEPA mensuel, sept→mai payés
  await prisma.payment.createMany({ data: monthly(subAlice.id, 38.1, [
    { m: '2025-09-05', s: 'succeeded' }, { m: '2025-10-05', s: 'succeeded' }, { m: '2025-11-05', s: 'succeeded' },
    { m: '2025-12-05', s: 'succeeded' }, { m: '2026-01-05', s: 'succeeded' }, { m: '2026-02-05', s: 'succeeded' },
    { m: '2026-03-05', s: 'succeeded' }, { m: '2026-04-05', s: 'succeeded' }, { m: '2026-05-05', s: 'succeeded' },
  ]) });

  // Bernard : SEPA annuel une fois, réglé
  await prisma.payment.createMany({ data: [
    { subscriptionId: subBernard.id, amount: 621.0, paidAt: new Date('2026-01-05'), method: 'direct_debit', status: 'succeeded' },
  ] });

  // Clara : CB une fois, réglé
  await prisma.payment.createMany({ data: [
    { subscriptionId: subClara.id, amount: 270.0, paidAt: new Date('2026-01-02'), method: 'card', status: 'succeeded' },
  ] });

  // Hugo : CB une fois, réglé
  await prisma.payment.createMany({ data: [
    { subscriptionId: subHugo.id, amount: 924.0, paidAt: new Date('2026-01-03'), method: 'card', status: 'succeeded' },
  ] });

  // Fatima : SEPA mensuel, jan→mai payés
  await prisma.payment.createMany({ data: monthly(subFatima.id, 77.0, [
    { m: '2026-01-05', s: 'succeeded' }, { m: '2026-02-05', s: 'succeeded' }, { m: '2026-03-05', s: 'succeeded' },
    { m: '2026-04-05', s: 'succeeded' }, { m: '2026-05-05', s: 'succeeded' },
  ]) });

  // Lucas : SEPA mensuel, sept→mai payés
  await prisma.payment.createMany({ data: monthly(subLucas.id, 38.1, [
    { m: '2025-09-05', s: 'succeeded' }, { m: '2025-10-05', s: 'succeeded' }, { m: '2025-11-05', s: 'succeeded' },
    { m: '2025-12-05', s: 'succeeded' }, { m: '2026-01-05', s: 'succeeded' }, { m: '2026-02-05', s: 'succeeded' },
    { m: '2026-03-05', s: 'succeeded' }, { m: '2026-04-05', s: 'succeeded' }, { m: '2026-05-05', s: 'succeeded' },
  ]) });

  // Nadia : SEPA mensuel, jan→mars payés, avril+mai échoués (2 impayés)
  await prisma.payment.createMany({ data: monthly(subNadia.id, 77.0, [
    { m: '2026-01-05', s: 'succeeded' }, { m: '2026-02-05', s: 'succeeded' }, { m: '2026-03-05', s: 'succeeded' },
    { m: '2026-04-05', s: 'failed' }, { m: '2026-05-05', s: 'failed' },
  ]) });

  // Youssef : SEPA annuel une fois, échoué (provision insuffisante)
  await prisma.payment.createMany({ data: [
    { subscriptionId: subYoussef.id, amount: 924.0, paidAt: new Date('2026-01-05'), method: 'direct_debit', status: 'failed' },
  ] });

  // Emma : CB une fois, réglé (tarif solidarité)
  await prisma.payment.createMany({ data: [
    { subscriptionId: subEmma.id, amount: 19.95, paidAt: new Date('2026-03-01'), method: 'card', status: 'succeeded' },
  ] });

  // Comptes sans pass : Olivier, Sophie, marc, julie, david, camille, thomas, caroline
  // → Aucun abonnement ni paiement

  console.log('✅ Seed terminé — 15 bénéficiaires, 20 comptes, 13 abonnements');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});