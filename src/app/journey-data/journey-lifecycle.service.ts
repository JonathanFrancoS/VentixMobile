import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

import { ObservationsService } from '../observations/observations.service';
import { QuotaStateService } from '../quotas/quota-state.service';
import { SalesStateService } from '../sales/sales-state.service';

import { JourneyDataService } from './journey-data.service';

@Injectable({ providedIn: 'root' })
export class JourneyLifecycleService {
  private readonly journeyData = inject(JourneyDataService);
  private readonly quotaState = inject(QuotaStateService);
  private readonly salesState = inject(SalesStateService);
  private readonly observationsService = inject(ObservationsService);
  private readonly router = inject(Router);

  async closeJourney(options: { navigateToHome?: boolean } = {}): Promise<void> {
    await Promise.all([this.journeyData.initialize(), this.quotaState.initialize()]);
    await this.quotaState.reset();
    await this.journeyData.createNewJourney();
    this.salesState.reset();
    this.observationsService.reset();

    if (options.navigateToHome !== false && this.router.url !== '/folder/Inicio') {
      const navigated = await this.router.navigateByUrl('/folder/Inicio');
      if (!navigated && this.router.url !== '/folder/Inicio') {
        throw new Error('No se pudo volver a Inicio después de cerrar la jornada.');
      }
    }
  }
}
