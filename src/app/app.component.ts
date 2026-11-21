import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { App } from '@capacitor/app';
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
  ToastController,
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
import { JourneyLifecycleService } from './journey-data/journey-lifecycle.service';
import { JourneyOnboardingComponent } from './journey-data/journey-onboarding.component';
import { QuotaOnboardingComponent } from './quotas/quota-onboarding.component';
import { QuotaStateService } from './quotas/quota-state.service';
import { CommercialReportService } from './reports/commercial-report.service';
import { ReportPdfService } from './reports/report-pdf.service';

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
  private readonly journeyLifecycle = inject(JourneyLifecycleService);
  private readonly alertController = inject(AlertController);
  private readonly menuController = inject(MenuController);
  private readonly toastController = inject(ToastController);
  private readonly quotaState = inject(QuotaStateService);
  private readonly reportService = inject(CommercialReportService);
  private readonly reportPdfService = inject(ReportPdfService);
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
    let pdfDownloaded = false;
    let journeyClosed = false;
    let closeToastMessage: string | undefined;
    try {
      const platform = Capacitor.getPlatform();
      const confirmation = await this.alertController.create({
        header: 'Cerrar jornada',
        message: `Se descargará el PDF de cierre final y después se borrarán las ventas, cuotas, observaciones y datos de esta jornada. ${
          platform === 'android'
            ? 'La aplicación se cerrará al terminar.'
            : 'En iOS o navegador volverás al inicio; no se permite cerrar la aplicación automáticamente.'
        } ¿Deseas continuar?`,
        buttons: [
          { text: 'Cancelar', role: 'cancel' },
          { text: 'Descargar PDF y cerrar', role: 'destructive' },
        ],
      });
      await confirmation.present();
      const { role } = await confirmation.onDidDismiss();
      if (role !== 'destructive') {
        return;
      }

      const report = this.reportService.createSnapshot('final');
      const pdf = await this.reportPdfService.createPdf(report);
      await this.reportPdfService.downloadPdf(pdf, this.reportPdfService.filename(report));
      pdfDownloaded = true;
      await this.journeyLifecycle.closeJourney({ navigateToHome: platform !== 'android' });
      journeyClosed = true;
      await this.menuController.close();
      if (platform === 'android') {
        try {
          await App.exitApp();
          return;
        } catch (error) {
          console.error('La jornada se cerró, pero Android no pudo cerrar la aplicación automáticamente.', error);
          closeToastMessage = 'PDF descargado y jornada reiniciada. Puedes cerrar la aplicación manualmente.';
        }
      } else {
        closeToastMessage = 'PDF de cierre descargado. La jornada se reinició correctamente.';
      }
    } catch (error) {
      console.error('No se pudo cerrar la jornada actual.', error);
      const message = !pdfDownloaded
        ? 'No se pudo generar o descargar el PDF; la jornada no se borró. Revisa el almacenamiento e inténtalo nuevamente.'
        : journeyClosed
          ? 'El PDF se descargó y la jornada se cerró, pero no se pudo terminar el proceso de salida. Puedes cerrar la aplicación manualmente.'
          : 'El PDF se descargó, pero no se pudo completar el borrado de la jornada. Revisa los datos antes de volver a intentarlo.';
      await this.showCloseJourneyError(message);
      return;
    } finally {
      this.closingJourney.set(false);
    }

    if (closeToastMessage) {
      await new Promise<void>((resolve) => setTimeout(resolve, 1000));
      await this.showCloseJourneyToast(closeToastMessage);
    }
  }

  private async loadJourneyData(): Promise<void> {
    try {
      await Promise.all([this.journeyData.initialize(), this.quotaState.initialize()]);
    } catch (error) {
      console.error('No se pudieron cargar los datos guardados de la jornada y las cuotas.', error);
      this.journeyLoadError.set(true);
    }
  }

  private async showCloseJourneyError(message: string): Promise<void> {
    const alert = await this.alertController.create({
      header: 'No se pudo completar el cierre',
      message,
      buttons: ['Entendido'],
    });
    await alert.present();
  }

  private async showCloseJourneyToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3500,
      position: 'bottom',
      color: 'success',
    });
    await toast.present();
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
