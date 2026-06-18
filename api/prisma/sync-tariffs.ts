import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Jeu de données ouvert IDFM "titres-et-tarifs"
// (https://data.iledefrance-mobilites.fr/explore/dataset/titres-et-tarifs/).
const SOURCE_API_URL =
  'https://data.iledefrance-mobilites.fr/api/explore/v2.1/catalog/datasets/titres-et-tarifs/exports/csv?use_labels=true&delimiter=%3B';


function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  const content = text.replace(/^\uFEFF/, ''); 

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (inQuotes) {
      if (char === '"') {
        if (content[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ';') {
      row.push(field);
      field = '';
    } else if (char === '\r') {
      // ignoré, la fin de ligne est gérée par \n
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function parsePriceCents(raw: string): number | null {
  const trimmed = raw.trim();
  if (/^gratuit/i.test(trimmed)) return 0;
  const match = trimmed.match(/(\d+(?:,\d+)?)\s*€/);
  if (!match) return null;
  const euros = parseFloat(match[1].replace(',', '.'));
  return Math.round(euros * 100);
}

function isAnnualPlan(
  name: string,
  period: string,
  priceLabel: string,
): boolean {
  const looksAnnual = period.trim() === 'par an' || /annuel/i.test(name);
  if (!looksAnnual) return false;
  const trimmedPrice = priceLabel.trim();
  if (trimmedPrice.startsWith('-')) return false;
  if (/^gratuit/i.test(trimmedPrice)) return false;
  return true;
}

async function fetchCsv(): Promise<string> {
  const res = await fetch(SOURCE_API_URL);
  if (!res.ok) {
    throw new Error(
      `Échec de récupération des données IDFM : HTTP ${res.status}`,
    );
  }
  return res.text();
}

async function main() {
  console.log('Synchronisation des titres et tarifs depuis l’API IDFM…');

  const csvText = await fetchCsv();
  const rows = parseCsv(csvText);
  const [header, ...dataRows] = rows;

  const col = (label: string) => {
    const i = header.indexOf(label);
    if (i === -1) {
      throw new Error(`Colonne "${label}" introuvable dans le CSV IDFM.`);
    }
    return i;
  };

  const idx = {
    name: col('Nom du Produit'),
    description: col('Description'),
    indication: col('Indication du produit'),
    period: col('Période du produit'),
    priceLabel: col('TARIF'),
    sellingArguments: col('selling_arguments'),
    subscriptionTag: col('other_product_tag'),
    portalUrl: col('LIEN VERS LE PORTAIL'),
    rechargeUrl: col('Lien recharger produit'),
    imageUrl: col('Image du produit'),
  };

  let count = 0;
  for (const cells of dataRows) {
    const name = cells[idx.name]?.trim();
    if (!name) continue; // ligne vide (ex: fin de fichier)

    const period = (cells[idx.period] ?? '').trim();
    const priceLabel = (cells[idx.priceLabel] ?? '').trim();
    const sellingArgumentsRaw = cells[idx.sellingArguments] ?? '';

    const data = {
      description: cells[idx.description]?.trim() || null,
      indication: cells[idx.indication]?.trim() || null,
      period: period || null,
      priceLabel,
      priceCents: parsePriceCents(priceLabel),
      sellingArguments: sellingArgumentsRaw
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean),
      subscriptionTag: cells[idx.subscriptionTag]?.trim() || null,
      portalUrl: cells[idx.portalUrl]?.trim() || null,
      rechargeUrl: cells[idx.rechargeUrl]?.trim() || null,
      imageUrl: cells[idx.imageUrl]?.trim() || null,
      isAnnualPlan: isAnnualPlan(name, period, priceLabel),
    };

    await prisma.transportProduct.upsert({
      where: { name },
      update: data,
      create: { name, ...data },
    });
    count++;
  }

  const annualCount = await prisma.transportProduct.count({
    where: { isAnnualPlan: true },
  });

  console.log(
    `✅ ${count} titres synchronisés (dont ${annualCount} formules longues).`,
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});