import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  calendarOutline,
  documentTextOutline,
  pricetagOutline,
  refreshOutline,
  receiptOutline,
  trendingDownOutline,
  trendingUpOutline,
} from 'ionicons/icons';

import { JourneyDataService } from '../journey-data/journey-data.service';
import { QuotaStateService } from '../quotas/quota-state.service';
import { salesFamilies } from '../sales/sales-catalog.data';
import { SalesStateService } from '../sales/sales-state.service';

type PerformanceTone = 'empty' | 'good' | 'low';
type CommercialTone = 'good' | 'warning' | 'danger';

const commercialGroupDefinitions = [
  {
    id: 'aguardiente',
    title: 'Aguardiente Antioqueño',
    subtitle: 'Verde 24°, Azul, Tradicional, Real',
    quotaKey: 'aguardiente',
    variants: [
      { familyId: 'antioqueno-verde', label: 'Verde 24°' },
      { familyId: 'antioqueno-azul', label: 'Azul' },
      { familyId: 'antioqueno-rojo', label: 'Tradicional' },
      { familyId: 'antioqueno-real', label: 'Real' },
    ],
  },
  {
    id: 'ron-young',
    title: 'Ron Medellín joven',
    subtitle: 'Dorado y Añejo 3 años',
    quotaKey: 'ron-young',
    variants: [
      { familyId: 'ron-dorado', label: 'Dorado' },
      { familyId: 'ron-3 Años', label: 'Añejo 3 años' },
    ],
  },
  {
    id: 'ron-specialized',
    title: 'Ron Medellín especializado',
    subtitle: '5, 8, 12 y 19 años',
    quotaKey: 'ron-specialized',
    variants: [
      { familyId: 'ron-5-anos', label: '5 años' },
      { familyId: 'ron-8-anos', label: '8 años' },
      { familyId: 'ron-12-anos', label: '12 años' },
      { familyId: 'ron-19-anos', label: '19 años' },
    ],
  },
] as const;

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [RouterLink, IonButton, IonIcon],
})
export class DashboardComponent {
  protected readonly journeyData = inject(JourneyDataService);
  private readonly quotaState = inject(QuotaStateService);
  private readonly salesState = inject(SalesStateService);
  private readonly refreshRevision = signal(0);
  readonly summary = computed(() => {
    this.refreshRevision();
    const quotas = this.quotaState.totals();
    const sales = this.salesState.totals();
    const totalQuota = quotas['total'];
    const percentage = totalQuota > 0 ? Math.round((sales.total / totalQuota) * 100) : 0;
    const tone: PerformanceTone = totalQuota === 0 ? 'empty' : percentage < 90 ? 'low' : 'good';

    return {
      totalQuota,
      totalSold: sales.total,
      percentage,
      progress: Math.max(0, Math.min(percentage, 100)),
      tone,
      sections: [
        {
          title: 'Cuota Total',
          quota: totalQuota,
          sold: sales.total,
          pending: totalQuota - sales.total,
        },
        {
          title: 'Aguardiente',
          quota: quotas['aguardiente'],
          sold: sales.aguardiente,
          pending: quotas['aguardiente'] - sales.aguardiente,
        },
        {
          title: 'Rones',
          quota: quotas['ron-combined'],
          sold: sales.ron,
          pending: quotas['ron-combined'] - sales.ron,
        },
      ],
    };
  });
  readonly updatedAt = computed(() => {
    this.summary();
    return new Date();
  });
  readonly commercialGroups = computed(() => {
    this.refreshRevision();
    const quotas = this.quotaState.totals();
    const sales = this.salesState.totals();
    const productTotals = this.salesState.productTotals();

    return commercialGroupDefinitions.map((group) => {
      const quota = quotas[group.quotaKey];
      const sold =
        group.id === 'aguardiente'
          ? sales.aguardiente
          : group.id === 'ron-young'
            ? sales.ronYoung
            : sales.ronSpecialized;
      const rawPercentage = quota > 0 ? (sold / quota) * 100 : 0;
      const percentage = Math.round(rawPercentage);
      const tone: CommercialTone = rawPercentage > 80 ? 'good' : rawPercentage >= 70 ? 'warning' : 'danger';

      return {
        ...group,
        quota,
        sold,
        percentage,
        progress: Math.max(0, Math.min(rawPercentage, 100)),
        tone,
        variants: group.variants.map((variant) => {
          const family = salesFamilies.find((item) => item.id === variant.familyId);
          const variantSold =
            family?.products.reduce((sum, product) => sum + productTotals[product.id].equivalentBottles, 0) ?? 0;

          return { ...variant, sold: variantSold };
        }),
      };
    });
  });

  constructor() {
    addIcons({
      calendarOutline,
      documentTextOutline,
      pricetagOutline,
      refreshOutline,
      receiptOutline,
      trendingDownOutline,
      trendingUpOutline,
    });
  }

  protected greeting(): string {
    const fullName = this.journeyData.values().advisorName.trim();
    const firstName = fullName.split(/\s+/)[0];
    return firstName ? `¡Hola, ${firstName}! 👋` : '¡Hola! 👋';
  }

  protected formatNumber(value: number): string {
    return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(Math.abs(value));
  }

  protected pendingText(value: number): string {
    if (value < 0) {
      return `Excedente +${this.formatNumber(value)}`;
    }
    return this.formatNumber(value);
  }

  protected performanceLabel(): string {
    const { tone, percentage } = this.summary();
    if (tone === 'empty') {
      return 'Ingresa una cuota para ver el rendimiento';
    }
    return percentage >= 100 ? 'Meta superada' : tone === 'low' ? 'Por debajo del 90 %' : 'En ruta a la meta';
  }

  protected formattedUpdateTime(): string {
    return new Intl.DateTimeFormat('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(this.updatedAt());
  }

  protected refreshMetrics(): void {
    this.refreshRevision.update((revision) => revision + 1);
  }
}
