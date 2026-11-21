import { TestBed } from '@angular/core/testing';
import { Preferences } from '@capacitor/preferences';

import { JourneyDataService } from '../journey-data/journey-data.service';
import { ObservationsService } from '../observations/observations.service';
import { QuotaStateService } from '../quotas/quota-state.service';
import { SalesStateService } from '../sales/sales-state.service';

import { CommercialReportService } from './commercial-report.service';

describe('CommercialReportService', () => {
  beforeEach(async () => {
    await Preferences.remove({ key: 'ventix.journey.v1' });
    await Preferences.remove({ key: 'ventix.quotas.v1' });
    TestBed.configureTestingModule({ providers: [CommercialReportService] });
  });

  afterEach(async () => {
    await Preferences.remove({ key: 'ventix.journey.v1' });
    await Preferences.remove({ key: 'ventix.quotas.v1' });
  });

  it('consolidates categories and captures an independent snapshot for a partial report', async () => {
    const journey = TestBed.inject(JourneyDataService);
    const quotas = TestBed.inject(QuotaStateService);
    const sales = TestBed.inject(SalesStateService);
    const observations = TestBed.inject(ObservationsService);
    const reportService = TestBed.inject(CommercialReportService);
    await Promise.all([journey.initialize(), quotas.initialize()]);
    await journey.startJourney({
      advisorName: 'Laura Gómez',
      advisorCode: 'AS-12',
      salesPointName: 'Tienda Central',
      salesPointCode: 'PV-8',
      city: 'Medellín',
    });
    await quotas.configureProducts({
      'antioqueno-verde-4': 1,
      'ron-dorado-1': 1,
      'ron-5-anos-0': 1,
    });
    sales.adjustQuantity('antioqueno-verde-4', 1);
    sales.adjustQuantity('antioqueno-verde-4', 1);
    sales.adjustQuantity('ron-dorado-1', 1);
    sales.adjustQuantity('ron-dorado-1', 1);
    sales.adjustQuantity('ron-5-anos-0', 1);
    observations.addObservation('Exhibición completa');

    const snapshot = reportService.createSnapshot('partial');
    expect(snapshot.title).toBe('INFORME PARCIAL');
    expect(snapshot.finishedAt).toBeNull();
    expect(snapshot.journey).toMatchObject({
      advisorName: 'Laura Gómez',
      advisorCode: 'AS-12',
      salesPointName: 'Tienda Central',
      city: 'Medellín',
    });
    expect(snapshot.totalQuota).toBe(3);
    expect(snapshot.totalPhysicalUnits).toBe(5);
    expect(snapshot.totalMilliliters).toBe(2250);
    expect(snapshot.totalEquivalentBottles).toBe(3);
    expect(snapshot.totalPercentage).toBe(100);
    expect(
      snapshot.categories.map(({ name, equivalentBottles, quota }) => ({ name, equivalentBottles, quota })),
    ).toEqual([
      { name: 'Aguardiente Antioqueño', equivalentBottles: 1, quota: 1 },
      { name: 'Ron Medellín joven', equivalentBottles: 1, quota: 1 },
      { name: 'Ron Medellín especializado', equivalentBottles: 1, quota: 1 },
    ]);
    expect(snapshot.references.find((reference) => reference.presentation === '375 ml')).toMatchObject({
      physicalUnits: 2,
      milliliters: 750,
      equivalentBottles: 1,
    });
    expect(snapshot.observations[0].text).toBe('Exhibición completa');

    sales.adjustQuantity('antioqueno-verde-4', 1);
    observations.addObservation('Se conserva el informe generado');
    expect(snapshot.totalEquivalentBottles).toBe(3);
    expect(snapshot.observations).toHaveLength(1);
    expect(sales.totals().total).toBeGreaterThan(snapshot.totalEquivalentBottles);
    expect(observations.observations()).toHaveLength(2);

    const finalSnapshot = reportService.createSnapshot('final');
    expect(finalSnapshot.finishedAt).toBe(finalSnapshot.generatedAt);
  });

  it('keeps a legacy combined rum quota separate instead of dividing it between groups', async () => {
    const quotas = TestBed.inject(QuotaStateService);
    const reportService = TestBed.inject(CommercialReportService);
    await Preferences.set({
      key: 'ventix.quotas.v1',
      value: JSON.stringify({
        version: 1,
        productQuotas: {},
        manualTotals: { aguardiente: 10, 'ron-combined': 20 },
        configured: true,
      }),
    });
    await quotas.initialize();

    const snapshot = reportService.createSnapshot('partial');
    expect(snapshot.totalQuota).toBe(30);
    expect(snapshot.legacyCombinedRonQuota).toBe(20);
    expect(snapshot.categories[1].quota).toBe(0);
    expect(snapshot.categories[2].quota).toBe(0);
  });
});
