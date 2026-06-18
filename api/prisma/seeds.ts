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
  PaymentMode,
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
    prisma.department.upsert({
      where: { code: '78' },
      update: {},
      create: { code: '78', name: 'Yvelines', region: 'Île-de-France' },
    }),
    prisma.department.upsert({
      where: { code: '91' },
      update: {},
      create: { code: '91', name: 'Essonne', region: 'Île-de-France' },
    }),
    prisma.department.upsert({
      where: { code: '95' },
      update: {},
      create: { code: '95', name: "Val-d'Oise", region: 'Île-de-France' },
    }),
  ]);
  const [
    paris,
    hauts92,
    seine93,
    val94,
    seine77,
    yvelines78,
    essonne91,
    valdoise95,
  ] = departments;

  // ── Beneficiaries (15 personnes) ─────────────────────────────────────────────
  // email/phone n'existent plus sur Beneficiary (déplacés/retirés) : on utilise
  // donc des id fixés explicitement comme critère d'upsert plutôt qu'un email.
  //
  // Famille Moreau : Pierre (père, actif), Théo (fils 19 ans, mineur au sens
  // tarifaire scolaire), Léa (fille 12 ans, mineure)
  // Famille Moreau élargie : Monique (grand-mère de Théo/Léa, senior)
  //   → Pierre est référent de Théo, Léa et Monique
  //   → Monique (senior) paie elle-même son pass, mais c'est elle qui paie aussi celui de Pierre
  // Autres : Alice (étudiante), Bernard (senior), Clara (handicap), Emma (chômage),
  //          Hugo (actif), Fatima (active), Lucas (étudiant), Nadia (active),
  //          Olivier (actif, pas de pass), Sophie (active, pas de pass)

  const pierre = await prisma.beneficiary.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      firstName: 'Pierre',
      lastName: 'Moreau',
      birthDate: new Date('1980-06-12'),
      socialSecurityNumber: '180061212345678',
      status: BeneficiaryStatus.ACTIVE,
      residenceDepartmentId: val94.id,
      workStudyDepartmentId: paris.id,
    },
  });
  const theo = await prisma.beneficiary.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      firstName: 'Théo',
      lastName: 'Moreau',
      birthDate: new Date('2007-04-30'),
      socialSecurityNumber: null,
      status: BeneficiaryStatus.MINOR,
      residenceDepartmentId: val94.id,
    },
  });
  const lea = await prisma.beneficiary.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      firstName: 'Léa',
      lastName: 'Moreau',
      birthDate: new Date('2014-09-15'),
      socialSecurityNumber: null,
      status: BeneficiaryStatus.MINOR,
      residenceDepartmentId: val94.id,
    },
  });
  const monique = await prisma.beneficiary.upsert({
    where: { id: 4 },
    update: {},
    create: {
      id: 4,
      firstName: 'Monique',
      lastName: 'Moreau',
      birthDate: new Date('1950-01-08'),
      socialSecurityNumber: '150011212345678',
      status: BeneficiaryStatus.SENIOR,
      residenceDepartmentId: val94.id,
    },
  });

  const alice = await prisma.beneficiary.upsert({
    where: { id: 5 },
    update: {},
    create: {
      id: 5,
      firstName: 'Alice',
      lastName: 'Martin',
      birthDate: new Date('1998-03-15'),
      socialSecurityNumber: '298031512345678',
      status: BeneficiaryStatus.STUDENT,
      residenceDepartmentId: paris.id,
      workStudyDepartmentId: hauts92.id,
    },
  });
  const bernard = await prisma.beneficiary.upsert({
    where: { id: 6 },
    update: {},
    create: {
      id: 6,
      firstName: 'Bernard',
      lastName: 'Dupont',
      birthDate: new Date('1955-07-22'),
      socialSecurityNumber: '155072212345678',
      status: BeneficiaryStatus.SENIOR,
      residenceDepartmentId: hauts92.id,
    },
  });
  const clara = await prisma.beneficiary.upsert({
    where: { id: 7 },
    update: {},
    create: {
      id: 7,
      firstName: 'Clara',
      lastName: 'Petit',
      birthDate: new Date('1990-11-05'),
      socialSecurityNumber: '290112312345678',
      status: BeneficiaryStatus.DISABLED,
      residenceDepartmentId: seine93.id,
      workStudyDepartmentId: paris.id,
    },
  });
  const emma = await prisma.beneficiary.upsert({
    where: { id: 8 },
    update: {},
    create: {
      id: 8,
      firstName: 'Emma',
      lastName: 'Leroy',
      birthDate: new Date('1985-09-18'),
      socialSecurityNumber: '285092312345678',
      status: BeneficiaryStatus.UNEMPLOYED,
      residenceDepartmentId: seine77.id,
    },
  });
  const hugo = await prisma.beneficiary.upsert({
    where: { id: 9 },
    update: {},
    create: {
      id: 9,
      firstName: 'Hugo',
      lastName: 'Garcia',
      birthDate: new Date('1992-02-28'),
      socialSecurityNumber: '192022812345678',
      status: BeneficiaryStatus.ACTIVE,
      residenceDepartmentId: yvelines78.id,
      workStudyDepartmentId: paris.id,
    },
  });
  const fatima = await prisma.beneficiary.upsert({
    where: { id: 10 },
    update: {},
    create: {
      id: 10,
      firstName: 'Fatima',
      lastName: 'Benali',
      birthDate: new Date('1988-12-03'),
      socialSecurityNumber: '288121212345678',
      status: BeneficiaryStatus.ACTIVE,
      residenceDepartmentId: essonne91.id,
      workStudyDepartmentId: paris.id,
    },
  });
  const lucas = await prisma.beneficiary.upsert({
    where: { id: 11 },
    update: {},
    create: {
      id: 11,
      firstName: 'Lucas',
      lastName: 'Roux',
      birthDate: new Date('2001-08-20'),
      socialSecurityNumber: '201082012345678',
      status: BeneficiaryStatus.STUDENT,
      residenceDepartmentId: valdoise95.id,
      workStudyDepartmentId: paris.id,
    },
  });
  const nadia = await prisma.beneficiary.upsert({
    where: { id: 12 },
    update: {},
    create: {
      id: 12,
      firstName: 'Nadia',
      lastName: 'Cohen',
      birthDate: new Date('1978-05-14'),
      socialSecurityNumber: '278051412345678',
      status: BeneficiaryStatus.ACTIVE,
      residenceDepartmentId: paris.id,
      workStudyDepartmentId: hauts92.id,
    },
  });
  const olivier = await prisma.beneficiary.upsert({
    where: { id: 13 },
    update: {},
    create: {
      id: 13,
      firstName: 'Olivier',
      lastName: 'Blanc',
      birthDate: new Date('1995-11-30'),
      socialSecurityNumber: '195111212345678',
      status: BeneficiaryStatus.ACTIVE,
      residenceDepartmentId: hauts92.id,
    },
  });
  const sophie = await prisma.beneficiary.upsert({
    where: { id: 14 },
    update: {},
    create: {
      id: 14,
      firstName: 'Sophie',
      lastName: 'Lambert',
      birthDate: new Date('1999-07-07'),
      socialSecurityNumber: '299071212345678',
      status: BeneficiaryStatus.ACTIVE,
      residenceDepartmentId: seine93.id,
    },
  });
  const youssef = await prisma.beneficiary.upsert({
    where: { id: 15 },
    update: {},
    create: {
      id: 15,
      firstName: 'Youssef',
      lastName: 'Amrani',
      birthDate: new Date('1975-03-25'),
      socialSecurityNumber: '175031212345678',
      status: BeneficiaryStatus.ACTIVE,
      residenceDepartmentId: paris.id,
      workStudyDepartmentId: seine93.id,
    },
  });

  // ── Addresses ─────────────────────────────────────────────────────────────────

  const addressPierre = await prisma.address.upsert({
    where: { id: 1 },
    update: {},
    create: {
      beneficiaryId: pierre.id,
      type: AddressType.home,
      isDefault: true,
      line1: '14 rue des Lilas',
      city: 'Créteil',
      postalCode: '94000',
    },
  });

  const addressMonique = await prisma.address.upsert({
    where: { id: 2 },
    update: {},
    create: {
      beneficiaryId: monique.id,
      type: AddressType.home,
      isDefault: true,
      line1: '2 allée des Tilleuls',
      city: 'Créteil',
      postalCode: '94000',
    },
  });

  const addressAlice = await prisma.address.upsert({
    where: { id: 3 },
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
    where: { id: 4 },
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

  const addressClara = await prisma.address.upsert({
    where: { id: 5 },
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

  const addressHugo = await prisma.address.upsert({
    where: { id: 6 },
    update: {},
    create: {
      beneficiaryId: hugo.id,
      type: AddressType.home,
      isDefault: true,
      line1: '40 rue du Maréchal Foch',
      city: 'Versailles',
      postalCode: '78000',
    },
  });

  const addressFatima = await prisma.address.upsert({
    where: { id: 7 },
    update: {},
    create: {
      beneficiaryId: fatima.id,
      type: AddressType.home,
      isDefault: true,
      line1: '17 rue de Corbeil',
      city: 'Évry',
      postalCode: '91000',
    },
  });

  const addressLucas = await prisma.address.upsert({
    where: { id: 8 },
    update: {},
    create: {
      beneficiaryId: lucas.id,
      type: AddressType.home,
      isDefault: true,
      line1: '3 rue de la Gare',
      city: 'Pontoise',
      postalCode: '95300',
    },
  });

  const addressNadia = await prisma.address.upsert({
    where: { id: 9 },
    update: {},
    create: {
      beneficiaryId: nadia.id,
      type: AddressType.home,
      isDefault: true,
      line1: '9 rue de Belleville',
      city: 'Paris',
      postalCode: '75020',
    },
  });

  const addressYoussef = await prisma.address.upsert({
    where: { id: 10 },
    update: {},
    create: {
      beneficiaryId: youssef.id,
      type: AddressType.home,
      isDefault: true,
      line1: '22 boulevard Voltaire',
      city: 'Paris',
      postalCode: '75011',
    },
  });

  const addressEmma = await prisma.address.upsert({
    where: { id: 11 },
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

  // Théo et Léa habitent chez leur père, mais ont chacun leur propre adresse
  // enregistrée (utile si un pass doit leur être envoyé nominativement).
  const addressTheo = await prisma.address.upsert({
    where: { id: 12 },
    update: {},
    create: {
      beneficiaryId: theo.id,
      type: AddressType.home,
      isDefault: true,
      line1: '14 rue des Lilas',
      city: 'Créteil',
      postalCode: '94000',
    },
  });

  const addressLea = await prisma.address.upsert({
    where: { id: 13 },
    update: {},
    create: {
      beneficiaryId: lea.id,
      type: AddressType.home,
      isDefault: true,
      line1: '14 rue des Lilas',
      city: 'Créteil',
      postalCode: '94000',
    },
  });

  // ── Status verifications ──────────────────────────────────────────────────────
  await prisma.statusVerification.deleteMany();
  await prisma.statusVerification.createMany({
    data: [
      {
        beneficiaryId: alice.id,
        status: BeneficiaryStatus.STUDENT,
        source: VerificationSource.STATE_API,
        verified: true,
        apiName: 'API Étudiant',
        apiReference: 'STU-2025-00123',
        apiQueriedAt: new Date('2025-09-01'),
        validFrom: new Date('2025-09-01'),
        validUntil: new Date('2026-06-30'),
      },
      {
        beneficiaryId: bernard.id,
        status: BeneficiaryStatus.SENIOR,
        source: VerificationSource.MANUAL_DOCUMENT,
        verified: true,
        documentUrl: 'https://storage.navigo.fr/docs/bernard-cni.pdf',
        expirationDate: new Date('2030-07-22'),
        validFrom: new Date('2020-07-22'),
      },
      {
        beneficiaryId: clara.id,
        status: BeneficiaryStatus.DISABLED,
        source: VerificationSource.STATE_API,
        verified: true,
        apiName: 'API Particulier - MDPH',
        apiReference: 'MDPH-93-2023-00456',
        apiQueriedAt: new Date('2023-01-15'),
        validFrom: new Date('2023-01-15'),
        validUntil: new Date('2027-01-15'),
      },
      {
        beneficiaryId: emma.id,
        status: BeneficiaryStatus.UNEMPLOYED,
        source: VerificationSource.DECLARATIVE,
        verified: false,
        validFrom: new Date('2026-01-01'),
        validUntil: new Date('2026-12-31'),
      },
      {
        beneficiaryId: monique.id,
        status: BeneficiaryStatus.SENIOR,
        source: VerificationSource.MANUAL_DOCUMENT,
        verified: true,
        documentUrl: 'https://storage.navigo.fr/docs/monique-cni.pdf',
        expirationDate: new Date('2028-01-08'),
        validFrom: new Date('2018-01-08'),
      },
      {
        beneficiaryId: lucas.id,
        status: BeneficiaryStatus.STUDENT,
        source: VerificationSource.STATE_API,
        verified: true,
        apiName: 'API Étudiant',
        apiReference: 'STU-2025-00789',
        apiQueriedAt: new Date('2025-09-01'),
        validFrom: new Date('2025-09-01'),
        validUntil: new Date('2026-06-30'),
      },
    ],
  });

  // ── Clean up old data (order matters for FK constraints) ───────────────────
  await prisma.passUsage.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.pass.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.bankInfo.deleteMany();
  await prisma.account.deleteMany();

  // ── Accounts (20 comptes) ────────────────────────────────────────────────────
  // email reste le critère unique pour Account (il n'a pas bougé, seul
  // Beneficiary a perdu ce champ).
  const passwordHash = await hash('Password123!', 10);
  const mk = (
    email: string,
    num: string,
    benId: number | null,
    role: 'client' | 'admin' = 'client',
  ) =>
    prisma.account.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash,
        accountNumber: num,
        beneficiaryId: benId,
        role,
      },
    });

  const accPierre = await mk('pierre.moreau@email.fr', 'ACC-000001', pierre.id);
  const accMonique = await mk(
    'monique.moreau@email.fr',
    'ACC-000002',
    monique.id,
  );
  const accAlice = await mk('alice.martin@email.fr', 'ACC-000003', alice.id);
  const accBernard = await mk(
    'bernard.dupont@email.fr',
    'ACC-000004',
    bernard.id,
  );
  const accClara = await mk('clara.petit@email.fr', 'ACC-000005', clara.id);
  const accEmma = await mk('emma.leroy@email.fr', 'ACC-000006', emma.id);
  const accHugo = await mk('hugo.garcia@email.fr', 'ACC-000007', hugo.id);
  const accFatima = await mk('fatima.benali@email.fr', 'ACC-000008', fatima.id);
  const accLucas = await mk('lucas.roux@email.fr', 'ACC-000009', lucas.id);
  const accNadia = await mk('nadia.cohen@email.fr', 'ACC-000010', nadia.id);
  const accOlivier = await mk(
    'olivier.blanc@email.fr',
    'ACC-000011',
    olivier.id,
  ); // pas de pass
  const accSophie = await mk(
    'sophie.lambert@email.fr',
    'ACC-000012',
    sophie.id,
  ); // pas de pass
  const accYoussef = await mk(
    'youssef.amrani@email.fr',
    'ACC-000013',
    youssef.id,
  );
  // Comptes sans bénéficiaire direct (parents qui gèrent pour d'autres)
  const accCaroline = await mk('caroline.moreau@email.fr', 'ACC-000014', null); // mère de Théo/Léa, pas bénéficiaire
  // Comptes admin
  const accAdmin = await mk('admin@idfm.fr', 'ACC-000015', null, 'admin');
  // Comptes "vides" — inscrits mais n'ont rien fait
  await mk('marc.henry@email.fr', 'ACC-000016', null);
  await mk('julie.fournier@email.fr', 'ACC-000017', null);
  await mk('david.nguyen@email.fr', 'ACC-000018', null);
  await mk('camille.robert@email.fr', 'ACC-000019', null);
  await mk('thomas.girard@email.fr', 'ACC-000020', null);

  // ── Bank infos ────────────────────────────────────────────────────────────────
  // bankInfoId est obligatoire sur Subscription : chaque compte qui paie pour
  // au moins un abonnement a donc son propre IBAN ci-dessous. Monique a en
  // plus un IBAN dédié pour le pass de Pierre (elle gère deux paiements : le
  // sien et celui de son fils).

  const bankInfoPierre = await prisma.bankInfo.upsert({
    where: { id: 1 },
    update: {},
    create: {
      accountId: accPierre.id,
      iban: 'FR7630001007941234567890185',
      bic: 'BDFEFRPPXXX',
      holderName: 'Pierre Moreau',
      label: 'Mon compte',
      isDefault: true,
    },
  });

  const bankInfoMoniquePourElle = await prisma.bankInfo.upsert({
    where: { id: 2 },
    update: {},
    create: {
      accountId: accMonique.id,
      iban: 'FR7630003000308765432109876',
      bic: 'SOGEFRPPXXX',
      holderName: 'Monique Moreau',
      label: 'Mon compte',
      isDefault: true,
    },
  });

  // Même compte (Monique), mais un second IBAN dédié au paiement du pass
  // de son fils Pierre — illustre le cas "un compte gère plusieurs IBAN".
  const bankInfoMoniquePourPierre = await prisma.bankInfo.upsert({
    where: { id: 3 },
    update: {},
    create: {
      accountId: accMonique.id,
      iban: 'FR7610278060501234567890144',
      bic: 'CMCIFRPPXXX',
      holderName: 'Monique Moreau',
      label: 'Compte pour le pass de Pierre',
      isDefault: false,
    },
  });

  const bankInfoAlice = await prisma.bankInfo.upsert({
    where: { id: 4 },
    update: {},
    create: {
      accountId: accAlice.id,
      iban: 'FR7613807009630987654321567',
      bic: 'BNPAFRPPXXX',
      holderName: 'Alice Martin',
      label: 'Mon compte',
      isDefault: true,
    },
  });

  const bankInfoBernard = await prisma.bankInfo.upsert({
    where: { id: 5 },
    update: {},
    create: {
      accountId: accBernard.id,
      iban: 'FR7617569000401234567890123',
      bic: 'CCBPFRPPXXX',
      holderName: 'Bernard Dupont',
      label: 'Mon compte',
      isDefault: true,
    },
  });

  const bankInfoClara = await prisma.bankInfo.upsert({
    where: { id: 6 },
    update: {},
    create: {
      accountId: accClara.id,
      iban: 'FR7618206000010987654321174',
      bic: 'AGRIFRPPXXX',
      holderName: 'Clara Petit',
      label: 'Mon compte',
      isDefault: true,
    },
  });

  const bankInfoHugo = await prisma.bankInfo.upsert({
    where: { id: 7 },
    update: {},
    create: {
      accountId: accHugo.id,
      iban: 'FR7630066100410123456789012',
      bic: 'CMCIFRPPXXX',
      holderName: 'Hugo Garcia',
      label: 'Mon compte',
      isDefault: true,
    },
  });

  const bankInfoFatima = await prisma.bankInfo.upsert({
    where: { id: 8 },
    update: {},
    create: {
      accountId: accFatima.id,
      iban: 'FR7614707000501234567890187',
      bic: 'BPCEFRPPXXX',
      holderName: 'Fatima Benali',
      label: 'Mon compte',
      isDefault: true,
    },
  });

  const bankInfoLucas = await prisma.bankInfo.upsert({
    where: { id: 9 },
    update: {},
    create: {
      accountId: accLucas.id,
      iban: 'FR7611315000201234567890145',
      bic: 'CEPAFRPPXXX',
      holderName: 'Lucas Roux',
      label: 'Mon compte',
      isDefault: true,
    },
  });

  const bankInfoNadia = await prisma.bankInfo.upsert({
    where: { id: 10 },
    update: {},
    create: {
      accountId: accNadia.id,
      iban: 'FR7620041010050500013M02606',
      bic: 'PSSTFRPPXXX',
      holderName: 'Nadia Cohen',
      label: 'Mon compte',
      isDefault: true,
    },
  });

  const bankInfoYoussef = await prisma.bankInfo.upsert({
    where: { id: 11 },
    update: {},
    create: {
      accountId: accYoussef.id,
      iban: 'FR7630004000031234567890143',
      bic: 'BNPAFRPPXXX',
      holderName: 'Youssef Amrani',
      label: 'Mon compte',
      isDefault: true,
    },
  });

  const bankInfoEmma = await prisma.bankInfo.upsert({
    where: { id: 12 },
    update: {},
    create: {
      accountId: accEmma.id,
      iban: 'FR7630003003800987654321198',
      bic: 'SOGEFRPPXXX',
      holderName: 'Emma Leroy',
      label: 'Mon compte',
      isDefault: true,
    },
  });

  // ── Subscriptions ─────────────────────────────────────────────────────────────
  //
  // Famille Moreau :
  //   Pierre   → Navigo Annuel, SEPA mensuel, payé par Monique (IBAN dédié), référent = Pierre
  //   Théo     → Imagine R, SEPA mensuel, référent = Pierre, payé via l'IBAN de Pierre
  //   Léa      → Imagine R, SEPA mensuel, référent = Pierre, payé via l'IBAN de Pierre
  //   Monique  → Navigo Annuel Senior, SEPA une fois, paie elle-même, référent = Pierre
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
  //
  // navigoNumber n'existe plus sur Subscription : chaque pass physique est un
  // Pass séparé, créé dans la section suivante.

  const subPierre = await prisma.subscription.upsert({
    where: { id: 1 },
    update: {},
    create: {
      beneficiaryId: pierre.id,
      referrerId: accPierre.id,
      bankInfoId: bankInfoMoniquePourPierre.id,
      subscriptionType: 'Navigo Annuel',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      // transportProductId: 23,

      status: 'active',
      paymentMode: PaymentMode.SEPA_MONTHLY,
      annualAmount: 924.0,
      monthlyAmount: 77.0,
    },
  });

  const subTheo = await prisma.subscription.upsert({
    where: { id: 2 },
    update: {},
    create: {
      beneficiaryId: theo.id,
      referrerId: accPierre.id,
      bankInfoId: bankInfoPierre.id,
      subscriptionType: 'Imagine R',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-08-31'),
      // transportProductId: 29,
      status: 'active',
      paymentMode: PaymentMode.SEPA_MONTHLY,
      annualAmount: 350.0,
      monthlyAmount: 35.0,
    },
  });

  const subLea = await prisma.subscription.upsert({
    where: { id: 3 },
    update: {},
    create: {
      beneficiaryId: lea.id,
      referrerId: accPierre.id,
      bankInfoId: bankInfoPierre.id,
      subscriptionType: 'Imagine R',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-08-31'),
      status: 'active',
      paymentMode: PaymentMode.SEPA_MONTHLY,
      annualAmount: 350.0,
      monthlyAmount: 35.0,
    },
  });

  const subMonique = await prisma.subscription.upsert({
    where: { id: 4 },
    update: {},
    create: {
      beneficiaryId: monique.id,
      referrerId: accPierre.id,
      bankInfoId: bankInfoMoniquePourElle.id,
      subscriptionType: 'Navigo Annuel Senior',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      status: 'active',
      paymentMode: PaymentMode.SEPA_ONCE,
      annualAmount: 621.0,
      monthlyAmount: null,
    },
  });

  const subAlice = await prisma.subscription.upsert({
    where: { id: 5 },
    update: {},
    create: {
      beneficiaryId: alice.id,
      referrerId: accAlice.id,
      bankInfoId: bankInfoAlice.id,
      subscriptionType: 'Navigo Annuel Étudiant',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-08-31'),
      status: 'active',
      paymentMode: PaymentMode.SEPA_MONTHLY,
      annualAmount: 381.0,
      monthlyAmount: 38.1,
    },
  });

  const subBernard = await prisma.subscription.upsert({
    where: { id: 6 },
    update: {},
    create: {
      beneficiaryId: bernard.id,
      referrerId: accBernard.id,
      bankInfoId: bankInfoBernard.id,
      subscriptionType: 'Navigo Annuel Senior',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      status: 'active',
      paymentMode: PaymentMode.SEPA_ONCE,
      annualAmount: 621.0,
      monthlyAmount: null,
    },
  });

  const subClara = await prisma.subscription.upsert({
    where: { id: 7 },
    update: {},
    create: {
      beneficiaryId: clara.id,
      referrerId: accClara.id,
      bankInfoId: bankInfoClara.id,
      subscriptionType: 'Navigo Annuel PMR',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      status: 'active',
      paymentMode: PaymentMode.CARD_ONCE,
      annualAmount: 270.0,
      monthlyAmount: null,
    },
  });

  const subHugo = await prisma.subscription.upsert({
    where: { id: 8 },
    update: {},
    create: {
      beneficiaryId: hugo.id,
      referrerId: accHugo.id,
      bankInfoId: bankInfoHugo.id,
      subscriptionType: 'Navigo Annuel',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      status: 'active',
      paymentMode: PaymentMode.CARD_ONCE,
      annualAmount: 924.0,
      monthlyAmount: null,
    },
  });

  const subFatima = await prisma.subscription.upsert({
    where: { id: 9 },
    update: {},
    create: {
      beneficiaryId: fatima.id,
      referrerId: accFatima.id,
      bankInfoId: bankInfoFatima.id,
      subscriptionType: 'Navigo Annuel',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      status: 'active',
      paymentMode: PaymentMode.SEPA_MONTHLY,
      annualAmount: 924.0,
      monthlyAmount: 77.0,
    },
  });

  const subLucas = await prisma.subscription.upsert({
    where: { id: 10 },
    update: {},
    create: {
      beneficiaryId: lucas.id,
      referrerId: accLucas.id,
      bankInfoId: bankInfoLucas.id,
      subscriptionType: 'Imagine R',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-08-31'),
      status: 'active',
      paymentMode: PaymentMode.SEPA_MONTHLY,
      annualAmount: 381.0,
      monthlyAmount: 38.1,
    },
  });

  const subNadia = await prisma.subscription.upsert({
    where: { id: 11 },
    update: {},
    create: {
      beneficiaryId: nadia.id,
      referrerId: accNadia.id,
      bankInfoId: bankInfoNadia.id,
      subscriptionType: 'Navigo Annuel',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      status: 'active',
      paymentMode: PaymentMode.SEPA_MONTHLY,
      annualAmount: 924.0,
      monthlyAmount: 77.0,
    },
  });

  const subYoussef = await prisma.subscription.upsert({
    where: { id: 12 },
    update: {},
    create: {
      beneficiaryId: youssef.id,
      referrerId: accYoussef.id,
      bankInfoId: bankInfoYoussef.id,
      subscriptionType: 'Navigo Annuel',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      status: 'active',
      paymentMode: PaymentMode.SEPA_ONCE,
      annualAmount: 924.0,
      monthlyAmount: null,
    },
  });

  const subEmma = await prisma.subscription.upsert({
    where: { id: 13 },
    update: {},
    create: {
      beneficiaryId: emma.id,
      referrerId: accEmma.id,
      bankInfoId: bankInfoEmma.id,
      subscriptionType: 'Navigo Solidarité',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2027-02-28'),
      status: 'active',
      paymentMode: PaymentMode.CARD_ONCE,
      annualAmount: 19.95,
      monthlyAmount: null,
    },
  });

  // ── Passes ────────────────────────────────────────────────────────────────────
  // Un seul pass ACTIVE par abonnement à la fois. Chaque navigoNumber vit
  // maintenant sur Pass, pas sur Subscription.

  const passPierre = await prisma.pass.upsert({
    where: { navigoNumber: 'NAV-2026-001' },
    update: {},
    create: {
      subscriptionId: subPierre.id,
      navigoNumber: 'NAV-2026-001',
      status: PassStatus.active,
      issuedAt: new Date('2026-01-01'),
    },
  });
  const passTheo = await prisma.pass.upsert({
    where: { navigoNumber: 'NAV-2026-002' },
    update: {},
    create: {
      subscriptionId: subTheo.id,
      navigoNumber: 'NAV-2026-002',
      status: PassStatus.active,
      issuedAt: new Date('2025-09-01'),
    },
  });
  const passLea = await prisma.pass.upsert({
    where: { navigoNumber: 'NAV-2026-003' },
    update: {},
    create: {
      subscriptionId: subLea.id,
      navigoNumber: 'NAV-2026-003',
      status: PassStatus.active,
      issuedAt: new Date('2025-09-01'),
    },
  });
  const passMonique = await prisma.pass.upsert({
    where: { navigoNumber: 'NAV-2026-004' },
    update: {},
    create: {
      subscriptionId: subMonique.id,
      navigoNumber: 'NAV-2026-004',
      status: PassStatus.active,
      issuedAt: new Date('2026-01-01'),
    },
  });
  const passAlice = await prisma.pass.upsert({
    where: { navigoNumber: 'NAV-2026-005' },
    update: {},
    create: {
      subscriptionId: subAlice.id,
      navigoNumber: 'NAV-2026-005',
      status: PassStatus.active,
      issuedAt: new Date('2025-09-01'),
    },
  });

  // Bernard : pass volé -> ancien pass bloqué, nouveau pass actif émis
  const passBernardOld = await prisma.pass.upsert({
    where: { navigoNumber: 'NAV-2026-006' },
    update: {},
    create: {
      subscriptionId: subBernard.id,
      navigoNumber: 'NAV-2026-006',
      status: PassStatus.blocked,
      issuedAt: new Date('2026-01-01'),
    },
  });
  const passBernardNew = await prisma.pass.upsert({
    where: { navigoNumber: 'NAV-2026-006-R1' },
    update: {},
    create: {
      subscriptionId: subBernard.id,
      navigoNumber: 'NAV-2026-006-R1',
      status: PassStatus.active,
      issuedAt: new Date('2026-04-20'),
    },
  });

  const passClara = await prisma.pass.upsert({
    where: { navigoNumber: 'NAV-2026-007' },
    update: {},
    create: {
      subscriptionId: subClara.id,
      navigoNumber: 'NAV-2026-007',
      status: PassStatus.active,
      issuedAt: new Date('2026-01-01'),
    },
  });
  const passHugo = await prisma.pass.upsert({
    where: { navigoNumber: 'NAV-2026-008' },
    update: {},
    create: {
      subscriptionId: subHugo.id,
      navigoNumber: 'NAV-2026-008',
      status: PassStatus.active,
      issuedAt: new Date('2026-01-01'),
    },
  });
  const passFatima = await prisma.pass.upsert({
    where: { navigoNumber: 'NAV-2026-009' },
    update: {},
    create: {
      subscriptionId: subFatima.id,
      navigoNumber: 'NAV-2026-009',
      status: PassStatus.active,
      issuedAt: new Date('2026-01-01'),
    },
  });
  const passLucas = await prisma.pass.upsert({
    where: { navigoNumber: 'NAV-2026-010' },
    update: {},
    create: {
      subscriptionId: subLucas.id,
      navigoNumber: 'NAV-2026-010',
      status: PassStatus.active,
      issuedAt: new Date('2025-09-01'),
    },
  });
  const passNadia = await prisma.pass.upsert({
    where: { navigoNumber: 'NAV-2026-011' },
    update: {},
    create: {
      subscriptionId: subNadia.id,
      navigoNumber: 'NAV-2026-011',
      status: PassStatus.active,
      issuedAt: new Date('2026-01-01'),
    },
  });
  const passYoussef = await prisma.pass.upsert({
    where: { navigoNumber: 'NAV-2026-012' },
    update: {},
    create: {
      subscriptionId: subYoussef.id,
      navigoNumber: 'NAV-2026-012',
      status: PassStatus.active,
      issuedAt: new Date('2026-01-01'),
    },
  });
  const passEmma = await prisma.pass.upsert({
    where: { navigoNumber: 'NAV-2026-013' },
    update: {},
    create: {
      subscriptionId: subEmma.id,
      navigoNumber: 'NAV-2026-013',
      status: PassStatus.active,
      issuedAt: new Date('2026-03-01'),
    },
  });

  // ── Deliveries ────────────────────────────────────────────────────────────────
  // Chaque pass a sa propre livraison initiale ; Bernard a en plus la
  // livraison de remplacement suite au vol de son premier pass.

  await prisma.delivery.upsert({
    where: { passId: passPierre.id },
    update: {},
    create: {
      passId: passPierre.id,
      addressId: addressPierre.id,
      reason: DeliveryReason.initial_order,
      status: DeliveryStatus.delivered,
      orderedAt: new Date('2025-12-20'),
      estimatedAt: new Date('2026-01-01'),
      trackingNumber: '8R0001000001FR',
    },
  });
  await prisma.delivery.upsert({
    where: { passId: passTheo.id },
    update: {},
    create: {
      passId: passTheo.id,
      addressId: addressTheo.id,
      reason: DeliveryReason.initial_order,
      status: DeliveryStatus.delivered,
      orderedAt: new Date('2025-08-25'),
      estimatedAt: new Date('2025-09-01'),
      trackingNumber: '8R0001000002FR',
    },
  });
  await prisma.delivery.upsert({
    where: { passId: passLea.id },
    update: {},
    create: {
      passId: passLea.id,
      addressId: addressLea.id,
      reason: DeliveryReason.initial_order,
      status: DeliveryStatus.delivered,
      orderedAt: new Date('2025-08-25'),
      estimatedAt: new Date('2025-09-01'),
      trackingNumber: '8R0001000003FR',
    },
  });
  await prisma.delivery.upsert({
    where: { passId: passMonique.id },
    update: {},
    create: {
      passId: passMonique.id,
      addressId: addressMonique.id,
      reason: DeliveryReason.initial_order,
      status: DeliveryStatus.delivered,
      orderedAt: new Date('2025-12-20'),
      estimatedAt: new Date('2026-01-01'),
      trackingNumber: '8R0001000004FR',
    },
  });
  await prisma.delivery.upsert({
    where: { passId: passAlice.id },
    update: {},
    create: {
      passId: passAlice.id,
      addressId: addressAlice.id,
      reason: DeliveryReason.initial_order,
      status: DeliveryStatus.delivered,
      orderedAt: new Date('2025-08-25'),
      estimatedAt: new Date('2025-09-01'),
      trackingNumber: '8R0001000005FR',
    },
  });

  await prisma.delivery.upsert({
    where: { passId: passBernardOld.id },
    update: {},
    create: {
      passId: passBernardOld.id,
      addressId: addressBernard.id,
      reason: DeliveryReason.initial_order,
      status: DeliveryStatus.delivered,
      orderedAt: new Date('2025-12-20'),
      estimatedAt: new Date('2026-01-01'),
      trackingNumber: '8R0001000006FR',
    },
  });
  await prisma.delivery.upsert({
    where: { passId: passBernardNew.id },
    update: {},
    create: {
      passId: passBernardNew.id,
      addressId: addressBernard.id,
      reason: DeliveryReason.stolen,
      status: DeliveryStatus.shipped,
      orderedAt: new Date('2026-04-20'),
      estimatedAt: new Date('2026-04-29'),
      trackingNumber: '2C0004567890FR',
    },
  });

  await prisma.delivery.upsert({
    where: { passId: passClara.id },
    update: {},
    create: {
      passId: passClara.id,
      addressId: addressClara.id,
      reason: DeliveryReason.initial_order,
      status: DeliveryStatus.delivered,
      orderedAt: new Date('2025-12-20'),
      estimatedAt: new Date('2026-01-01'),
      trackingNumber: '8R0001000007FR',
    },
  });
  await prisma.delivery.upsert({
    where: { passId: passHugo.id },
    update: {},
    create: {
      passId: passHugo.id,
      addressId: addressHugo.id,
      reason: DeliveryReason.initial_order,
      status: DeliveryStatus.delivered,
      orderedAt: new Date('2025-12-20'),
      estimatedAt: new Date('2026-01-01'),
      trackingNumber: '8R0001000008FR',
    },
  });
  await prisma.delivery.upsert({
    where: { passId: passFatima.id },
    update: {},
    create: {
      passId: passFatima.id,
      addressId: addressFatima.id,
      reason: DeliveryReason.initial_order,
      status: DeliveryStatus.delivered,
      orderedAt: new Date('2025-12-20'),
      estimatedAt: new Date('2026-01-01'),
      trackingNumber: '8R0001000009FR',
    },
  });
  await prisma.delivery.upsert({
    where: { passId: passLucas.id },
    update: {},
    create: {
      passId: passLucas.id,
      addressId: addressLucas.id,
      reason: DeliveryReason.initial_order,
      status: DeliveryStatus.delivered,
      orderedAt: new Date('2025-08-25'),
      estimatedAt: new Date('2025-09-01'),
      trackingNumber: '8R0001000010FR',
    },
  });
  await prisma.delivery.upsert({
    where: { passId: passNadia.id },
    update: {},
    create: {
      passId: passNadia.id,
      addressId: addressNadia.id,
      reason: DeliveryReason.initial_order,
      status: DeliveryStatus.delivered,
      orderedAt: new Date('2025-12-20'),
      estimatedAt: new Date('2026-01-01'),
      trackingNumber: '8R0001000011FR',
    },
  });
  await prisma.delivery.upsert({
    where: { passId: passYoussef.id },
    update: {},
    create: {
      passId: passYoussef.id,
      addressId: addressYoussef.id,
      reason: DeliveryReason.initial_order,
      status: DeliveryStatus.delivered,
      orderedAt: new Date('2025-12-20'),
      estimatedAt: new Date('2026-01-01'),
      trackingNumber: '8R0001000012FR',
    },
  });
  await prisma.delivery.upsert({
    where: { passId: passEmma.id },
    update: {},
    create: {
      passId: passEmma.id,
      addressId: addressEmma.id,
      reason: DeliveryReason.initial_order,
      status: DeliveryStatus.delivered,
      orderedAt: new Date('2026-02-20'),
      estimatedAt: new Date('2026-03-01'),
      trackingNumber: '8R0001000013FR',
    },
  });

  // ── Pass usages ───────────────────────────────────────────────────────────────
  // Quelques validations récentes, pour tester un compteur "utilisations ce mois-ci".

  await prisma.passUsage.createMany({
    skipDuplicates: true,
    data: [
      {
        passId: passAlice.id,
        usedAt: new Date('2026-05-04T08:12:00'),
        station: 'Châtelet',
      },
      {
        passId: passAlice.id,
        usedAt: new Date('2026-05-04T18:30:00'),
        station: 'Nation',
      },
      {
        passId: passAlice.id,
        usedAt: new Date('2026-05-05T08:05:00'),
        station: 'Châtelet',
      },
      {
        passId: passTheo.id,
        usedAt: new Date('2026-05-06T07:50:00'),
        station: 'Créteil-Préfecture',
      },
      {
        passId: passTheo.id,
        usedAt: new Date('2026-05-06T17:15:00'),
        station: 'Créteil-Préfecture',
      },
      {
        passId: passLea.id,
        usedAt: new Date('2026-05-06T08:00:00'),
        station: 'Créteil-Préfecture',
      },
      {
        passId: passPierre.id,
        usedAt: new Date('2026-05-04T08:30:00'),
        station: 'Créteil-Préfecture',
      },
    ],
  });

  // ── Payments ──────────────────────────────────────────────────────────────────
  const monthly = (
    subId: number,
    amount: number,
    mode: PaymentMode,
    months: { m: string; s: 'succeeded' | 'failed' | 'pending' }[],
  ) =>
    months.map(({ m, s }) => ({
      subscriptionId: subId,
      amount,
      paidAt: new Date(m),
      method: mode,
      status: s,
    }));

  // Pierre : SEPA mensuel, jan→mai payés (payé par Monique)
  await prisma.payment.createMany({
    data: monthly(subPierre.id, 77.0, PaymentMode.SEPA_MONTHLY, [
      { m: '2026-01-05', s: 'succeeded' },
      { m: '2026-02-05', s: 'succeeded' },
      { m: '2026-03-05', s: 'succeeded' },
      { m: '2026-04-05', s: 'succeeded' },
      { m: '2026-05-05', s: 'succeeded' },
    ]),
  });

  // Théo : SEPA mensuel, sept→mai payés, mai échoué
  await prisma.payment.createMany({
    data: monthly(subTheo.id, 35.0, PaymentMode.SEPA_MONTHLY, [
      { m: '2025-09-05', s: 'succeeded' },
      { m: '2025-10-05', s: 'succeeded' },
      { m: '2025-11-05', s: 'succeeded' },
      { m: '2025-12-05', s: 'succeeded' },
      { m: '2026-01-05', s: 'succeeded' },
      { m: '2026-02-05', s: 'succeeded' },
      { m: '2026-03-05', s: 'succeeded' },
      { m: '2026-04-05', s: 'succeeded' },
      { m: '2026-05-05', s: 'failed' },
    ]),
  });

  // Léa : SEPA mensuel, sept→mai tout payé
  await prisma.payment.createMany({
    data: monthly(subLea.id, 35.0, PaymentMode.SEPA_MONTHLY, [
      { m: '2025-09-05', s: 'succeeded' },
      { m: '2025-10-05', s: 'succeeded' },
      { m: '2025-11-05', s: 'succeeded' },
      { m: '2025-12-05', s: 'succeeded' },
      { m: '2026-01-05', s: 'succeeded' },
      { m: '2026-02-05', s: 'succeeded' },
      { m: '2026-03-05', s: 'succeeded' },
      { m: '2026-04-05', s: 'succeeded' },
      { m: '2026-05-05', s: 'succeeded' },
    ]),
  });

  // Monique : SEPA annuel une fois, réglé
  await prisma.payment.createMany({
    data: [
      {
        subscriptionId: subMonique.id,
        amount: 621.0,
        paidAt: new Date('2026-01-05'),
        method: PaymentMode.SEPA_ONCE,
        status: 'succeeded',
      },
    ],
  });

  // Alice : SEPA mensuel, sept→mai payés
  await prisma.payment.createMany({
    data: monthly(subAlice.id, 38.1, PaymentMode.SEPA_MONTHLY, [
      { m: '2025-09-05', s: 'succeeded' },
      { m: '2025-10-05', s: 'succeeded' },
      { m: '2025-11-05', s: 'succeeded' },
      { m: '2025-12-05', s: 'succeeded' },
      { m: '2026-01-05', s: 'succeeded' },
      { m: '2026-02-05', s: 'succeeded' },
      { m: '2026-03-05', s: 'succeeded' },
      { m: '2026-04-05', s: 'succeeded' },
      { m: '2026-05-05', s: 'succeeded' },
    ]),
  });

  // Bernard : SEPA annuel une fois, réglé
  await prisma.payment.createMany({
    data: [
      {
        subscriptionId: subBernard.id,
        amount: 621.0,
        paidAt: new Date('2026-01-05'),
        method: PaymentMode.SEPA_ONCE,
        status: 'succeeded',
      },
    ],
  });

  // Clara : CB une fois, réglé
  await prisma.payment.createMany({
    data: [
      {
        subscriptionId: subClara.id,
        amount: 270.0,
        paidAt: new Date('2026-01-02'),
        method: PaymentMode.CARD_ONCE,
        status: 'succeeded',
      },
    ],
  });

  // Hugo : CB une fois, réglé
  await prisma.payment.createMany({
    data: [
      {
        subscriptionId: subHugo.id,
        amount: 924.0,
        paidAt: new Date('2026-01-03'),
        method: PaymentMode.CARD_ONCE,
        status: 'succeeded',
      },
    ],
  });

  // Fatima : SEPA mensuel, jan→mai payés
  await prisma.payment.createMany({
    data: monthly(subFatima.id, 77.0, PaymentMode.SEPA_MONTHLY, [
      { m: '2026-01-05', s: 'succeeded' },
      { m: '2026-02-05', s: 'succeeded' },
      { m: '2026-03-05', s: 'succeeded' },
      { m: '2026-04-05', s: 'succeeded' },
      { m: '2026-05-05', s: 'succeeded' },
    ]),
  });

  // Lucas : SEPA mensuel, sept→mai payés
  await prisma.payment.createMany({
    data: monthly(subLucas.id, 38.1, PaymentMode.SEPA_MONTHLY, [
      { m: '2025-09-05', s: 'succeeded' },
      { m: '2025-10-05', s: 'succeeded' },
      { m: '2025-11-05', s: 'succeeded' },
      { m: '2025-12-05', s: 'succeeded' },
      { m: '2026-01-05', s: 'succeeded' },
      { m: '2026-02-05', s: 'succeeded' },
      { m: '2026-03-05', s: 'succeeded' },
      { m: '2026-04-05', s: 'succeeded' },
      { m: '2026-05-05', s: 'succeeded' },
    ]),
  });

  // Nadia : SEPA mensuel, jan→mars payés, avril+mai échoués (2 impayés)
  await prisma.payment.createMany({
    data: monthly(subNadia.id, 77.0, PaymentMode.SEPA_MONTHLY, [
      { m: '2026-01-05', s: 'succeeded' },
      { m: '2026-02-05', s: 'succeeded' },
      { m: '2026-03-05', s: 'succeeded' },
      { m: '2026-04-05', s: 'failed' },
      { m: '2026-05-05', s: 'failed' },
    ]),
  });

  // Youssef : SEPA annuel une fois, échoué (provision insuffisante)
  await prisma.payment.createMany({
    data: [
      {
        subscriptionId: subYoussef.id,
        amount: 924.0,
        paidAt: new Date('2026-01-05'),
        method: PaymentMode.SEPA_ONCE,
        status: 'failed',
      },
    ],
  });

  // Emma : CB une fois, réglé (tarif solidarité)
  await prisma.payment.createMany({
    data: [
      {
        subscriptionId: subEmma.id,
        amount: 19.95,
        paidAt: new Date('2026-03-01'),
        method: PaymentMode.CARD_ONCE,
        status: 'succeeded',
      },
    ],
  });

  // Comptes sans pass : Olivier, Sophie, marc, julie, david, camille, thomas, caroline
  // → Aucun abonnement ni paiement

  console.log(
    '✅ Seed terminé — 15 bénéficiaires, 20 comptes, 13 abonnements, 13 passes (dont 1 remplacé)',
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
