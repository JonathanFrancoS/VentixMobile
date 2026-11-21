import { computed, Injectable, signal } from '@angular/core';

import { salesFamilies } from './sales-catalog.data';

const aguardienteFamilies = salesFamilies.filter((family) => family.category === 'Aguardiente');
const ronFamilies = salesFamilies.filter((family) => family.category !== 'Aguardiente');

@Injectable({ providedIn: 'root' })
export class SalesStateService {
  readonly quantities = signal<Record<string, number>>({});
  readonly totals = computed(() => {
    const quantities = this.quantities();
    const sumFamilies = (families: typeof salesFamilies): number =>
      families.reduce(
        (sum, family) =>
          sum + family.products.reduce((familyTotal, product) => familyTotal + (quantities[product.id] ?? 0), 0),
        0,
      );
    const aguardiente = sumFamilies(aguardienteFamilies);
    const ron = sumFamilies(ronFamilies);

    return {
      aguardiente,
      ron,
      total: aguardiente + ron,
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
