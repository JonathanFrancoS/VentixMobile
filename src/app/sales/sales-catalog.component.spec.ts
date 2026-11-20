import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { SalesCatalogComponent } from './sales-catalog.component';

describe('SalesCatalogComponent', () => {
  let fixture: ComponentFixture<SalesCatalogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesCatalogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SalesCatalogComponent);
    fixture.detectChanges();
  });

  it('shows every family on its own page with the requested presentations', () => {
    const app = fixture.nativeElement as HTMLElement;
    const next = app.querySelectorAll<HTMLElement>('.category-arrow')[1];
    const pages = [
      {
        category: 'Aguardiente',
        family: 'Antioqueño 24° Sin Azúcar (Verde)',
        volumes: ['1750 ml', '1000 ml', '1050 ml', '750 ml', '375 ml', '260 ml'],
      },
      {
        category: 'Aguardiente',
        family: 'Antioqueño Sin Azúcar (Azul)',
        volumes: ['2000 ml', '1000 ml', '1050 ml', '750 ml', '375 ml', '260 ml'],
      },
      {
        category: 'Aguardiente',
        family: 'Antioqueño Tradicional (Rojo)',
        volumes: ['2000 ml', '1000 ml', '1050 ml', '750 ml', '375 ml', '260 ml'],
      },
      {
        category: 'Aguardiente',
        family: 'Antioqueño Real Sin Azúcar (Premium)',
        volumes: ['750 ml'],
      },
      {
        category: 'Ron',
        family: 'Ron Medellín Dorado',
        volumes: ['750 ml', '375 ml'],
      },
      {
        category: 'Ron',
        family: 'Ron joven',
        volumes: ['2000 ml', '1000 ml', '1050 ml', '750 ml', '375 ml', '260 ml'],
      },
      {
        category: 'Ron especializado',
        family: 'Ron Medellín',
        volumes: ['750 ml', '375 ml', '750 ml', '375 ml', '750 ml', '750 ml'],
      },
    ];

    for (const [index, page] of pages.entries()) {
      expect(app.querySelector('.slide-heading p')?.textContent?.trim()).toBe(page.category);
      expect(app.querySelector('.slide-heading h1')?.textContent?.trim()).toBe(page.family);
      expect(Array.from(app.querySelectorAll('.product-volume')).map((element) => element.textContent?.trim())).toEqual(
        page.volumes,
      );

      if (index < pages.length - 1) {
        next.click();
        fixture.detectChanges();
      }
    }

    expect(fixture.componentInstance.activeSlideIndex()).toBe(pages.length - 1);
    expect(Array.from(app.querySelectorAll('.product-name')).map((element) => element.textContent?.trim())).toEqual([
      'Ron Medellín 5 años Extra Añejo',
      'Ron Medellín 5 años Extra Añejo',
      'Ron Medellín 8 años Extra Añejo Reserva Especial',
      'Ron Medellín 8 años Extra Añejo Reserva Especial',
      'Ron Medellín 12 años Gran Reserva',
      'Ron Medellín 19 años Gran Solera',
    ]);
    next.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.activeSlideIndex()).toBe(pages.length - 1);
  });

  it('moves between family pages with a horizontal swipe in either direction', () => {
    const app = fixture.nativeElement as HTMLElement;
    const salesPage = app.querySelector('.sales-page') as HTMLElement;
    const dispatchTouch = (type: 'touchstart' | 'touchend', clientX: number, clientY: number) => {
      const event = new Event(type, { bubbles: true });
      Object.defineProperty(event, 'changedTouches', {
        value: { item: () => ({ clientX, clientY }) },
      });
      salesPage.dispatchEvent(event);
    };

    dispatchTouch('touchstart', 240, 100);
    dispatchTouch('touchend', 150, 104);
    fixture.detectChanges();
    expect(app.querySelector('.slide-heading h1')?.textContent?.trim()).toBe('Antioqueño Sin Azúcar (Azul)');

    dispatchTouch('touchstart', 150, 104);
    dispatchTouch('touchend', 240, 100);
    fixture.detectChanges();
    expect(app.querySelector('.slide-heading h1')?.textContent?.trim()).toBe('Antioqueño 24° Sin Azúcar (Verde)');
  });

  it('adds from the image and quantity controls without allowing a negative quantity', () => {
    const app = fixture.nativeElement as HTMLElement;
    const firstCard = app.querySelector('.product-card') as HTMLElement;
    const imageButton = firstCard.querySelector('.product-image') as HTMLButtonElement;
    const [decreaseButton, increaseButton] = Array.from(firstCard.querySelectorAll<HTMLElement>('.quantity-button'));
    const quantity = firstCard.querySelector('.quantity-value');

    expect(quantity?.textContent?.trim()).toBe('0');
    expect(decreaseButton.hasAttribute('disabled')).toBe(true);

    imageButton.click();
    fixture.detectChanges();
    expect(quantity?.textContent?.trim()).toBe('1');

    increaseButton.click();
    fixture.detectChanges();
    expect(quantity?.textContent?.trim()).toBe('2');
    decreaseButton.click();
    fixture.detectChanges();
    expect(quantity?.textContent?.trim()).toBe('1');
    decreaseButton.click();
    fixture.detectChanges();
    expect(quantity?.textContent?.trim()).toBe('0');
    expect(decreaseButton.hasAttribute('disabled')).toBe(true);
  });
});
