import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { Preferences } from '@capacitor/preferences';
import { afterEach, vi } from 'vitest';

import { JourneyDataService } from './journey-data.service';
import { JourneyOnboardingComponent } from './journey-onboarding.component';

describe('JourneyOnboardingComponent', () => {
  let fixture: ComponentFixture<JourneyOnboardingComponent>;
  let journeyData: JourneyDataService;

  beforeEach(async () => {
    await Preferences.remove({ key: 'ventix.journey.v1' });
    await TestBed.configureTestingModule({
      imports: [JourneyOnboardingComponent],
    }).compileComponents();

    journeyData = TestBed.inject(JourneyDataService);
    fixture = TestBed.createComponent(JourneyOnboardingComponent);
    fixture.detectChanges();
  });

  afterEach(async () => {
    await Preferences.remove({ key: 'ventix.journey.v1' });
  });

  it('collects required journey fields and allows the point-of-sale code and city to be skipped', async () => {
    const app = fixture.nativeElement as HTMLElement;
    const requiredFields = [
      { label: 'Nombre del asesor', value: 'Brian Tracy' },
      { label: 'Código del asesor', value: 'AS-12' },
      { label: 'Nombre del punto de venta', value: 'Tienda Central' },
    ];

    for (const field of requiredFields) {
      expect(app.querySelector('label')?.textContent).toContain(field.label);
      const input = app.querySelector('input') as HTMLInputElement;
      input.value = field.value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      fixture.detectChanges();
      (app.querySelector('.onboarding-next') as HTMLElement).click();
      fixture.detectChanges();
    }

    expect(app.querySelector('label')?.textContent).toContain('Código del punto de venta (opcional)');
    (app.querySelector('.onboarding-next') as HTMLElement).click();
    fixture.detectChanges();

    expect(app.querySelector('label')?.textContent).toContain('Ciudad');
    (app.querySelector('.onboarding-next') as HTMLElement).click();
    const expectedValues = {
      advisorName: 'Brian Tracy',
      advisorCode: 'AS-12',
      salesPointName: 'Tienda Central',
      salesPointCode: '',
      city: '',
    };
    await vi.waitFor(() => expect(journeyData.values()).toEqual(expectedValues));
  });

  it('requires each non-optional value before continuing', () => {
    const app = fixture.nativeElement as HTMLElement;
    (app.querySelector('.onboarding-next') as HTMLElement).click();
    fixture.detectChanges();

    expect(app.querySelector('.onboarding-step')?.textContent).toContain('Paso 1 de 5');
    expect(app.querySelector('.onboarding-error')?.textContent).toContain('obligatorio');
  });
});
