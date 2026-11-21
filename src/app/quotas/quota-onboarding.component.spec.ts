import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { Preferences } from '@capacitor/preferences';
import { afterEach, vi } from 'vitest';

import { QuotaOnboardingComponent } from './quota-onboarding.component';
import { quotaSections } from './quota-sections';
import { QuotaStateService } from './quota-state.service';

describe('QuotaOnboardingComponent', () => {
  let fixture: ComponentFixture<QuotaOnboardingComponent>;
  let quotaState: QuotaStateService;

  beforeEach(async () => {
    await Preferences.remove({ key: 'ventix.quotas.v1' });
    await TestBed.configureTestingModule({
      imports: [QuotaOnboardingComponent],
    }).compileComponents();

    quotaState = TestBed.inject(QuotaStateService);
    fixture = TestBed.createComponent(QuotaOnboardingComponent);
    fixture.detectChanges();
  });

  afterEach(async () => {
    await Preferences.remove({ key: 'ventix.quotas.v1' });
  });

  it('saves independent general quotas for aguardiente, young rum, and specialized rum', async () => {
    const app = fixture.nativeElement as HTMLElement;
    (app.querySelector('.quota-mode-card') as HTMLButtonElement).click();
    fixture.detectChanges();

    const aguardientes = app.querySelector('#quota-total-aguardientes') as HTMLInputElement;
    const ronesJovenes = app.querySelector('#quota-total-ron-joven') as HTMLInputElement;
    const ronesEspecializados = app.querySelector('#quota-total-ron-especializado') as HTMLInputElement;
    aguardientes.value = '40';
    aguardientes.dispatchEvent(new Event('input', { bubbles: true }));
    ronesJovenes.value = '15';
    ronesJovenes.dispatchEvent(new Event('input', { bubbles: true }));
    ronesEspecializados.value = '5';
    ronesEspecializados.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    (app.querySelector('.quota-setup-submit') as HTMLElement).click();

    await vi.waitFor(() => expect(quotaState.configured()).toBe(true));
    expect(quotaState.totals()['aguardiente']).toBe(40);
    expect(quotaState.totals()['ron-young']).toBe(15);
    expect(quotaState.totals()['ron-specialized']).toBe(5);
    expect(quotaState.totals()['ron-combined']).toBe(20);
    expect(quotaState.totals()['total']).toBe(60);
    const stored = await Preferences.get({ key: 'ventix.quotas.v1' });
    expect(stored.value).toContain('"configured":true');
  });

  it('restores the configured quota mode after restarting the app', async () => {
    await Preferences.set({
      key: 'ventix.quotas.v1',
      value: JSON.stringify({
        version: 1,
        productQuotas: {},
        manualTotals: { aguardiente: 40, 'ron-combined': 20 },
        configured: true,
      }),
    });

    await quotaState.initialize();

    expect(quotaState.configured()).toBe(true);
    expect(quotaState.totals()['aguardiente']).toBe(40);
    expect(quotaState.totals()['ron-combined']).toBe(20);
  });

  it('returns to quota choices with an accessible arrow button', () => {
    const app = fixture.nativeElement as HTMLElement;
    (app.querySelector('.quota-mode-card') as HTMLButtonElement).click();
    fixture.detectChanges();

    const backButton = app.querySelector('.quota-back') as HTMLButtonElement;
    expect(backButton.getAttribute('aria-label')).toBe('Volver a las opciones');
    expect(backButton.querySelector('ion-icon')?.getAttribute('name')).toBe('arrow-back-outline');
    expect(backButton.parentElement?.classList.contains('quota-title-row')).toBe(true);
    expect(backButton.parentElement?.firstElementChild).toBe(backButton);
    expect(backButton.parentElement?.querySelector('h1')?.textContent).toContain('Define tus cuotas');

    backButton.click();
    fixture.detectChanges();
    expect(app.querySelectorAll('.quota-mode-card').length).toBe(2);
  });

  it('saves quotas by product reference across aguardiente and ron sections', async () => {
    const app = fixture.nativeElement as HTMLElement;
    (app.querySelectorAll('.quota-mode-card')[1] as HTMLButtonElement).click();
    fixture.detectChanges();

    const aguardiente = quotaSections[0].families[0].products[0];
    const ron = quotaSections[1].families[0].products[0];
    const inputs = Array.from(app.querySelectorAll('input'));
    const aguardienteInput = inputs.find((input) => input.id === `setup-${aguardiente.id}`)!;
    const ronInput = inputs.find((input) => input.id === `setup-${ron.id}`)!;
    aguardienteInput.value = '9';
    aguardienteInput.dispatchEvent(new Event('input', { bubbles: true }));
    ronInput.value = '3';
    ronInput.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    (app.querySelector('.quota-setup-submit') as HTMLElement).click();

    await vi.waitFor(() => expect(quotaState.configured()).toBe(true));
    expect(quotaState.productQuotas()[aguardiente.id]).toBe(9);
    expect(quotaState.productQuotas()[ron.id]).toBe(3);
    expect(quotaState.totals()['aguardiente']).toBe(9);
    expect(quotaState.totals()['ron-young']).toBe(3);
    expect(quotaState.totals()['ron-combined']).toBe(3);
  });
});
