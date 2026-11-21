import { Injectable, inject } from '@angular/core';

import { JourneyDataService } from '../journey-data/journey-data.service';
import { ObservationsService } from '../observations/observations.service';
import { QuotaStateService } from '../quotas/quota-state.service';
import { salesFamilies } from '../sales/sales-catalog.data';
import { SalesStateService, type ProductSalesTotals } from '../sales/sales-state.service';

export type ReportKind = 'partial' | 'final';

export type CommercialReportCategory = {
  id: string;
  name: string;
  quota: number;
  physicalUnits: number;
  milliliters: number;
  equivalentBottles: number;
  percentage: number | null;
};

export type CommercialReportReference = {
  family: string;
  reference: string;
  presentation: string;
  physicalUnits: number;
  milliliters: number;
  equivalentBottles: number;
};

export type CommercialReportSnapshot = {
  kind: ReportKind;
  title: string;
  generatedAt: string;
  finishedAt: string | null;
  journey: {
    advisorName: string;
    advisorCode: string;
    salesPointName: string;
    salesPointCode: string;
    city: string;
    startedAt: string;
  };
  totalQuota: number;
  totalPhysicalUnits: number;
  totalMilliliters: number;
  totalEquivalentBottles: number;
  totalPercentage: number | null;
  gapEquivalentBottles: number;
  missingMilliliters: number;
  legacyCombinedRonQuota: number | null;
  categories: CommercialReportCategory[];
  references: CommercialReportReference[];
  observations: {
    id: string;
    text: string;
    createdAt: string;
    photos: { id: string; name: string; dataUrl: string }[];
  }[];
};

const categoryDefinitions = [
  {
    id: 'aguardiente',
    name: 'Aguardiente Antioqueño',
    familyIds: ['antioqueno-verde', 'antioqueno-azul', 'antioqueno-rojo', 'antioqueno-real'],
    quotaKey: 'aguardiente',
  },
  {
    id: 'ron-young',
    name: 'Ron Medellín joven',
    familyIds: ['ron-dorado', 'ron-3 Años'],
    quotaKey: 'ron-young',
  },
  {
    id: 'ron-specialized',
    name: 'Ron Medellín especializado',
    familyIds: ['ron-5-anos', 'ron-8-anos', 'ron-12-anos', 'ron-19-anos'],
    quotaKey: 'ron-specialized',
  },
] as const;

function sumProducts(products: ProductSalesTotals[]): ProductSalesTotals {
  const physicalUnits = products.reduce((sum, product) => sum + product.physicalUnits, 0);
  const milliliters = products.reduce((sum, product) => sum + product.milliliters, 0);
  return { physicalUnits, milliliters, equivalentBottles: milliliters / 750 };
}

@Injectable({ providedIn: 'root' })
export class CommercialReportService {
  private readonly journeyData = inject(JourneyDataService);
  private readonly quotaState = inject(QuotaStateService);
  private readonly salesState = inject(SalesStateService);
  private readonly observationsService = inject(ObservationsService);

  createSnapshot(kind: ReportKind): CommercialReportSnapshot {
    const journey = this.journeyData.values();
    const quotas = this.quotaState.totals();
    const productTotals = this.salesState.productTotals();
    const sales = this.salesState.totals();
    const familySales = new Map(
      salesFamilies.map((family) => [
        family.id,
        sumProducts(family.products.map((product) => productTotals[product.id])),
      ]),
    );
    const totalQuota = quotas['total'];
    const totalPercentage = totalQuota > 0 ? (sales.total / totalQuota) * 100 : null;
    const categories = categoryDefinitions.map((definition) => {
      const familyTotals = definition.familyIds.map((familyId) => familySales.get(familyId));
      const summary = sumProducts(
        familyTotals.map((totals) => {
          if (!totals) {
            throw new Error(`La familia comercial ${definition.id} no tiene ventas consolidadas.`);
          }
          return totals;
        }),
      );
      const quota = quotas[definition.quotaKey];

      return {
        id: definition.id,
        name: definition.name,
        quota,
        ...summary,
        percentage: quota > 0 ? (summary.equivalentBottles / quota) * 100 : null,
      };
    });
    const references = salesFamilies.flatMap((family) =>
      family.products.map((product) => {
        const totals = productTotals[product.id];
        return {
          family: family.name,
          reference: product.name,
          presentation: product.volume,
          ...totals,
        };
      }),
    );
    const observations = this.observationsService.observations().map((observation) => ({
      id: observation.id,
      text: observation.text,
      createdAt: observation.createdAt,
      photos: observation.photos.map((photo) => ({ id: photo.id, name: photo.name, dataUrl: photo.dataUrl })),
    }));
    const generatedAt = new Date().toISOString();

    return {
      kind,
      title: kind === 'final' ? 'CIERRE FINAL' : 'INFORME PARCIAL',
      generatedAt,
      finishedAt: kind === 'final' ? generatedAt : null,
      journey: {
        advisorName: journey.advisorName,
        advisorCode: journey.advisorCode,
        salesPointName: journey.salesPointName,
        salesPointCode: journey.salesPointCode,
        city: journey.city,
        startedAt: this.journeyData.startDateTime(),
      },
      totalQuota,
      totalPhysicalUnits: sales.physicalUnits,
      totalMilliliters: sales.milliliters,
      totalEquivalentBottles: sales.total,
      totalPercentage,
      gapEquivalentBottles: sales.total - totalQuota,
      missingMilliliters: Math.max(0, Math.ceil(totalQuota * 750 - sales.milliliters)),
      legacyCombinedRonQuota: this.quotaState.hasLegacyCombinedRonQuota() ? quotas['ron-combined'] : null,
      categories,
      references,
      observations,
    };
  }
}
