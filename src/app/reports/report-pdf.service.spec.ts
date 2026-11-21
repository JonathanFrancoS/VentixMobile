import type { CommercialReportSnapshot } from './commercial-report.service';
import { ReportPdfService } from './report-pdf.service';

describe('ReportPdfService', () => {
  it('creates a PDF document for an executive report snapshot', async () => {
    const report: CommercialReportSnapshot = {
      kind: 'partial',
      title: 'INFORME PARCIAL',
      generatedAt: '2026-11-21T17:00:00.000Z',
      finishedAt: null,
      journey: {
        advisorName: 'Laura Gómez',
        advisorCode: 'AS-12',
        salesPointName: 'Tienda Central',
        salesPointCode: 'PV-8',
        city: 'Medellín',
        startedAt: '21/11/2026 - 12:00 Hrs',
      },
      totalQuota: 2,
      totalPhysicalUnits: 3,
      totalMilliliters: 1125,
      totalEquivalentBottles: 1.5,
      totalPercentage: 75,
      gapEquivalentBottles: -0.5,
      missingMilliliters: 375,
      legacyCombinedRonQuota: null,
      categories: [
        {
          id: 'aguardiente',
          name: 'Aguardiente Antioqueño',
          quota: 2,
          physicalUnits: 3,
          milliliters: 1125,
          equivalentBottles: 1.5,
          percentage: 75,
        },
      ],
      references: [
        {
          family: 'Antioqueño Tradicional (Rojo)',
          reference: 'Antioqueño Tradicional (Rojo) joven',
          presentation: '375 ml',
          physicalUnits: 3,
          milliliters: 1125,
          equivalentBottles: 1.5,
        },
      ],
      observations: [],
    };

    const pdf = await new ReportPdfService().createPdf(report);
    const output = new TextDecoder().decode(pdf.output('arraybuffer'));

    expect(output.startsWith('%PDF-')).toBe(true);
    expect(pdf.getNumberOfPages()).toBeGreaterThan(0);
    expect(output).toContain('TOTALES');
    expect(output).not.toContain('Finalizaci');
  });

  it('includes the journey finish time in the final PDF only', async () => {
    const report: CommercialReportSnapshot = {
      kind: 'final',
      title: 'CIERRE FINAL',
      generatedAt: '2026-11-21T17:00:00.000Z',
      finishedAt: '2026-11-21T17:00:00.000Z',
      journey: {
        advisorName: 'Laura Gómez',
        advisorCode: 'AS-12',
        salesPointName: 'Tienda Central',
        salesPointCode: 'PV-8',
        city: 'Medellín',
        startedAt: '21/11/2026 - 12:00 Hrs',
      },
      totalQuota: 2,
      totalPhysicalUnits: 3,
      totalMilliliters: 1125,
      totalEquivalentBottles: 1.5,
      totalPercentage: 75,
      gapEquivalentBottles: -0.5,
      missingMilliliters: 375,
      legacyCombinedRonQuota: null,
      categories: [],
      references: [],
      observations: [],
    };

    const pdf = await new ReportPdfService().createPdf(report);
    const output = new TextDecoder().decode(pdf.output('arraybuffer'));

    expect(output).toContain('Finalizaci');
  });
});
