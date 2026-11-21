import { computed, Injectable, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

export type JourneyDataField = 'advisorName' | 'advisorCode' | 'salesPointName' | 'salesPointCode' | 'city';

export type JourneyDataValues = Record<JourneyDataField, string>;

export type JourneyDateTimeFormat = 'long' | 'military';

type PersistedJourney = {
  version: 1;
  values: JourneyDataValues;
  startedAt: number;
  dateTimeFormat: JourneyDateTimeFormat;
};

const STORAGE_KEY = 'ventix.journey.v1';
const journeyFields: JourneyDataField[] = ['advisorName', 'advisorCode', 'salesPointName', 'salesPointCode', 'city'];
const emptyValues: JourneyDataValues = {
  advisorName: '',
  advisorCode: '',
  salesPointName: '',
  salesPointCode: '',
  city: '',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isJourneyDataValues(value: unknown): value is JourneyDataValues {
  return isRecord(value) && journeyFields.every((field) => typeof value[field] === 'string');
}

function hasJourneyData(values: JourneyDataValues): boolean {
  return journeyFields.some((field) => values[field].trim().length > 0);
}

@Injectable({ providedIn: 'root' })
export class JourneyDataService {
  readonly initialized = signal(false);
  readonly values = signal<JourneyDataValues>({ ...emptyValues });
  readonly hasData = computed(() => hasJourneyData(this.values()));
  readonly dateTimeFormat = signal<JourneyDateTimeFormat>('military');
  readonly persistenceError = signal<string | null>(null);

  private readonly journeyStartedAt = signal(Date.now());
  private initializationPromise: Promise<void> | undefined;
  private pendingWrite: Promise<void> = Promise.resolve();

  readonly startDateTime = computed(() => {
    const date = new Date(this.journeyStartedAt());
    if (this.dateTimeFormat() === 'long') {
      const month = new Intl.DateTimeFormat('es-CO', { month: 'long' }).format(date);
      const time = new Intl.DateTimeFormat('es-CO', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
        .format(date)
        .replace(/([ap])\.\s*m\./, '$1.m');
      return `${date.getDate()} de ${month} del ${date.getFullYear()} - hora ${time}`;
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const time = new Intl.DateTimeFormat('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(date);
    return `${day}/${month}/${year} - ${time} Hrs`;
  });

  initialize(): Promise<void> {
    if (!this.initializationPromise) {
      this.initializationPromise = this.loadJourney().catch((error: unknown) => {
        this.initializationPromise = undefined;
        throw error;
      });
    }
    return this.initializationPromise;
  }

  async startJourney(values: JourneyDataValues): Promise<void> {
    const normalizedValues: JourneyDataValues = {
      advisorName: values.advisorName.trim(),
      advisorCode: values.advisorCode.trim(),
      salesPointName: values.salesPointName.trim(),
      salesPointCode: values.salesPointCode.trim(),
      city: values.city.trim(),
    };
    const startedAt = this.journeyStartedAt();

    try {
      await this.writeSnapshot(normalizedValues, startedAt, this.dateTimeFormat());
      this.values.set(normalizedValues);
      this.persistenceError.set(null);
    } catch (error) {
      this.reportPersistenceError(error);
      throw error;
    }
  }

  async createNewJourney(): Promise<void> {
    const values = { ...emptyValues };
    const startedAt = Date.now();
    const dateTimeFormat = this.dateTimeFormat();

    try {
      await this.writeSnapshot(values, startedAt, dateTimeFormat);
      this.values.set(values);
      this.journeyStartedAt.set(startedAt);
      this.persistenceError.set(null);
    } catch (error) {
      this.reportPersistenceError(error);
      throw error;
    }
  }

  setDateTimeFormat(format: JourneyDateTimeFormat): Promise<boolean> {
    this.dateTimeFormat.set(format);
    return this.persistCurrentValues();
  }

  setField(field: JourneyDataField, value: string): Promise<boolean> {
    const currentValues = this.values();
    const updatedValues = { ...currentValues, [field]: value };
    const startsNewJourney = this.hasData() && !hasJourneyData(updatedValues);
    const startedAt = startsNewJourney ? Date.now() : this.journeyStartedAt();

    this.values.set(updatedValues);
    this.journeyStartedAt.set(startedAt);
    return this.persistValues(updatedValues, startedAt, this.dateTimeFormat());
  }

  clearField(field: JourneyDataField): Promise<boolean> {
    return this.setField(field, '');
  }

  private async loadJourney(): Promise<void> {
    const { value } = await Preferences.get({ key: STORAGE_KEY });
    if (value === null) {
      this.values.set({ ...emptyValues });
      this.journeyStartedAt.set(Date.now());
      this.dateTimeFormat.set('military');
      this.initialized.set(true);
      return;
    }

    const journey = this.parseJourney(value);
    this.values.set(journey.values);
    this.journeyStartedAt.set(journey.startedAt);
    this.dateTimeFormat.set(journey.dateTimeFormat);
    this.initialized.set(true);
  }

  private parseJourney(value: string): PersistedJourney {
    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new Error('Los datos guardados de la jornada no tienen un formato válido.');
    }

    if (
      !isRecord(parsed) ||
      parsed['version'] !== 1 ||
      !isJourneyDataValues(parsed['values']) ||
      typeof parsed['startedAt'] !== 'number' ||
      !Number.isFinite(parsed['startedAt']) ||
      (parsed['dateTimeFormat'] !== 'long' && parsed['dateTimeFormat'] !== 'military')
    ) {
      throw new Error('Los datos guardados de la jornada están incompletos o dañados.');
    }

    return {
      version: 1,
      values: parsed['values'],
      startedAt: parsed['startedAt'],
      dateTimeFormat: parsed['dateTimeFormat'],
    };
  }

  private persistCurrentValues(): Promise<boolean> {
    return this.persistValues(this.values(), this.journeyStartedAt(), this.dateTimeFormat());
  }

  private persistValues(
    values: JourneyDataValues,
    startedAt: number,
    dateTimeFormat: JourneyDateTimeFormat,
  ): Promise<boolean> {
    return this.writeSnapshot(values, startedAt, dateTimeFormat).then(
      () => {
        this.persistenceError.set(null);
        return true;
      },
      (error: unknown) => {
        this.reportPersistenceError(error);
        return false;
      },
    );
  }

  private writeSnapshot(
    values: JourneyDataValues,
    startedAt: number,
    dateTimeFormat: JourneyDateTimeFormat,
  ): Promise<void> {
    const journey: PersistedJourney = { version: 1, values, startedAt, dateTimeFormat };
    const serializedJourney = JSON.stringify(journey);
    const write = this.pendingWrite.then(
      () => Preferences.set({ key: STORAGE_KEY, value: serializedJourney }),
      () => Preferences.set({ key: STORAGE_KEY, value: serializedJourney }),
    );
    this.pendingWrite = write;
    return write;
  }

  private reportPersistenceError(error: unknown): void {
    this.persistenceError.set('No se pudieron guardar los datos de la jornada. Inténtalo nuevamente.');
    console.error('No se pudieron guardar los datos persistidos de la jornada.', error);
  }
}
