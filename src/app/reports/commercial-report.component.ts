import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  AlertController,
  IonButton,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  checkmarkCircleOutline,
  downloadOutline,
  eyeOutline,
  shareOutline,
  trendingUpOutline,
} from 'ionicons/icons';
import type { jsPDF } from 'jspdf';

import { JourneyLifecycleService } from '../journey-data/journey-lifecycle.service';

import {
  CommercialReportService,
  type CommercialReportCategory,
  type ReportKind,
  type CommercialReportSnapshot,
} from './commercial-report.service';
import { ReportPdfService } from './report-pdf.service';

@Component({
  selector: 'app-commercial-report',
  templateUrl: './commercial-report.component.html',
  imports: [IonButton, IonContent, IonFooter, IonHeader, IonIcon, IonModal, IonTitle, IonToolbar],
})
export class CommercialReportComponent {
  readonly report = computed(() => this.reportService.createSnapshot('partial'));
  readonly previewSnapshot = signal<CommercialReportSnapshot | null>(null);
  readonly isBusy = signal(false);
  readonly errorMessage = signal('');

  private readonly reportService = inject(CommercialReportService);
  private readonly pdfService = inject(ReportPdfService);
  private readonly journeyLifecycle = inject(JourneyLifecycleService);
  private readonly alertController = inject(AlertController);
  private readonly router = inject(Router);
  private previewPdf: jsPDF | null = null;

  constructor() {
    addIcons({
      alertCircleOutline,
      checkmarkCircleOutline,
      downloadOutline,
      eyeOutline,
      shareOutline,
      trendingUpOutline,
    });
  }

  protected formatNumber(value: number, maximumFractionDigits = 2): string {
    return new Intl.NumberFormat('es-CO', { maximumFractionDigits }).format(value);
  }

  protected formatPercentage(value: number | null): string {
    return value === null ? '—' : `${this.formatNumber(value)}%`;
  }

  protected formatDate(value: string): string {
    return new Intl.DateTimeFormat('es-CO', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
  }

  protected progress(value: number | null): number {
    return value === null ? 0 : Math.min(value, 100);
  }

  protected pendingEquivalent(report: CommercialReportSnapshot): number {
    return Math.max(0, report.totalQuota - report.totalEquivalentBottles);
  }

  protected formatGap(value: number): string {
    return `${value > 0 ? '+' : ''}${this.formatNumber(value)} bot. eq.`;
  }

  protected statusIcon(category: CommercialReportCategory): string {
    if (category.percentage === null) {
      return 'alert-circle-outline';
    }
    return category.percentage >= 100 ? 'checkmark-circle-outline' : 'trending-up-outline';
  }

  protected categoryTone(category: CommercialReportCategory): string {
    if (category.percentage === null) {
      return 'unconfigured';
    }
    return category.percentage >= 100 ? 'met' : 'pending';
  }

  protected async togglePreview(): Promise<void> {
    await this.openPreview('final');
  }

  protected async togglePartialPreview(): Promise<void> {
    await this.openPreview('partial');
  }

  private async openPreview(kind: ReportKind): Promise<void> {
    if (this.previewSnapshot()) {
      this.closePreview();
      return;
    }
    if (this.isBusy()) {
      return;
    }

    this.isBusy.set(true);
    this.errorMessage.set('');
    try {
      const snapshot = this.reportService.createSnapshot(kind);
      this.previewPdf = await this.pdfService.createPdf(snapshot);
      this.previewSnapshot.set(snapshot);
    } catch (error) {
      console.error(`No se pudo crear la vista previa del informe ${kind}.`, error);
      this.errorMessage.set(
        'No se pudo crear la vista previa. Revisa las fotografías adjuntas e inténtalo nuevamente.',
      );
    } finally {
      this.isBusy.set(false);
    }
  }

  protected closePreview(): void {
    this.previewSnapshot.set(null);
    this.previewPdf = null;
  }

  protected async downloadPartialReport(): Promise<void> {
    await this.deliverPartialReport('download');
  }

  protected async sharePartialReport(): Promise<void> {
    await this.deliverPartialReport('share');
  }

  private async deliverPartialReport(delivery: 'download' | 'share'): Promise<void> {
    if (this.isBusy()) {
      return;
    }

    this.isBusy.set(true);
    this.errorMessage.set('');
    try {
      const snapshot = this.previewSnapshot();
      const pdf = this.previewPdf;
      if (!snapshot || snapshot.kind !== 'partial' || !pdf) {
        throw new Error('Vuelve a generar la vista previa del informe parcial.');
      }

      if (delivery === 'download') {
        await this.pdfService.downloadPdf(pdf, this.pdfService.filename(snapshot));
      } else {
        await this.pdfService.sharePdf(pdf, this.pdfService.filename(snapshot), snapshot.title);
      }
      if (!(await this.router.navigateByUrl('/folder/Inicio'))) {
        throw new Error('El informe parcial se generó, pero no se pudo volver a Inicio.');
      }
    } catch (error) {
      console.error(`No se pudo ${delivery === 'download' ? 'descargar' : 'compartir'} el informe parcial.`, error);
      this.errorMessage.set(
        `No se pudo ${delivery === 'download' ? 'descargar' : 'compartir'} el PDF parcial. La jornada sigue activa; inténtalo nuevamente.`,
      );
    } finally {
      this.isBusy.set(false);
    }
  }

  protected async downloadFinalReport(): Promise<void> {
    await this.confirmFinalReport('download');
  }

  protected async shareFinalReport(): Promise<void> {
    await this.confirmFinalReport('share');
  }

  private async confirmFinalReport(delivery: 'download' | 'share'): Promise<void> {
    if (this.isBusy()) {
      return;
    }

    this.isBusy.set(true);
    this.errorMessage.set('');
    let reportDelivered = false;
    try {
      const alert = await this.alertController.create({
        header: 'Cerrar jornada',
        message: `Se ${delivery === 'download' ? 'descargará' : 'compartirá'} el PDF y se borrarán las ventas, cuotas, observaciones y datos de esta jornada. ¿Deseas continuar?`,
        buttons: [
          { text: 'Cancelar', role: 'cancel' },
          { text: `${delivery === 'download' ? 'Descargar' : 'Compartir'} y cerrar`, role: 'destructive' },
        ],
      });
      await alert.present();
      const { role } = await alert.onDidDismiss();
      if (role !== 'destructive') {
        this.closePreview();
        return;
      }

      const pdf = this.previewPdf;
      const snapshot = this.previewSnapshot();
      if (!pdf || !snapshot || snapshot.kind !== 'final') {
        this.errorMessage.set('Vuelve a generar la vista previa antes de cerrar la jornada.');
        return;
      }

      if (delivery === 'download') {
        await this.pdfService.downloadPdf(pdf, this.pdfService.filename(snapshot));
      } else {
        await this.pdfService.sharePdf(pdf, this.pdfService.filename(snapshot), snapshot.title);
      }
      reportDelivered = true;
      await this.journeyLifecycle.closeJourney();
    } catch (error) {
      console.error('No se pudo completar la entrega del cierre final.', error);
      this.errorMessage.set(
        reportDelivered
          ? 'El PDF se entregó, pero no se pudo completar el cierre de la jornada. Los datos pueden requerir revisión.'
          : `No se pudo ${delivery === 'download' ? 'descargar' : 'compartir'} el PDF; la jornada no se cerró. Inténtalo nuevamente.`,
      );
    } finally {
      this.isBusy.set(false);
    }
  }
}
