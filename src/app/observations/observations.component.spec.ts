import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { ObservationsComponent } from './observations.component';
import { ObservationsService } from './observations.service';

describe('ObservationsComponent', () => {
  let fixture: ComponentFixture<ObservationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ObservationsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ObservationsComponent);
    fixture.detectChanges();
  });

  it('creates, edits, and deletes an observation', () => {
    const app = fixture.nativeElement as HTMLElement;
    const newText = app.querySelector('.new-observation textarea') as HTMLTextAreaElement;
    newText.value = 'Se reportó una novedad en el punto de venta.';
    newText.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    (app.querySelector('.primary-action') as HTMLButtonElement).click();
    fixture.detectChanges();
    const card = app.querySelector('.observation-card') as HTMLElement;
    expect(card.querySelector('.observation-text')?.textContent?.trim()).toBe(
      'Se reportó una novedad en el punto de venta.',
    );

    (card.querySelector('.observation-header .edit-action') as HTMLButtonElement).click();
    fixture.detectChanges();
    const editText = card.querySelector('textarea') as HTMLTextAreaElement;
    editText.value = 'Se actualizó el reporte.';
    editText.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    (card.querySelector('.observation-header .edit-action') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(card.querySelector('.observation-text')?.textContent?.trim()).toBe('Se actualizó el reporte.');

    (card.querySelector('.observation-header .delete-action') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(app.querySelector('.observation-card')).toBeNull();
  });

  it('shows photo evidence with edit and delete controls', () => {
    const service = TestBed.inject(ObservationsService);
    service.addObservation('Revisión del estante');
    const observation = service.observations()[0];
    service.addPhoto(observation.id, 'evidencia.png', 'data:image/png;base64,ZmFrZQ==');
    fixture.detectChanges();

    const app = fixture.nativeElement as HTMLElement;
    const photo = app.querySelector('.photo-card') as HTMLElement;
    expect(photo.querySelector('img')?.getAttribute('src')).toBe('data:image/png;base64,ZmFrZQ==');
    expect(photo.querySelector('.edit-action')).not.toBeNull();
    expect(photo.querySelector('.delete-action')).not.toBeNull();
    expect(app.querySelector('[capture="environment"]')).not.toBeNull();

    (photo.querySelector('.delete-action') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(app.querySelector('.photo-card')).toBeNull();
  });
});
