import { Preferences } from '@capacitor/preferences';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { JourneyDataService, type JourneyDataValues } from './journey-data.service';

const completedValues: JourneyDataValues = {
  advisorName: 'Brian Tracy',
  advisorCode: 'AS-12',
  salesPointName: 'Tienda Central',
  salesPointCode: '',
  city: 'Medellín',
};

describe('JourneyDataService persistence', () => {
  beforeEach(async () => {
    await Preferences.remove({ key: 'ventix.journey.v1' });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await Preferences.remove({ key: 'ventix.journey.v1' });
  });

  it('restores the saved journey and keeps its system start time after an app restart', async () => {
    const startedAt = 1_800_000_000_000;
    const clock = vi.spyOn(Date, 'now').mockReturnValue(startedAt);
    const firstSession = new JourneyDataService();

    await firstSession.initialize();
    await firstSession.startJourney(completedValues);
    const stored = await Preferences.get({ key: 'ventix.journey.v1' });
    if (!stored.value) {
      throw new Error('No se guardó la jornada de prueba.');
    }
    const savedJourney = JSON.parse(stored.value) as {
      values: JourneyDataValues;
      startedAt: number;
    };

    expect(savedJourney.startedAt).toBe(startedAt);

    clock.mockReturnValue(startedAt + 86_400_000);
    const restartedSession = new JourneyDataService();
    await restartedSession.initialize();

    expect(restartedSession.values()).toEqual(completedValues);
    expect(restartedSession.startDateTime()).toBe(firstSession.startDateTime());
  });

  it('assigns a new start time after all journey data are cleared', async () => {
    const clock = vi.spyOn(Date, 'now').mockReturnValue(1_800_000_000_000);
    const journey = new JourneyDataService();

    await journey.initialize();
    await journey.startJourney(completedValues);
    clock.mockReturnValue(1_800_000_100_000);
    for (const field of ['advisorName', 'advisorCode', 'salesPointName', 'city'] as const) {
      await journey.clearField(field);
    }

    const stored = await Preferences.get({ key: 'ventix.journey.v1' });
    if (!stored.value) {
      throw new Error('No se guardó el inicio de la nueva jornada.');
    }
    const savedJourney = JSON.parse(stored.value) as { startedAt: number };
    const newJourneyStart = journey.startDateTime();
    expect(journey.hasData()).toBe(false);
    expect(savedJourney.startedAt).toBe(1_800_000_100_000);

    clock.mockReturnValue(1_800_000_200_000);
    const restartedJourney = new JourneyDataService();
    await restartedJourney.initialize();

    expect(restartedJourney.startDateTime()).toBe(newJourneyStart);
  });
});
