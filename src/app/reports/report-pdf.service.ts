import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import type { jsPDF } from 'jspdf';

import type { CommercialReportSnapshot } from './commercial-report.service';

const margin = 14;
const pageBottom = 280;

function formattedNumber(value: number, maximumFractionDigits = 2): string {
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits }).format(value);
}

function formattedDate(value: string): string {
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function formattedShortDate(value: string): string {
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

@Injectable({ providedIn: 'root' })
export class ReportPdfService {
  filename(report: CommercialReportSnapshot): string {
    const stamp = report.generatedAt.replace(/\D/g, '').slice(0, 14);
    const type = report.kind === 'final' ? 'Cierre-Final' : 'Informe-Parcial';
    return `VentixMobile-${type}-${stamp}.pdf`;
  }

  async createPdf(report: CommercialReportSnapshot): Promise<jsPDF> {
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const contentWidth = pageWidth - margin * 2;
    let y = 16;

    const ensureSpace = (height: number): void => {
      if (y + height > pageBottom) {
        pdf.addPage();
        y = 16;
      }
    };

    const sectionHeading = (title: string): void => {
      ensureSpace(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(17, 47, 86);
      pdf.text(title, margin, y);
      y += 6;
      pdf.setDrawColor(214, 223, 235);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 4;
    };

    const paragraph = (value: string, fontSize = 9): void => {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(fontSize);
      pdf.setTextColor(40, 52, 69);
      const lines = pdf.splitTextToSize(value, contentWidth);
      ensureSpace(lines.length * 4.5 + 2);
      pdf.text(lines, margin, y);
      y += lines.length * 4.5 + 2;
    };

    const keyValue = (label: string, value: string): void => {
      paragraph(`${label}: ${value || '—'}`);
    };

    pdf.setFillColor(16, 43, 82);
    pdf.rect(0, 0, pageWidth, 30, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(17);
    pdf.text(report.title, margin, 13);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text('Ventix Mobile · Informe comercial ejecutivo', margin, 21);
    pdf.text(formattedDate(report.generatedAt), pageWidth - margin, 21, { align: 'right' });
    y = 38;

    sectionHeading('Datos de la jornada');
    keyValue('Asesor de ventas', report.journey.advisorName);
    keyValue('Código del asesor', report.journey.advisorCode);
    keyValue('Punto de venta', report.journey.salesPointName);
    if (report.journey.salesPointCode) {
      keyValue('Código del punto de venta', report.journey.salesPointCode);
    }
    if (report.journey.city) {
      keyValue('Ciudad', report.journey.city);
    }
    keyValue('Inicio de jornada', report.journey.startedAt);
    if (report.finishedAt) {
      keyValue('Finalización de jornada', formattedDate(report.finishedAt));
    }
    y += 2;

    sectionHeading('Resumen ejecutivo');
    keyValue('Cuota asignada', `${formattedNumber(report.totalQuota)} botellas equivalentes`);
    keyValue('Ventas al cierre', `${formattedNumber(report.totalEquivalentBottles)} botellas equivalentes`);
    keyValue(
      'Efectividad total',
      report.totalPercentage === null ? 'Sin cuota configurada' : `${formattedNumber(report.totalPercentage)} %`,
    );
    keyValue(
      'Brecha (ventas menos cuota)',
      `${report.gapEquivalentBottles > 0 ? '+' : ''}${formattedNumber(report.gapEquivalentBottles)} botellas equivalentes`,
    );
    keyValue('Volumen faltante para la cuota', `${formattedNumber(report.missingMilliliters, 0)} ml`);
    keyValue('Volumen vendido', `${formattedNumber(report.totalMilliliters, 0)} ml`);
    keyValue('Unidades físicas vendidas', formattedNumber(report.totalPhysicalUnits, 0));
    ensureSpace(38);
    y = this.drawBalanceRing(pdf, report, y);
    if (report.legacyCombinedRonQuota !== null) {
      paragraph(
        `Jornada con cuota histórica combinada de rones: ${formattedNumber(report.legacyCombinedRonQuota)} botellas equivalentes. No se distribuye entre ron joven y especializado.`,
        8,
      );
    }
    y += 2;

    sectionHeading('Desglose por categoría y familia');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.text('Categoría', margin, y);
    pdf.text('Cuota eq.', 105, y, { align: 'right' });
    pdf.text('Venta eq.', 145, y, { align: 'right' });
    pdf.text('Cumplimiento', pageWidth - margin, y, { align: 'right' });
    y += 5;
    for (const category of report.categories) {
      ensureSpace(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.text(category.name, margin, y);
      pdf.text(formattedNumber(category.quota), 105, y, { align: 'right' });
      pdf.text(formattedNumber(category.equivalentBottles), 145, y, { align: 'right' });
      pdf.text(
        category.percentage === null ? '—' : `${formattedNumber(category.percentage)} %`,
        pageWidth - margin,
        y,
        {
          align: 'right',
        },
      );
      y += 6;
    }
    y += 3;

    sectionHeading('Desglose físico');
    const drawReferenceHeader = (): void => {
      pdf.setFillColor(235, 241, 248);
      pdf.rect(margin, y - 4, contentWidth, 7, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.setTextColor(30, 45, 64);
      pdf.text('Referencia', margin + 1, y);
      pdf.text('Presentación', 84, y);
      pdf.text('Unidades', 112, y, { align: 'right' });
      pdf.text('Mililitros', 146, y, { align: 'right' });
      pdf.text('Bot. eq.', pageWidth - margin - 1, y, { align: 'right' });
      y += 5;
    };
    drawReferenceHeader();
    for (const reference of report.references) {
      const lines = pdf.splitTextToSize(reference.reference, 64);
      const rowHeight = Math.max(6, lines.length * 3.5);
      if (y + rowHeight > pageBottom) {
        pdf.addPage();
        y = 16;
        sectionHeading('Desglose físico (continuación)');
        drawReferenceHeader();
      }

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(40, 52, 69);
      pdf.text(lines, margin + 1, y);
      pdf.text(reference.presentation, 84, y);
      pdf.text(formattedNumber(reference.physicalUnits, 0), 112, y, { align: 'right' });
      pdf.text(formattedNumber(reference.milliliters, 0), 146, y, { align: 'right' });
      pdf.text(formattedNumber(reference.equivalentBottles), pageWidth - margin - 1, y, { align: 'right' });
      y += rowHeight;
    }
    if (y + 8 > pageBottom) {
      pdf.addPage();
      y = 16;
      sectionHeading('Desglose físico (continuación)');
      drawReferenceHeader();
    }
    pdf.setFillColor(235, 241, 248);
    pdf.rect(margin, y - 4, contentWidth, 7, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(30, 45, 64);
    pdf.text('TOTALES', margin + 1, y);
    pdf.text('—', 84, y);
    pdf.text(formattedNumber(report.totalPhysicalUnits, 0), 112, y, { align: 'right' });
    pdf.text(formattedNumber(report.totalMilliliters, 0), 146, y, { align: 'right' });
    pdf.text(formattedNumber(report.totalEquivalentBottles), pageWidth - margin - 1, y, { align: 'right' });
    y += 8;
    y += 3;

    sectionHeading('Observaciones y evidencias');
    if (report.observations.length === 0) {
      paragraph('No se registraron observaciones para esta jornada.');
    } else {
      for (const observation of report.observations) {
        paragraph(`${formattedShortDate(observation.createdAt)} · ${observation.text}`, 8);
        for (const photo of observation.photos) {
          const properties = pdf.getImageProperties(photo.dataUrl);
          const imageWidth = Math.min(42, properties.width);
          const imageHeight = Math.min(32, imageWidth * (properties.height / properties.width));
          ensureSpace(imageHeight + 9);
          pdf.addImage(photo.dataUrl, margin, y, imageWidth, imageHeight);
          pdf.setFontSize(7);
          pdf.text(pdf.splitTextToSize(photo.name, 95), margin + imageWidth + 4, y + 5);
          y += imageHeight + 4;
        }
      }
    }

    const pageCount = pdf.getNumberOfPages();
    for (let page = 1; page <= pageCount; page += 1) {
      pdf.setPage(page);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(120, 130, 143);
      pdf.text(`Ventix Mobile · ${page} / ${pageCount}`, pageWidth - margin, 290, { align: 'right' });
    }

    return pdf;
  }

  private drawBalanceRing(pdf: jsPDF, report: CommercialReportSnapshot, top: number): number {
    const centerX = margin + 18;
    const centerY = top + 13;
    const radius = 11;
    const percentage = report.totalPercentage ?? 0;
    const progress = Math.max(0, Math.min(percentage, 100)) / 100;
    const segmentCount = Math.ceil(72 * progress);

    pdf.setLineWidth(4);
    pdf.setDrawColor(220, 228, 237);
    pdf.circle(centerX, centerY, radius, 'S');
    pdf.setDrawColor(percentage >= 90 ? 22 : 190, percentage >= 90 ? 130 : 55, percentage >= 90 ? 80 : 55);
    for (let index = 0; index < segmentCount; index += 1) {
      const startAngle = -Math.PI / 2 + (Math.PI * 2 * index) / 72;
      const endAngle = -Math.PI / 2 + (Math.PI * 2 * Math.min(index + 1, 72 * progress)) / 72;
      pdf.line(
        centerX + radius * Math.cos(startAngle),
        centerY + radius * Math.sin(startAngle),
        centerX + radius * Math.cos(endAngle),
        centerY + radius * Math.sin(endAngle),
      );
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(17, 47, 86);
    pdf.text(
      report.totalPercentage === null ? '—' : `${formattedNumber(report.totalPercentage)}%`,
      centerX,
      centerY + 1,
      {
        align: 'center',
      },
    );
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text('Balance global', centerX, centerY + radius + 7, { align: 'center' });
    pdf.text(
      `Se vendieron ${formattedNumber(report.totalEquivalentBottles)} de ${formattedNumber(report.totalQuota)} botellas equivalentes.`,
      margin + 42,
      centerY - 2,
    );
    pdf.text(
      `${formattedNumber(Math.max(0, report.totalQuota - report.totalEquivalentBottles))} botellas equivalentes faltantes.`,
      margin + 42,
      centerY + 4,
    );
    return centerY + radius + 13;
  }

  async downloadPdf(pdf: jsPDF, filename: string): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await Filesystem.writeFile({
        path: `Ventix Mobile/${filename}`,
        data: this.pdfBase64(pdf),
        directory: Directory.Documents,
        recursive: true,
      });
      return;
    }

    await pdf.save(filename, { returnPromise: true });
  }

  async sharePdf(pdf: jsPDF, filename: string, title: string): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await this.shareNativePdf(pdf, filename, title);
      return;
    }

    const file = new File([pdf.output('blob')], filename, { type: 'application/pdf' });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title });
      return;
    }

    throw new Error('Compartir archivos PDF no está disponible en este navegador.');
  }

  private async shareNativePdf(pdf: jsPDF, filename: string, title: string): Promise<void> {
    const path = `reports/${filename}`;
    const { uri } = await Filesystem.writeFile({
      path,
      data: this.pdfBase64(pdf),
      directory: Directory.Cache,
      recursive: true,
    });
    try {
      await Share.share({
        title,
        text: 'Informe comercial generado con Ventix Mobile.',
        files: [uri],
        dialogTitle: 'Compartir informe PDF',
      });
    } finally {
      try {
        await Filesystem.deleteFile({ path, directory: Directory.Cache });
      } catch (error) {
        console.error('No se pudo borrar el archivo PDF temporal de la jornada.', error);
      }
    }
  }

  private pdfBase64(pdf: jsPDF): string {
    const base64 = pdf.output('datauristring').split(',')[1];
    if (!base64) {
      throw new Error('No se pudo preparar el archivo PDF.');
    }
    return base64;
  }
}
