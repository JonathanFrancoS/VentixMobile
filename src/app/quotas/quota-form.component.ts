import { Component, signal } from '@angular/core';
import { IonCard, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { checkmarkOutline, createOutline, trashOutline } from 'ionicons/icons';

import { salesFamilies, type SalesFamily } from '../sales/sales-catalog.data';
import { QuotaStateService } from './quota-state.service';

type QuotaSection = {
  id: 'aguardiente' | 'ron';
  name: string;
  families: SalesFamily[];
};

@Component({
  selector: 'app-quota-form',
  templateUrl: './quota-form.component.html',
  styleUrls: ['./quota-form.component.scss'],
  imports: [IonCard, IonIcon],
})
export class QuotaFormComponent {
  readonly sections: QuotaSection[] = [
    {
      id: 'aguardiente',
      name: 'Aguardientes',
      families: salesFamilies.filter((family) => family.category === 'Aguardiente'),
    },
    {
      id: 'ron',
      name: 'Rones',
      families: salesFamilies.filter((family) => family.category !== 'Aguardiente'),
    },
  ];
  readonly editingProducts = signal<Record<string, boolean>>({});
  readonly editingTotals = signal<Record<string, boolean>>({});

  constructor(protected readonly quotaState: QuotaStateService) {
    addIcons({ checkmarkOutline, createOutline, trashOutline });
  }

  protected productQuota(productId: string): number {
    return this.quotaState.productQuotas()[productId] ?? 0;
  }

  protected total(id: string): number {
    return this.quotaState.totals()[id] ?? 0;
  }

  protected displayValue(value: number): number | null {
    return value === 0 ? null : value;
  }

  protected isProductEditing(productId: string): boolean {
    return this.editingProducts()[productId] ?? false;
  }

  protected isTotalEditing(id: string): boolean {
    return this.editingTotals()[id] ?? false;
  }

  protected toggleProductEdit(productId: string): void {
    this.editingProducts.update((editing) => ({ ...editing, [productId]: !editing[productId] }));
  }

  protected toggleTotalEdit(id: string): void {
    this.editingTotals.update((editing) => ({ ...editing, [id]: !editing[id] }));
  }

  protected setProductQuota(productId: string, event: Event): void {
    this.quotaState.setProductQuota(productId, this.readNumericValue(event));
  }

  protected setManualTotal(id: string, event: Event): void {
    this.quotaState.setManualTotal(id, this.readNumericValue(event));
  }

  protected resetProductQuota(productId: string): void {
    this.quotaState.setProductQuota(productId, 0);
    this.editingProducts.update((editing) => ({ ...editing, [productId]: false }));
  }

  protected resetManualTotal(id: string): void {
    this.quotaState.resetManualTotal(id);
    this.editingTotals.update((editing) => ({ ...editing, [id]: false }));
  }

  protected isFirstSpecializedFamily(section: QuotaSection, family: SalesFamily, index: number): boolean {
    return (
      section.id === 'ron' &&
      family.category === 'Ron especializado' &&
      section.families[index - 1]?.category !== 'Ron especializado'
    );
  }

  private readNumericValue(event: Event): number {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('La cuota debe editarse desde un campo numérico.');
    }

    const value = input.valueAsNumber;
    return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
  }
}
