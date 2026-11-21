import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { QuotaFormComponent } from './quota-form.component';

describe('QuotaFormComponent', () => {
  let fixture: ComponentFixture<QuotaFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuotaFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(QuotaFormComponent);
    fixture.detectChanges();
  });

  it('groups products into Aguardiente and Ron and shows volumes without repeated names', () => {
    const app = fixture.nativeElement as HTMLElement;

    expect(
      Array.from(app.querySelectorAll('.quota-section > h1')).map((heading) => heading.textContent?.trim()),
    ).toEqual(['Aguardientes', 'Rones']);
    expect(app.querySelectorAll('.quota-family').length).toBe(10);
    expect(app.querySelectorAll('.quota-row').length).toBe(33);
    expect(app.querySelectorAll('.section-total input').length).toBe(2);
    expect(app.querySelector('.quota-row label')?.textContent?.trim()).toBe('1750 ml');
    expect(app.querySelector('.quota-row input')?.getAttribute('placeholder')).toBe('0');
    expect((app.querySelector('.quota-row input') as HTMLInputElement).value).toBe('');
  });

  it('automatically recalculates totals and preserves a manually edited family total', () => {
    const app = fixture.nativeElement as HTMLElement;
    const family = app.querySelector('.quota-family') as HTMLElement;
    const productRow = family.querySelector('.quota-row') as HTMLElement;
    const productInput = productRow.querySelector('input') as HTMLInputElement;
    const familyTotal = family.querySelector('.family-total input') as HTMLInputElement;
    const sectionTotal = app.querySelector('.quota-section .section-total input') as HTMLInputElement;

    (productRow.querySelector('.edit-action') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(productInput.disabled).toBe(false);

    productInput.value = '12';
    productInput.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(familyTotal.value).toBe('12');
    expect(sectionTotal.value).toBe('12');

    const editFamilyTotal = family.querySelector('.family-total .edit-action') as HTMLButtonElement;
    editFamilyTotal.click();
    fixture.detectChanges();
    familyTotal.value = '60';
    familyTotal.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(familyTotal.value).toBe('60');
    expect(sectionTotal.value).toBe('60');

    productInput.value = '8';
    productInput.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(familyTotal.value).toBe('60');
    expect(sectionTotal.value).toBe('60');

    (family.querySelector('.family-total .delete-action') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(familyTotal.value).toBe('8');
    expect(sectionTotal.value).toBe('8');
  });

  it('preserves a manually edited section total when product quotas change', () => {
    const app = fixture.nativeElement as HTMLElement;
    const section = app.querySelector('.quota-section') as HTMLElement;
    const sectionTotal = section.querySelector('.section-total input') as HTMLInputElement;
    const firstProductRow = section.querySelector('.quota-row') as HTMLElement;
    const productInput = firstProductRow.querySelector('input') as HTMLInputElement;

    (section.querySelector('.section-total .edit-action') as HTMLButtonElement).click();
    fixture.detectChanges();
    sectionTotal.value = '100';
    sectionTotal.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    (firstProductRow.querySelector('.edit-action') as HTMLButtonElement).click();
    fixture.detectChanges();
    productInput.value = '5';
    productInput.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(sectionTotal.value).toBe('100');
  });

  it('updates the combined Ron total with values from regular and specialized rum families', () => {
    const app = fixture.nativeElement as HTMLElement;
    const ronSection = app.querySelectorAll('.quota-section')[1] as HTMLElement;
    const ronTotal = ronSection.querySelector('.section-total input') as HTMLInputElement;
    const productRows = ronSection.querySelectorAll('.quota-row');

    for (const index of [0, 8]) {
      const row = productRows[index] as HTMLElement;
      (row.querySelector('.edit-action') as HTMLButtonElement).click();
      fixture.detectChanges();
      const input = row.querySelector('input') as HTMLInputElement;
      input.value = index === 0 ? '3' : '5';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      fixture.detectChanges();
    }

    expect(ronTotal.value).toBe('8');
  });
});
