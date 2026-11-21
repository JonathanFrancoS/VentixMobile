import { computed, Injectable, signal } from '@angular/core';

import { salesFamilies } from './sales-catalog.data';

const aguardienteFamilies = salesFamilies.filter((family) => family.category === 'Aguardiente');
const ronYoungFamilies = salesFamilies.filter((family) => family.category === 'Ron');
const ronSpecializedFamilies = salesFamilies.filter((family) => family.category === 'Ron especializado');

export type ProductSalesTotals = {
  physicalUnits: number;
  milliliters: number;
  equivalentBottles: number;
};

@Injectable({ providedIn: 'root' })
export class SalesStateService {
  readonly quantities = signal<Record<string, number>>({});
  readonly productTotals = computed<Record<string, ProductSalesTotals>>(() => {
    const quantities = this.quantities();
    return Object.fromEntries(
      salesFamilies.flatMap((family) =>
        family.products.map((product) => {
          const physicalUnits = quantities[product.id] ?? 0;
          const milliliters = physicalUnits * product.volumeMl;
          return [
            product.id,
            {
              physicalUnits,
              milliliters,
              equivalentBottles: milliliters / 750,
            },
          ];
        }),
      ),
    );
  });
  readonly totals = computed(() => {
    const productTotals = this.productTotals();
    const sumFamilies = (families: typeof salesFamilies): number =>
      families.reduce(
        (sum, family) =>
          sum +
          family.products.reduce(
            (familyTotal, product) => familyTotal + productTotals[product.id].equivalentBottles,
            0,
          ),
        0,
      );
    const sumPhysicalUnits = (): number =>
      Object.values(productTotals).reduce((sum, product) => sum + product.physicalUnits, 0);
    const sumMilliliters = (): number =>
      Object.values(productTotals).reduce((sum, product) => sum + product.milliliters, 0);
    const aguardiente = sumFamilies(aguardienteFamilies);
    const ronYoung = sumFamilies(ronYoungFamilies);
    const ronSpecialized = sumFamilies(ronSpecializedFamilies);
    const total = aguardiente + ronYoung + ronSpecialized;

    return {
      aguardiente,
      ronYoung,
      ronSpecialized,
      ron: ronYoung + ronSpecialized,
      total,
      physicalUnits: sumPhysicalUnits(),
      milliliters: sumMilliliters(),
    };
  });

  adjustQuantity(productId: string, change: -1 | 1): void {
    this.quantities.update((quantities) => ({
      ...quantities,
      [productId]: Math.max(0, (quantities[productId] ?? 0) + change),
    }));
  }

  reset(): void {
    this.quantities.set({});
  }
}
