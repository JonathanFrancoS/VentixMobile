import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router, RouterLink } from '@angular/router';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { AlertController, MenuController, provideIonicAngular, ToastController } from '@ionic/angular';
import { afterEach, vi } from 'vitest';

import { AppComponent } from './app.component';
import { JourneyDataService } from './journey-data/journey-data.service';
import { ObservationsService } from './observations/observations.service';
import { QuotaStateService } from './quotas/quota-state.service';
import { ReportPdfService } from './reports/report-pdf.service';
import { SalesStateService } from './sales/sales-state.service';

vi.mock('@capacitor/app', () => ({
  App: { exitApp: vi.fn().mockResolvedValue(undefined) },
}));

@Component({ standalone: true, template: '' })
class HomeRouteStubComponent {}

describe('AppComponent', () => {
  let dismissedRole: string;
  let createAlert: ReturnType<typeof vi.fn>;
  let createToast: ReturnType<typeof vi.fn>;
  let closeMenu: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    dismissedRole = 'cancel';
    const alert = {
      present: vi.fn().mockResolvedValue(undefined),
      onDidDismiss: vi.fn().mockImplementation(async () => ({ role: dismissedRole })),
    };
    createAlert = vi.fn().mockResolvedValue(alert);
    createToast = vi.fn().mockResolvedValue({ present: vi.fn().mockResolvedValue(undefined) });
    closeMenu = vi.fn().mockResolvedValue(true);

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([
          { path: '', component: HomeRouteStubComponent },
          { path: 'folder', children: [{ path: 'Inicio', component: HomeRouteStubComponent }] },
        ]),
        provideIonicAngular({ mode: 'md' }),
        { provide: AlertController, useValue: { create: createAlert } },
        { provide: MenuController, useValue: { close: closeMenu } },
        { provide: ToastController, useValue: { create: createToast } },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should show the Ventix Mobile splash while the initial route loads', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const splash = fixture.nativeElement.querySelector('.startup-splash') as HTMLElement | null;
    expect(splash?.textContent).toContain('Ventix Mobile');
    expect(splash?.querySelector('img')?.getAttribute('src')).toBe('/assets/icon/favicon.png');
  });

  it('should show navigation items without labels and place the close-shift button at the bottom', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const app = fixture.nativeElement;
    expect(app.querySelector('#labels-list')).toBeNull();
    expect(app.querySelectorAll('#inbox-list ion-item').length).toEqual(6);
    const closeShiftButton = app.querySelector('ion-menu > ion-footer ion-button');
    expect(closeShiftButton?.textContent).toContain('Cerrar jornada');
    expect(closeShiftButton?.getAttribute('mode')).toBeNull();
  });

  it('should have urls', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const app = fixture.nativeElement;
    expect(app.querySelectorAll('ion-item').length).toEqual(6);
    // Ionic applies the rendered href through its own async write queue, so
    // reading the DOM attribute is flaky (FW-6264). Assert the routerLink
    // binding directly, which resolves synchronously.
    const router = TestBed.inject(Router);
    const links = fixture.debugElement.queryAll(By.directive(RouterLink)).map((el) => el.injector.get(RouterLink));
    expect(links.length).toEqual(6);
    expect(router.serializeUrl(links[0].urlTree!)).toEqual('/folder/Inicio');
    expect(router.serializeUrl(links[1].urlTree!)).toEqual('/folder/Registro%20de%20ventas');
  });

  it('confirms closing the journey and clears sales, quotas, observations, and journey data', async () => {
    dismissedRole = 'destructive';
    vi.spyOn(Capacitor, 'getPlatform').mockReturnValue('android');
    const exitApp = vi.spyOn(App, 'exitApp').mockImplementation(async () => undefined);
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const journeyData = TestBed.inject(JourneyDataService);
    await journeyData.initialize();
    await journeyData.startJourney({
      advisorName: 'Brian Tracy',
      advisorCode: 'AS-12',
      salesPointName: 'Tienda Central',
      salesPointCode: '',
      city: '',
    });

    const salesState = TestBed.inject(SalesStateService);
    salesState.adjustQuantity('test-product', 1);
    salesState.adjustQuantity('test-product', 1);
    const quotaState = TestBed.inject(QuotaStateService);
    await quotaState.initialize();
    await quotaState.configureTotals(25, 10, 0);
    quotaState.setProductQuota('test-product', 10);
    quotaState.setManualTotal('aguardiente', 25);
    const observations = TestBed.inject(ObservationsService);
    observations.addObservation('Novedad de prueba');
    const downloadPdf = vi
      .spyOn(TestBed.inject(ReportPdfService), 'downloadPdf')
      .mockImplementation(async () => undefined);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.menu-footer ion-button') as HTMLElement).click();
    await vi.waitFor(() => expect(closeMenu).toHaveBeenCalledOnce());
    fixture.detectChanges();

    expect(downloadPdf).toHaveBeenCalledOnce();
    expect(downloadPdf.mock.calls[0][1]).toContain('Cierre-Final');
    expect(exitApp).toHaveBeenCalledOnce();
    expect(salesState.quantities()).toEqual({});
    expect(quotaState.totals()['aguardiente']).toBe(0);
    expect(observations.observations()).toEqual([]);
    expect(journeyData.hasData()).toBe(false);
    expect(fixture.nativeElement.querySelector('app-journey-onboarding')).not.toBeNull();
  });

  it('keeps the active journey intact when close is canceled', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const journeyData = TestBed.inject(JourneyDataService);
    await journeyData.initialize();
    await journeyData.startJourney({
      advisorName: 'Brian Tracy',
      advisorCode: 'AS-12',
      salesPointName: 'Tienda Central',
      salesPointCode: '',
      city: '',
    });
    const salesState = TestBed.inject(SalesStateService);
    salesState.adjustQuantity('test-product', 1);
    const quotaState = TestBed.inject(QuotaStateService);
    await quotaState.initialize();
    await quotaState.configureTotals(25, 10, 0);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.menu-footer ion-button') as HTMLElement).click();
    await fixture.whenStable();

    expect(journeyData.hasData()).toBe(true);
    expect(salesState.quantities()).toEqual({ 'test-product': 1 });
    expect(closeMenu).not.toHaveBeenCalled();
  });

  it('continues to quota setup after journey data are saved', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const journeyData = TestBed.inject(JourneyDataService);
    const quotaState = TestBed.inject(QuotaStateService);
    await Promise.all([journeyData.initialize(), quotaState.initialize()]);
    await quotaState.reset();
    await journeyData.startJourney({
      advisorName: 'Laura Gómez',
      advisorCode: 'AS-12',
      salesPointName: 'Tienda Central',
      salesPointCode: '',
      city: '',
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-journey-onboarding')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-quota-onboarding')).not.toBeNull();
  });

  it('shows an automatically dismissed toast after closing on iOS', async () => {
    dismissedRole = 'destructive';
    vi.spyOn(Capacitor, 'getPlatform').mockReturnValue('ios');
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const journeyData = TestBed.inject(JourneyDataService);
    await journeyData.initialize();
    await journeyData.startJourney({
      advisorName: 'Brian Tracy',
      advisorCode: 'AS-12',
      salesPointName: 'Tienda Central',
      salesPointCode: '',
      city: '',
    });
    await TestBed.inject(QuotaStateService).initialize();
    vi.spyOn(TestBed.inject(ReportPdfService), 'downloadPdf').mockResolvedValue(undefined);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.menu-footer ion-button') as HTMLElement).click();
    await vi.waitFor(() => expect(createToast).toHaveBeenCalledOnce(), { timeout: 2000 });

    expect(createToast).toHaveBeenCalledWith({
      message: 'PDF de cierre descargado. La jornada se reinició correctamente.',
      duration: 3500,
      position: 'bottom',
      color: 'success',
    });
    expect(fixture.nativeElement.querySelector('app-journey-onboarding')).not.toBeNull();
    expect(TestBed.inject(Router).url).toBe('/folder/Inicio');
  });
});
