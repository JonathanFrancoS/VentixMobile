import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { JourneyDataFormComponent } from './journey-data-form.component';

describe('JourneyDataFormComponent', () => {
  let fixture: ComponentFixture<JourneyDataFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JourneyDataFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(JourneyDataFormComponent);
    fixture.detectChanges();
  });

  it('shows the system date and time together without inputs or actions', () => {
    const app = fixture.nativeElement as HTMLElement;
    const inputs = app.querySelectorAll('.journey-field input');
    const dateTimeField = app.querySelector('.system-field') as HTMLElement;
    const dateTime = dateTimeField.querySelector('.journey-date-time');

    expect(inputs.length).toBe(5);
    expect(dateTime?.textContent?.trim()).toMatch(/^\d{2}\/\d{2}\/\d{4} - \d{2}:\d{2} Hrs$/);
    expect(dateTimeField.querySelectorAll('input, .edit-action, .delete-action').length).toBe(0);
    expect(dateTimeField.querySelector('.format-toggle')).not.toBeNull();
  });

  it('toggles between long 12-hour and military 24-hour formats with one icon button', () => {
    const app = fixture.nativeElement as HTMLElement;
    const dateTimeField = app.querySelector('.system-field') as HTMLElement;
    const dateTime = dateTimeField.querySelector('.journey-date-time') as HTMLElement;
    const formatToggle = dateTimeField.querySelector('.format-toggle') as HTMLButtonElement;
    const militaryFormat = dateTime.textContent?.trim();

    formatToggle.click();
    fixture.detectChanges();

    expect(dateTime.textContent?.trim()).toMatch(
      /^\d{1,2} de [a-z]+ del \d{4} - hora \d{1,2}:\d{2} [ap]\.m$/,
    );
    expect(formatToggle.getAttribute('aria-label')).toContain('militar de 24 horas');

    formatToggle.click();
    fixture.detectChanges();
    expect(dateTime.textContent?.trim()).toBe(militaryFormat);
  });

  it('edits and clears individual journey fields', () => {
    const app = fixture.nativeElement as HTMLElement;
    const field = app.querySelector('.journey-field') as HTMLElement;
    const input = field.querySelector('input') as HTMLInputElement;

    expect(input.disabled).toBe(true);
    (field.querySelector('.edit-action') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(input.disabled).toBe(false);

    input.value = 'María Pérez';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(input.value).toBe('María Pérez');

    (field.querySelector('.delete-action') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(input.value).toBe('');
    expect(input.disabled).toBe(true);
  });
});
