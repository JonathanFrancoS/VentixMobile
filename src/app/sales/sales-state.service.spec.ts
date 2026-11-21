import { SalesStateService } from './sales-state.service';

describe('SalesStateService', () => {
  it('converts whole physical units into milliliters and 750 ml bottle equivalents by commercial group', () => {
    const sales = new SalesStateService();
    sales.adjustQuantity('antioqueno-verde-4', 1);
    sales.adjustQuantity('antioqueno-verde-4', 1);
    sales.adjustQuantity('ron-dorado-1', 1);
    sales.adjustQuantity('ron-dorado-1', 1);
    sales.adjustQuantity('ron-5-anos-0', 1);

    expect(sales.productTotals()['antioqueno-verde-4']).toEqual({
      physicalUnits: 2,
      milliliters: 750,
      equivalentBottles: 1,
    });
    expect(sales.totals()).toMatchObject({
      aguardiente: 1,
      ronYoung: 1,
      ronSpecialized: 1,
      ron: 2,
      total: 3,
      physicalUnits: 5,
      milliliters: 2250,
    });
  });

  it('keeps physical quantities as nonnegative integers', () => {
    const sales = new SalesStateService();
    sales.adjustQuantity('antioqueno-verde-4', -1);
    sales.adjustQuantity('antioqueno-verde-4', 1);
    sales.adjustQuantity('antioqueno-verde-4', -1);

    expect(sales.quantities()['antioqueno-verde-4']).toBe(0);
  });
});
