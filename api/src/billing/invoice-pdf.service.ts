import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  holderName: string;
  navigoNumber: string;
  subscriptionType: string;
  subscriptionPeriod: string;
  paymentMethod: string;
  amount: number;
  status: string;
  payerName: string;
  period: string;
}

const BLUE = '#003DA5';
const GRAY = '#53606E';
const DARK = '#25303B';
const LIGHT_BG = '#F5F7FA';

@Injectable()
export class InvoicePdfService {
  generate(data: InvoiceData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const dateStr = new Date(data.date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

      const methodLabel =
        data.paymentMethod === 'card'
          ? 'Carte bancaire'
          : data.paymentMethod === 'direct_debit'
            ? 'Prélèvement SEPA'
            : data.paymentMethod;

      const statusLabel =
        data.status === 'succeeded'
          ? 'Réglé'
          : data.status === 'failed'
            ? 'Impayé'
            : 'Remboursé';

      // Header
      doc.fontSize(10).fillColor(GRAY).text('Île-de-France Mobilités', 50, 50);
      doc.fontSize(8).fillColor(GRAY).text('41 rue de Châteaudun', 50, 64);
      doc.text('75009 Paris', 50, 76);
      doc.text('SIRET : 287 500 078 00020', 50, 88);

      doc
        .fontSize(10)
        .fillColor(GRAY)
        .text(`Facture n° ${data.invoiceNumber}`, 350, 50, {
          align: 'right',
        });
      doc.fontSize(10).text(`Date : ${dateStr}`, 350, 64, { align: 'right' });

      // Separator
      doc
        .moveTo(50, 115)
        .lineTo(545, 115)
        .strokeColor('#DDDDDD')
        .stroke();

      // Title
      doc
        .fontSize(22)
        .fillColor(BLUE)
        .text('Facture', 50, 135, { align: 'center' });
      doc.moveDown(1.5);

      // Client info box
      const boxY = doc.y;
      doc
        .roundedRect(50, boxY, 495, 88, 4)
        .fillColor(LIGHT_BG)
        .fill();
      doc
        .fontSize(10)
        .fillColor(GRAY)
        .text('Client', 65, boxY + 12);
      doc
        .fontSize(11)
        .fillColor(DARK)
        .text(data.payerName, 65, boxY + 28);
      doc
        .fontSize(10)
        .fillColor(GRAY)
        .text(`Titulaire du pass : ${data.holderName}`, 65, boxY + 46);
      doc
        .fontSize(10)
        .fillColor(GRAY)
        .text(`N° Navigo : ${data.navigoNumber}`, 300, boxY + 28);
      doc
        .fontSize(10)
        .fillColor(GRAY)
        .text(`Validité : ${data.subscriptionPeriod}`, 300, boxY + 46);

      doc.y = boxY + 108;

      // Detail table
      const tableTop = doc.y;
      const col1 = 50;
      const col2 = 310;
      const col3 = 430;
      const rowH = 28;

      // Header row
      doc
        .roundedRect(col1, tableTop, 495, rowH, 2)
        .fillColor(BLUE)
        .fill();
      doc
        .fontSize(10)
        .fillColor('#FFFFFF')
        .text('Désignation', col1 + 10, tableTop + 8);
      doc.text('Période', col2, tableTop + 8);
      doc.text('Montant TTC', col3, tableTop + 8, { align: 'right', width: 105 });

      // Data row
      const row1Y = tableTop + rowH;
      doc
        .rect(col1, row1Y, 495, rowH)
        .fillColor('#FFFFFF')
        .fill();
      doc
        .moveTo(col1, row1Y + rowH)
        .lineTo(col1 + 495, row1Y + rowH)
        .strokeColor('#EEEEEE')
        .stroke();
      doc
        .fontSize(10)
        .fillColor(DARK)
        .text(`${data.subscriptionType} (${data.subscriptionPeriod})`, col1 + 10, row1Y + 8);
      doc.fillColor(GRAY).text(data.period, col2, row1Y + 8);
      doc
        .fillColor(DARK)
        .text(
          `${Math.abs(data.amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`,
          col3,
          row1Y + 8,
          { align: 'right', width: 105 },
        );

      // Total row
      const totalY = row1Y + rowH + 15;
      doc
        .roundedRect(col3 - 30, totalY - 4, 135, 30, 3)
        .fillColor(LIGHT_BG)
        .fill();
      doc
        .fontSize(11)
        .fillColor(GRAY)
        .text('Total TTC', col3 - 20, totalY + 3);
      doc
        .fontSize(13)
        .fillColor(BLUE)
        .text(
          `${Math.abs(data.amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`,
          col3,
          totalY + 2,
          { align: 'right', width: 105 },
        );

      // Payment info
      doc.y = totalY + 50;
      doc
        .fontSize(10)
        .fillColor(GRAY)
        .text(`Mode de paiement : ${methodLabel}`);
      doc.text(`Statut : ${statusLabel}`);

      // Footer
      doc
        .fontSize(7)
        .fillColor('#AAAAAA')
        .text(
          'Île-de-France Mobilités — Établissement public à caractère administratif — TVA non applicable, art. 293 B du CGI',
          50,
          770,
          { align: 'center' },
        );

      doc.end();
    });
  }

  generateGrouped(
    items: InvoiceData[],
    monthLabel: string,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const total = items.reduce((s, i) => s + Math.abs(i.amount), 0);
      const invoiceNum = `F-GROUP-${items[0]?.invoiceNumber?.split('-')[1] ?? 'X'}-${monthLabel.replace(/\s/g, '')}`;

      // Header
      doc.fontSize(10).fillColor(GRAY).text('Île-de-France Mobilités', 50, 50);
      doc.fontSize(8).fillColor(GRAY).text('41 rue de Châteaudun', 50, 64);
      doc.text('75009 Paris', 50, 76);
      doc.text('SIRET : 287 500 078 00020', 50, 88);

      doc
        .fontSize(10)
        .fillColor(GRAY)
        .text(`Facture n° ${invoiceNum}`, 350, 50, { align: 'right' });
      doc.fontSize(10).text(`Période : ${monthLabel}`, 350, 64, {
        align: 'right',
      });

      doc
        .moveTo(50, 115)
        .lineTo(545, 115)
        .strokeColor('#DDDDDD')
        .stroke();

      // Title
      doc
        .fontSize(22)
        .fillColor(BLUE)
        .text('Facture récapitulative', 50, 135, { align: 'center' });
      doc.moveDown(1.5);

      // Client box
      const payerName = items[0]?.payerName ?? '—';
      const boxY = doc.y;
      doc
        .roundedRect(50, boxY, 495, 50, 4)
        .fillColor(LIGHT_BG)
        .fill();
      doc
        .fontSize(10)
        .fillColor(GRAY)
        .text('Payeur', 65, boxY + 12);
      doc
        .fontSize(11)
        .fillColor(DARK)
        .text(payerName, 65, boxY + 28);

      doc.y = boxY + 68;

      // Table header
      const tableTop = doc.y;
      const col1 = 50;
      const col2 = 260;
      const col3 = 370;
      const col4 = 440;
      const rowH = 26;

      doc
        .roundedRect(col1, tableTop, 495, rowH, 2)
        .fillColor(BLUE)
        .fill();
      doc
        .fontSize(9)
        .fillColor('#FFFFFF')
        .text('Désignation', col1 + 10, tableTop + 8);
      doc.text('Titulaire', col2, tableTop + 8);
      doc.text('Statut', col3, tableTop + 8);
      doc.text('Montant TTC', col4, tableTop + 8, {
        align: 'right',
        width: 95,
      });

      // Rows
      let y = tableTop + rowH;
      for (const item of items) {
        const statusLabel =
          item.status === 'succeeded'
            ? 'Réglé'
            : item.status === 'failed'
              ? 'Impayé'
              : 'Remboursé';

        doc
          .rect(col1, y, 495, rowH)
          .fillColor(y % 2 === 0 ? '#FFFFFF' : LIGHT_BG)
          .fill();
        doc
          .moveTo(col1, y + rowH)
          .lineTo(col1 + 495, y + rowH)
          .strokeColor('#EEEEEE')
          .stroke();
        doc
          .fontSize(9)
          .fillColor(DARK)
          .text(item.subscriptionType, col1 + 10, y + 8, { width: 200 });
        doc.fillColor(GRAY).text(item.holderName, col2, y + 8, { width: 100 });
        doc.text(statusLabel, col3, y + 8);
        doc
          .fillColor(DARK)
          .text(
            `${Math.abs(item.amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`,
            col4,
            y + 8,
            { align: 'right', width: 95 },
          );
        y += rowH;
      }

      // Total
      const totalY = y + 15;
      doc
        .roundedRect(col4 - 30, totalY - 4, 125, 30, 3)
        .fillColor(LIGHT_BG)
        .fill();
      doc
        .fontSize(11)
        .fillColor(GRAY)
        .text('Total TTC', col4 - 20, totalY + 3);
      doc
        .fontSize(13)
        .fillColor(BLUE)
        .text(
          `${total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`,
          col4,
          totalY + 2,
          { align: 'right', width: 95 },
        );

      // Footer
      doc
        .fontSize(7)
        .fillColor('#AAAAAA')
        .text(
          'Île-de-France Mobilités — Établissement public à caractère administratif — TVA non applicable, art. 293 B du CGI',
          50,
          770,
          { align: 'center' },
        );

      doc.end();
    });
  }
}