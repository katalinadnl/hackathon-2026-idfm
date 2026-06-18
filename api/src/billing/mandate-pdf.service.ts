import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

import { SepaMandate } from './dto/billing.types';

const BLUE = '#003DA5';
const GRAY = '#53606E';
const LIGHT_GRAY = '#EEEEEE';

@Injectable()
export class MandatePdfService {
  generate(mandate: SepaMandate): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const signed = new Date(mandate.signedAt).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
      const statusLabel =
        mandate.status === 'active'
          ? 'Actif'
          : mandate.status === 'pending'
            ? 'En attente'
            : 'Révoqué';

      doc
        .fontSize(20)
        .fillColor(BLUE)
        .text('Mandat de prélèvement SEPA', { align: 'center' });
      doc
        .moveDown(0.3)
        .fontSize(11)
        .fillColor(GRAY)
        .text(
          `Type : prélèvement récurrent (CORE)  ·  Statut : ${statusLabel}`,
          { align: 'center' },
        );
      doc.moveDown(1.5);

      const rows: [string, string][] = [
        ['Référence (RUM)', mandate.reference],
        ['Créancier', mandate.creditorName],
        ['ICS', mandate.creditorIcs],
        ['Débiteur', mandate.debtorName],
        ['IBAN', mandate.ibanMasked],
        ['Pass Navigo', mandate.navigoNumber],
        ['Signé le', signed],
      ];

      const labelX = 50;
      const valueX = 220;

      for (const [label, value] of rows) {
        const y = doc.y;
        doc.fontSize(10).fillColor(GRAY).text(label, labelX, y);
        doc.fontSize(10).fillColor('#25303B').text(value, valueX, y);
        doc.moveDown(0.6);
      }

      doc.moveDown(1);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(LIGHT_GRAY).stroke();
      doc.moveDown(0.8);

      doc
        .fontSize(8)
        .fillColor(GRAY)
        .text(
          `En signant ce formulaire de mandat, vous autorisez ${mandate.creditorName} à envoyer des instructions à votre banque pour débiter votre compte, et votre banque à débiter votre compte conformément aux instructions de ${mandate.creditorName}. Vous bénéficiez d'un droit à remboursement par votre banque selon les conditions décrites dans la convention que vous avez passée avec elle. Toute demande de remboursement doit être présentée dans les 8 semaines suivant la date de débit.`,
          { align: 'justify', lineGap: 3 },
        );

      doc.moveDown(2);

      const signY = doc.y;
      doc.fontSize(10).fillColor(GRAY).text('Fait à :', 50, signY);
      doc
        .moveTo(95, signY + 14)
        .lineTo(250, signY + 14)
        .strokeColor('#999999')
        .stroke();
      doc.fontSize(10).fillColor(GRAY).text('Signature :', 350, signY);
      doc
        .moveTo(420, signY + 14)
        .lineTo(545, signY + 14)
        .strokeColor('#999999')
        .stroke();

      doc.end();
    });
  }
}
