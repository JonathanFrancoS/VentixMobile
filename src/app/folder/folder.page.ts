import { Component, input } from '@angular/core';
import { IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, IonContent } from '@ionic/angular';
import { SalesCatalogComponent } from '../sales/sales-catalog.component';

@Component({
  selector: 'app-folder',
  templateUrl: './folder.page.html',
  styleUrls: ['./folder.page.scss'],
  imports: [IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle, IonContent, SalesCatalogComponent],
})
export class FolderPage {
  readonly folder = input.required<string>();
}
