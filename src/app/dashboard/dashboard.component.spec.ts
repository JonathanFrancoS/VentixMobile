import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterLink, provideRouter } from '@angular/router';

import { JourneyDataService } from '../journey-data/journey-data.service';
import { QuotaStateService } from '../quotas/quota-state.service';
import { SalesStateService } from '../sales/sales-state.service';

import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let journeyData: JourneyDataService;
  let quotaState: QuotaStateService;
  let salesState: SalesStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    journeyData = TestBed.inject(JourneyDataService);
    quotaState = TestBed.inject(QuotaStateService);
    salesState = TestBed.inject(SalesStateService);
    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
  });

  it('shows live totals including specialized rum and marks performance below 90 percent', () => {
    quotaState.setProductQuota('antioqueno-verde-3', 10);
    quotaState.setProductQuota('ron-5-anos-0', 10);
    for (let count = 0; count < 9; count += 1) {
      salesState.adjustQuantity('antioqueno-verde-3', 1);
    }
    for (let count = 0; count < 4; count += 1) {
      salesState.adjustQuantity('ron-5-anos-0', 1);
    }
    fixture.detectChanges();

    const app = fixture.nativeElement as HTMLElement;
    expect(app.querySelector('.performance-center strong')?.textContent?.trim()).toBe('65%');
    expect(app.querySelector('.performance-ring')?.classList.contains('performance-ring--low')).toBe(true);

    const cards = Array.from(app.querySelectorAll('.quota-card'));
    expect(cards.map((card) => card.querySelector('h3')?.textContent?.trim())).toEqual([
      'Cuota Total',
      'Aguardiente',
      'Rones',
    ]);
    expect(cards[0].textContent).toContain('20');
    expect(cards[0].textContent).toContain('13');
    expect(cards[2].textContent).toContain('10');
    expect(cards[2].textContent).toContain('4');
  });

  it('greets the advisor and provides navigation to sales and the preliminary report', () => {
    journeyData.setField('advisorName', 'Jonathan Pérez');
    journeyData.setField('salesPointName', 'Tienda Central');
    journeyData.setField('advisorCode', 'A-123');
    fixture.detectChanges();

    const app = fixture.nativeElement as HTMLElement;
    expect(app.querySelector('h1')?.textContent).toContain('¡Hola, Jonathan! 👋');
    expect(app.textContent).toContain('Tienda Central');
    expect(app.textContent).toContain('A-123');
    const destinations = fixture.debugElement
      .queryAll(By.directive(RouterLink))
      .map((element) => element.injector.get(RouterLink).href);
    expect(destinations).toEqual(['/folder/Registro%20de%20ventas', '/folder/Informes']);
    expect(app.textContent).toContain('Ver Informe Preliminar');
  });

  it('updates commercial family chips and colors completion at the requested thresholds', () => {
    quotaState.setManualTotal('aguardiente', 10);
    for (let count = 0; count < 8; count += 1) {
      salesState.adjustQuantity('antioqueno-verde-3', 1);
    }
    fixture.detectChanges();

    const app = fixture.nativeElement as HTMLElement;
    const aguardienteCard = app.querySelector('.commercial-card') as HTMLElement;
    expect(aguardienteCard.querySelector('.commercial-percentage')?.textContent?.trim()).toBe('80%');
    expect(aguardienteCard.classList.contains('commercial-card--warning')).toBe(true);
    expect(aguardienteCard.textContent).toContain('Verde 24°: 8 bot. eq.');
    expect(aguardienteCard.textContent).toContain('Azul: 0 bot. eq.');

    salesState.adjustQuantity('antioqueno-verde-3', 1);
    fixture.detectChanges();
    expect(aguardienteCard.classList.contains('commercial-card--good')).toBe(true);

    for (let count = 0; count < 5; count += 1) {
      salesState.adjustQuantity('antioqueno-verde-3', -1);
    }
    fixture.detectChanges();
    expect(aguardienteCard.classList.contains('commercial-card--danger')).toBe(true);
  });
});
