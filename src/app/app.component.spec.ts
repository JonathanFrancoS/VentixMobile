import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router, RouterLink } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';

import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([]), provideIonicAngular({ mode: 'md' })],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
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
});
