import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
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
  ],
})
export class AppComponent {
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
  }
}
