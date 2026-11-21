import { computed, Injectable, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

import { salesFamilies } from '../sales/sales-catalog.data';

const aguardienteFamilies = salesFamilies.filter((family) => family.category === 'Aguardiente');
const ronFamilies = salesFamilies.filter((family) => family.category !== 'Aguardiente');
const STORAGE_KEY = 'ventix.quotas.v1';

type QuotaSnapshot = {
  version: 1;
  productQuotas: Record<string, number>;
  manualTotals: Record<string, number>;
  configured: boolean;
};

function emptyProductQuotas(): Record<string, number> {
  return Object.fromEntries(salesFamilies.flatMap((family) => family.products.map((product) => [product.id, 0])));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isQuotaValues(value: unknown): value is Record<string, number> {
  return (
    isRecord(value) &&
    Object.values(value).every((quota) => typeof quota === 'number' && Number.isFinite(quota) && quota >= 0)
  );
}

@Injectable({ providedIn: 'root' })
export class QuotaStateService {
  readonly initialized = signal(false);
  readonly configured = signal(false);
  readonly persistenceError = signal<string | null>(null);
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

  private initializationPromise: Promise<void> | undefined;
  private pendingWrite: Promise<void> = Promise.resolve();

  initialize(): Promise<void> {
    if (!this.initializationPromise) {
      this.initializationPromise = this.loadQuotas().catch((error: unknown) => {
        this.initializationPromise = undefined;
        throw error;
      });
    }
    return this.initializationPromise;
  }

  setProductQuota(productId: string, value: number): void {
    const productQuotas = { ...this.productQuotas(), [productId]: this.normalize(value) };
    this.productQuotas.set(productQuotas);
    this.persistCurrentState();
  }

  setManualTotal(id: string, value: number): void {
    const manualTotals = { ...this.manualTotals(), [id]: this.normalize(value) };
    this.manualTotals.set(manualTotals);
    this.persistCurrentState();
  }

  resetManualTotal(id: string): void {
    this.manualTotals.update((totals) => {
      const { [id]: _removed, ...remainingTotals } = totals;
      return remainingTotals;
    });
    this.persistCurrentState();
  }

  async configureTotals(aguardiente: number, ron: number): Promise<void> {
    await this.applyConfiguration({
      version: 1,
      productQuotas: emptyProductQuotas(),
      manualTotals: {
        aguardiente: this.normalize(aguardiente),
        'ron-combined': this.normalize(ron),
      },
      configured: true,
    });
  }

  async configureProducts(productValues: Record<string, number>): Promise<void> {
    const productQuotas = emptyProductQuotas();
    for (const [productId, value] of Object.entries(productValues)) {
      if (Object.hasOwn(productQuotas, productId)) {
        productQuotas[productId] = this.normalize(value);
      }
    }

    await this.applyConfiguration({
      version: 1,
      productQuotas,
      manualTotals: {},
      configured: true,
    });
  }

  async reset(): Promise<void> {
    await this.applyConfiguration({
      version: 1,
      productQuotas: emptyProductQuotas(),
      manualTotals: {},
      configured: false,
    });
  }

  private async loadQuotas(): Promise<void> {
    const { value } = await Preferences.get({ key: STORAGE_KEY });
    if (value === null) {
      this.initialized.set(true);
      return;
    }

    const snapshot = this.parseSnapshot(value);
    const productQuotas = emptyProductQuotas();
    for (const [productId, quota] of Object.entries(snapshot.productQuotas)) {
      if (Object.hasOwn(productQuotas, productId)) {
        productQuotas[productId] = quota;
      }
    }
    this.productQuotas.set(productQuotas);
    this.manualTotals.set(snapshot.manualTotals);
    this.configured.set(snapshot.configured);
    this.initialized.set(true);
  }

  private parseSnapshot(value: string): QuotaSnapshot {
    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new Error('Las cuotas guardadas no tienen un formato válido.');
    }

    if (
      !isRecord(parsed) ||
      parsed['version'] !== 1 ||
      !isQuotaValues(parsed['productQuotas']) ||
      !isQuotaValues(parsed['manualTotals']) ||
      typeof parsed['configured'] !== 'boolean'
    ) {
      throw new Error('Las cuotas guardadas están incompletas o dañadas.');
    }

    return {
      version: 1,
      productQuotas: parsed['productQuotas'],
      manualTotals: parsed['manualTotals'],
      configured: parsed['configured'],
    };
  }

  private async applyConfiguration(snapshot: QuotaSnapshot): Promise<void> {
    try {
      await this.writeSnapshot(snapshot);
      this.productQuotas.set(snapshot.productQuotas);
      this.manualTotals.set(snapshot.manualTotals);
      this.configured.set(snapshot.configured);
      this.initialized.set(true);
      this.persistenceError.set(null);
    } catch (error) {
      this.reportPersistenceError(error);
      throw error;
    }
  }

  private persistCurrentState(): void {
    const snapshot: QuotaSnapshot = {
      version: 1,
      productQuotas: this.productQuotas(),
      manualTotals: this.manualTotals(),
      configured: this.configured(),
    };
    void this.writeSnapshot(snapshot).then(
      () => this.persistenceError.set(null),
      (error: unknown) => this.reportPersistenceError(error),
    );
  }

  private writeSnapshot(snapshot: QuotaSnapshot): Promise<void> {
    const serializedSnapshot = JSON.stringify(snapshot);
    const write = this.pendingWrite.then(
      () => Preferences.set({ key: STORAGE_KEY, value: serializedSnapshot }),
      () => Preferences.set({ key: STORAGE_KEY, value: serializedSnapshot }),
    );
    this.pendingWrite = write;
    return write;
  }

  private normalize(value: number): number {
    return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
  }

  private reportPersistenceError(error: unknown): void {
    this.persistenceError.set('No se pudieron guardar las cuotas. Inténtalo nuevamente.');
    console.error('No se pudieron guardar las cuotas de la jornada.', error);
  }
}
