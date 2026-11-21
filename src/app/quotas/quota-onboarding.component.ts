import { Component, inject, signal } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline } from 'ionicons/icons';

import { quotaSections } from './quota-sections';
import { QuotaStateService } from './quota-state.service';

type QuotaMode = 'totals' | 'products';

function createProductInputs(): Record<string, string> {
  const values: Record<string, string> = {};
  for (const section of quotaSections) {
    for (const family of section.families) {
      for (const product of family.products) {
        values[product.id] = '';
      }
    }
  }
  return values;
}

function parseQuota(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

@Component({
  selector: 'app-quota-onboarding',
  templateUrl: './quota-onboarding.component.html',
  styleUrls: ['./quota-onboarding.component.scss'],
  imports: [IonButton, IonIcon],
})
export class QuotaOnboardingComponent {
  protected readonly sections = quotaSections;
  protected readonly mode = signal<QuotaMode | null>(null);
  protected readonly totalAguardientes = signal('');
  protected readonly totalRonesJovenes = signal('');
  protected readonly totalRonesEspecializados = signal('');
  protected readonly productValues = signal(createProductInputs());
  protected readonly errorMessage = signal('');
  protected readonly isSaving = signal(false);

  private readonly quotaState = inject(QuotaStateService);

  constructor() {
    addIcons({ arrowBackOutline });
  }

  protected selectMode(mode: QuotaMode): void {
    this.mode.set(mode);
    this.errorMessage.set('');
  }

  protected returnToOptions(): void {
    this.mode.set(null);
    this.errorMessage.set('');
  }

  protected updateTotal(category: 'aguardiente' | 'ron-joven' | 'ron-especializado', event: Event): void {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('La cuota total debe ingresarse desde un campo numérico.');
    }

    if (category === 'aguardiente') {
      this.totalAguardientes.set(input.value);
    } else if (category === 'ron-joven') {
      this.totalRonesJovenes.set(input.value);
    } else {
      this.totalRonesEspecializados.set(input.value);
    }
    this.errorMessage.set('');
  }

  protected productValue(productId: string): string {
    return this.productValues()[productId] ?? '';
  }

  protected updateProductValue(productId: string, event: Event): void {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('La cuota por referencia debe ingresarse desde un campo numérico.');
    }

    this.productValues.update((values) => ({ ...values, [productId]: input.value }));
    this.errorMessage.set('');
  }

  protected async saveSetup(event: Event): Promise<void> {
    event.preventDefault();
    if (this.isSaving()) {
      return;
    }

    if (this.mode() === 'totals') {
      const aguardientes = parseQuota(this.totalAguardientes());
      const ronesJovenes = parseQuota(this.totalRonesJovenes());
      const ronesEspecializados = parseQuota(this.totalRonesEspecializados());
      if (aguardientes === null || ronesJovenes === null || ronesEspecializados === null) {
        this.errorMessage.set('Ingresa un número entero igual o mayor que cero en los tres campos.');
        return;
      }
    } else if (this.mode() !== 'products') {
      this.errorMessage.set('Selecciona cómo deseas registrar las cuotas.');
      return;
    }

    this.isSaving.set(true);
    try {
      if (this.mode() === 'totals') {
        await this.quotaState.configureTotals(
          Number(this.totalAguardientes()),
          Number(this.totalRonesJovenes()),
          Number(this.totalRonesEspecializados()),
        );
      } else {
        const values: Record<string, number> = {};
        for (const [productId, value] of Object.entries(this.productValues())) {
          if (!value.trim()) {
            values[productId] = 0;
            continue;
          }

          const parsed = parseQuota(value);
          if (parsed === null) {
            this.errorMessage.set('Las cuotas por referencia deben ser números enteros iguales o mayores que cero.');
            return;
          }
          values[productId] = parsed;
        }
        await this.quotaState.configureProducts(values);
      }
    } catch {
      this.errorMessage.set('No se pudieron guardar las cuotas. Inténtalo nuevamente.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
