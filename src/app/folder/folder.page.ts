import { Component, input } from '@angular/core';
import { IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, IonContent } from '@ionic/angular';
import { SalesCatalogComponent } from '../sales/sales-catalog.component';
import { QuotaFormComponent } from '../quotas/quota-form.component';
import { JourneyDataFormComponent } from '../journey-data/journey-data-form.component';
import { ObservationsComponent } from '../observations/observations.component';
import { DashboardComponent } from '../dashboard/dashboard.component';

@Component({
  selector: 'app-folder',
  templateUrl: './folder.page.html',
  styleUrls: ['./folder.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    IonTitle,
    IonContent,
    SalesCatalogComponent,
    QuotaFormComponent,
    JourneyDataFormComponent,
    ObservationsComponent,
    DashboardComponent,
  ],
})
export class FolderPage {
  readonly folder = input.required<string>();
}
