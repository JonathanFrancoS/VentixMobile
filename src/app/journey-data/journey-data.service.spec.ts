import { Preferences } from '@capacitor/preferences';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { JourneyDataService, type JourneyDataValues } from './journey-data.service';

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

const completedValues: JourneyDataValues = {
  advisorName: 'Brian Tracy',
  advisorCode: 'AS-12',
  salesPointName: 'Tienda Central',
  salesPointCode: '',
  city: 'Medellín',
};

describe('JourneyDataService persistence', () => {
  beforeEach(() => {
    vi.mocked(Preferences.get).mockReset().mockResolvedValue({ value: null });
    vi.mocked(Preferences.set).mockReset().mockResolvedValue();
  });

  afterEach(() => vi.restoreAllMocks());

  it('restores the saved journey and keeps its system start time after an app restart', async () => {
    const startedAt = 1_800_000_000_000;
    const clock = vi.spyOn(Date, 'now').mockReturnValue(startedAt);
    const get = vi.mocked(Preferences.get);
    const set = vi.mocked(Preferences.set);
    const firstSession = new JourneyDataService();

    await firstSession.initialize();
    await firstSession.startJourney(completedValues);
    const savedJourney = JSON.parse(set.mock.calls[0][0].value) as {
      values: JourneyDataValues;
      startedAt: number;
    };

    expect(savedJourney.startedAt).toBe(startedAt);

    get.mockResolvedValue({ value: JSON.stringify({ ...savedJourney, version: 1, dateTimeFormat: 'military' }) });
    clock.mockReturnValue(startedAt + 86_400_000);
    const restartedSession = new JourneyDataService();
    await restartedSession.initialize();

    expect(restartedSession.values()).toEqual(completedValues);
    expect(restartedSession.startDateTime()).toBe(firstSession.startDateTime());
  });

  it('assigns a new start time after all journey data are cleared', async () => {
    const clock = vi.spyOn(Date, 'now').mockReturnValue(1_800_000_000_000);
    const get = vi.mocked(Preferences.get);
    const set = vi.mocked(Preferences.set);
    const journey = new JourneyDataService();

    await journey.initialize();
    await journey.startJourney(completedValues);
    clock.mockReturnValue(1_800_000_100_000);
    for (const field of ['advisorName', 'advisorCode', 'salesPointName', 'city'] as const) {
      await journey.clearField(field);
    }

    const savedJourney = JSON.parse(set.mock.calls.at(-1)![0].value) as { startedAt: number };
    const newJourneyStart = journey.startDateTime();
    expect(journey.hasData()).toBe(false);
    expect(savedJourney.startedAt).toBe(1_800_000_100_000);

    get.mockResolvedValue({
      value: JSON.stringify({
        ...JSON.parse(set.mock.calls.at(-1)![0].value),
        version: 1,
        dateTimeFormat: 'military',
      }),
    });
    clock.mockReturnValue(1_800_000_200_000);
    const restartedJourney = new JourneyDataService();
    await restartedJourney.initialize();

    expect(restartedJourney.startDateTime()).toBe(newJourneyStart);
  });
});
