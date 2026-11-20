import { Component, computed, signal } from '@angular/core';
import { IonButton, IonCard } from '@ionic/angular';

type SalesProduct = {
  id: string;
  name: string;
  volume: string;
};

type SalesSlide = {
  id: string;
  category: string;
  family: string;
  products: SalesProduct[];
};

const standardVolumes = ['2000 ml', '1000 ml', '1050 ml', '750 ml', '375 ml', '260 ml'];
const productImage = 'assets/products/spirits-bottle.svg';

function createSlide(id: string, category: string, family: string, productName: string, volumes: string[]): SalesSlide {
  return {
    id,
    category,
    family,
    products: volumes.map((volume, index) => ({
      id: `${id}-${index}`,
      name: productName,
      volume,
    })),
  };
}

@Component({
  selector: 'app-sales-catalog',
  templateUrl: './sales-catalog.component.html',
  styleUrls: ['./sales-catalog.component.scss'],
  imports: [IonButton, IonCard],
})
export class SalesCatalogComponent {
  readonly slides: SalesSlide[] = [
    createSlide(
      'antioqueno-verde',
      'Aguardiente',
      'Antioqueño 24° Sin Azúcar (Verde)',
      'Antioqueño 24° Sin Azúcar (Verde)',
      ['1750 ml', '1000 ml', '1050 ml', '750 ml', '375 ml', '260 ml'],
    ),
    createSlide(
      'antioqueno-azul',
      'Aguardiente',
      'Antioqueño Sin Azúcar (Azul)',
      'Antioqueño Sin Azúcar (Azul)',
      standardVolumes,
    ),
    createSlide(
      'antioqueno-rojo',
      'Aguardiente',
      'Antioqueño Tradicional (Rojo)',
      'Antioqueño Tradicional (Rojo) joven',
      standardVolumes,
    ),
    createSlide(
      'antioqueno-real',
      'Aguardiente',
      'Antioqueño Real Sin Azúcar (Premium)',
      'Antioqueño Real Sin Azúcar (Premium)',
      ['750 ml'],
    ),
    createSlide('ron-dorado', 'Ron', 'Ron Medellín Dorado', 'Ron Medellín Dorado', ['750 ml', '375 ml']),
    createSlide('ron-joven', 'Ron', 'Ron joven', 'Ron Medellín Añejo 3 años', standardVolumes),
    {
      id: 'ron-especializado',
      category: 'Ron especializado',
      family: 'Ron Medellín',
      products: [
        {
          id: 'ron-5-anos-750',
          name: 'Ron Medellín 5 años Extra Añejo',
          volume: '750 ml',
        },
        {
          id: 'ron-5-anos-375',
          name: 'Ron Medellín 5 años Extra Añejo',
          volume: '375 ml',
        },
        {
          id: 'ron-8-anos-750',
          name: 'Ron Medellín 8 años Extra Añejo Reserva Especial',
          volume: '750 ml',
        },
        {
          id: 'ron-8-anos-375',
          name: 'Ron Medellín 8 años Extra Añejo Reserva Especial',
          volume: '375 ml',
        },
        {
          id: 'ron-12-anos-750',
          name: 'Ron Medellín 12 años Gran Reserva',
          volume: '750 ml',
        },
        {
          id: 'ron-19-anos-750',
          name: 'Ron Medellín 19 años Gran Solera',
          volume: '750 ml',
        },
      ],
    },
  ];

  readonly activeSlideIndex = signal(0);
  readonly navigationDirection = signal<-1 | 1>(1);
  readonly currentSlide = computed(() => this.slides[this.activeSlideIndex()]);
  readonly quantities = signal<Record<string, number>>({});

  private touchStart: { x: number; y: number } | null = null;

  protected quantity(productId: string): number {
    return this.quantities()[productId] ?? 0;
  }

  protected adjustQuantity(productId: string, change: -1 | 1): void {
    this.quantities.update((quantities) => ({
      ...quantities,
      [productId]: Math.max(0, (quantities[productId] ?? 0) + change),
    }));
  }

  protected moveSlide(direction: -1 | 1): void {
    const nextIndex = this.activeSlideIndex() + direction;
    if (nextIndex < 0 || nextIndex >= this.slides.length) {
      return;
    }

    this.navigationDirection.set(direction);
    this.activeSlideIndex.set(nextIndex);
  }

  protected onCarouselTouchStart(event: TouchEvent): void {
    const touch = event.changedTouches.item(0);
    if (touch) {
      this.touchStart = { x: touch.clientX, y: touch.clientY };
    }
  }

  protected onCarouselTouchEnd(event: TouchEvent): void {
    const touch = event.changedTouches.item(0);
    const start = this.touchStart;
    this.touchStart = null;

    if (!touch || !start) {
      return;
    }

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) <= Math.abs(deltaY)) {
      return;
    }

    this.moveSlide(deltaX < 0 ? 1 : -1);
  }

  protected onCarouselTouchCancel(): void {
    this.touchStart = null;
  }

  protected readonly productImage = productImage;
}
