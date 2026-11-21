import { computed, Injectable, signal } from '@angular/core';

import { salesFamilies } from '../sales/sales-catalog.data';

const aguardienteFamilies = salesFamilies.filter((family) => family.category === 'Aguardiente');
const ronFamilies = salesFamilies.filter((family) => family.category !== 'Aguardiente');

function emptyProductQuotas(): Record<string, number> {
  return Object.fromEntries(salesFamilies.flatMap((family) => family.products.map((product) => [product.id, 0])));
}

@Injectable({ providedIn: 'root' })
export class QuotaStateService {
  readonly productQuotas = signal(emptyProductQuotas());
  private readonly manualTotals = signal<Record<string, number>>({});
  readonly totals = computed<Record<string, number>>(() => {
    const quotas = this.productQuotas();
    const overrides = this.manualTotals();
    const familyTotals = Object.fromEntries(
      salesFamilies.map((family) => [
        family.id,
        overrides[family.id] ?? family.products.reduce((sum, product) => sum + (quotas[product.id] ?? 0), 0),
      ]),
    );
    const sumFamilies = (families: typeof salesFamilies): number =>
      families.reduce((sum, family) => sum + familyTotals[family.id], 0);

    return {
      ...familyTotals,
      aguardiente: overrides['aguardiente'] ?? sumFamilies(aguardienteFamilies),
      'ron-combined': overrides['ron-combined'] ?? sumFamilies(ronFamilies),
    };
  });

  setProductQuota(productId: string, value: number): void {
    this.productQuotas.update((quotas) => ({ ...quotas, [productId]: value }));
  }

  setManualTotal(id: string, value: number): void {
    this.manualTotals.update((totals) => ({ ...totals, [id]: value }));
  }

  resetManualTotal(id: string): void {
    this.manualTotals.update((totals) => {
      const { [id]: _removed, ...remainingTotals } = totals;
      return remainingTotals;
    });
  }

  reset(): void {
    this.productQuotas.set(emptyProductQuotas());
    this.manualTotals.set({});
  }
}
