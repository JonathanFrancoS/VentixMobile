import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import {
  IonApp,
  IonSplitPane,
  IonMenu,
  IonContent,
  IonList,
  IonListHeader,
  IonNote,
  IonMenuToggle,
  IonItem,
  IonIcon,
  IonButton,
  IonFooter,
  IonLabel,
  IonRouterOutlet,
  AlertController,
  MenuController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  homeOutline,
  home,
  receiptOutline,
  receipt,
  pieChartOutline,
  pieChart,
  todayOutline,
  today,
  chatboxEllipsesOutline,
  chatboxEllipses,
  barChartOutline,
  barChart,
  logOutOutline,
} from 'ionicons/icons';
import { filter, take } from 'rxjs';

import { JourneyDataService } from './journey-data/journey-data.service';
import { JourneyOnboardingComponent } from './journey-data/journey-onboarding.component';
import { ObservationsService } from './observations/observations.service';
import { QuotaOnboardingComponent } from './quotas/quota-onboarding.component';
import { QuotaStateService } from './quotas/quota-state.service';
import { SalesStateService } from './sales/sales-state.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [
    RouterLink,
    RouterLinkActive,
    IonApp,
    IonSplitPane,
    IonMenu,
    IonContent,
    IonList,
    IonListHeader,
    IonNote,
    IonMenuToggle,
    IonItem,
    IonIcon,
    IonButton,
    IonFooter,
    IonLabel,
    IonRouterOutlet,
    JourneyOnboardingComponent,
    QuotaOnboardingComponent,
  ],
})
export class AppComponent {
  protected readonly showSplash = signal(true);
  protected readonly showJourneyWizard = computed(
    () =>
      !this.closingJourney() &&
      this.journeyData.initialized() &&
      this.quotaState.initialized() &&
      !this.journeyData.hasData(),
  );
  protected readonly showQuotaWizard = computed(
    () =>
      !this.closingJourney() &&
      this.journeyData.initialized() &&
      this.quotaState.initialized() &&
      this.journeyData.hasData() &&
      !this.quotaState.configured(),
  );
  protected readonly journeyLoadError = signal(false);
  protected readonly closingJourney = signal(false);
  private readonly router = inject(Router);
  private readonly journeyData = inject(JourneyDataService);
  private readonly alertController = inject(AlertController);
  private readonly menuController = inject(MenuController);
  private readonly salesState = inject(SalesStateService);
  private readonly quotaState = inject(QuotaStateService);
  private readonly observationsService = inject(ObservationsService);
  private readonly splashStartedAt = Date.now();
  private nativeSplashFallback: ReturnType<typeof setTimeout> | undefined;
  private splashDismissalStarted = false;

  protected readonly appPages = [
    { title: 'Inicio', url: '/folder/Inicio', icon: 'home-outline', activeIcon: 'home' },
    {
      title: 'Registro de ventas',
      url: '/folder/Registro de ventas',
      icon: 'receipt-outline',
      activeIcon: 'receipt',
    },
    { title: 'Cuotas', url: '/folder/Cuotas', icon: 'pie-chart-outline', activeIcon: 'pie-chart' },
    { title: 'Datos de la jornada', url: '/folder/Datos de la jornada', icon: 'today-outline', activeIcon: 'today' },
    {
      title: 'Observaciones',
      url: '/folder/Observaciones',
      icon: 'chatbox-ellipses-outline',
      activeIcon: 'chatbox-ellipses',
    },
    { title: 'Informes', url: '/folder/Informes', icon: 'bar-chart-outline', activeIcon: 'bar-chart' },
  ];

  constructor() {
    addIcons({
      homeOutline,
      home,
      receiptOutline,
      receipt,
      pieChartOutline,
      pieChart,
      todayOutline,
      today,
      chatboxEllipsesOutline,
      chatboxEllipses,
      barChartOutline,
      barChart,
      logOutOutline,
    });

    void this.loadJourneyData();

    if (Capacitor.isNativePlatform()) {
      this.nativeSplashFallback = setTimeout(() => void this.dismissSplash(), 10000);
    }

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        take(1),
      )
      .subscribe(() => {
        const remainingTime = Math.max(0, 1200 - (Date.now() - this.splashStartedAt));
        setTimeout(() => void this.dismissSplash(), remainingTime);
      });
  }

  protected retryJourneyLoad(): void {
    this.journeyLoadError.set(false);
    void this.loadJourneyData();
  }

  protected async closeJourney(): Promise<void> {
    if (this.closingJourney()) {
      return;
    }

    this.closingJourney.set(true);
    try {
      const confirmation = await this.alertController.create({
        header: 'Cerrar jornada',
        message: 'Se borrarán las ventas, cuotas, observaciones y datos de esta jornada. ¿Deseas continuar?',
        buttons: [
          { text: 'Cancelar', role: 'cancel' },
          { text: 'Cerrar jornada', role: 'destructive' },
        ],
      });
      await confirmation.present();
      const { role } = await confirmation.onDidDismiss();
      if (role !== 'destructive') {
        return;
      }

      await Promise.all([this.journeyData.initialize(), this.quotaState.initialize()]);
      await this.quotaState.reset();
      await this.journeyData.createNewJourney();
    } catch (error) {
      console.error('No se pudo cerrar la jornada actual.', error);
      await this.showCloseJourneyError();
      return;
    } finally {
      this.closingJourney.set(false);
    }

    this.salesState.reset();
    this.quotaState.reset();
    this.observationsService.reset();

    try {
      await this.router.navigateByUrl('/folder/Inicio');
    } catch (error) {
      console.error('No se pudo volver a Inicio después de cerrar la jornada.', error);
    }
    await this.menuController.close();
  }

  private async loadJourneyData(): Promise<void> {
    try {
      await Promise.all([this.journeyData.initialize(), this.quotaState.initialize()]);
    } catch (error) {
      console.error('No se pudieron cargar los datos guardados de la jornada y las cuotas.', error);
      this.journeyLoadError.set(true);
    }
  }

  private async showCloseJourneyError(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'No se pudo cerrar la jornada',
      message: 'No se pudo completar el cierre. Revisa la configuración de cuotas e inténtalo nuevamente.',
      buttons: ['Entendido'],
    });
    await alert.present();
  }

  private async dismissSplash(): Promise<void> {
    if (this.splashDismissalStarted) {
      return;
    }

    this.splashDismissalStarted = true;
    if (this.nativeSplashFallback) {
      clearTimeout(this.nativeSplashFallback);
    }

    if (Capacitor.isNativePlatform()) {
      try {
        await SplashScreen.hide();
        await new Promise<void>((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        console.error('No se pudo ocultar el splash nativo de Capacitor.', error);
      }
    }

    this.showSplash.set(false);
  }
}
