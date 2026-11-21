import { Component, computed, inject, signal } from '@angular/core';
import { IonButton, IonCard } from '@ionic/angular';
import { salesSlides } from './sales-catalog.data';
import { SalesStateService } from './sales-state.service';

@Component({
  selector: 'app-sales-catalog',
  templateUrl: './sales-catalog.component.html',
  styleUrls: ['./sales-catalog.component.scss'],
  imports: [IonButton, IonCard],
})
export class SalesCatalogComponent {
  readonly slides = salesSlides;

  readonly activeSlideIndex = signal(0);
  readonly navigationDirection = signal<-1 | 1>(1);
  readonly currentSlide = computed(() => this.slides[this.activeSlideIndex()]);
  private readonly salesState = inject(SalesStateService);

  private touchStart: { x: number; y: number } | null = null;

  protected quantity(productId: string): number {
    return this.salesState.quantities()[productId] ?? 0;
  }

  protected adjustQuantity(productId: string, change: -1 | 1): void {
    this.salesState.adjustQuantity(productId, change);
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
}
