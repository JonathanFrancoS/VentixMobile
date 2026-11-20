import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { FolderPage } from './folder.page';

describe('FolderPage', () => {
  let component: FolderPage;
  let fixture: ComponentFixture<FolderPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FolderPage],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(FolderPage);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('folder', 'Inbox');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the sales catalog on the sales registration page', () => {
    fixture.componentRef.setInput('folder', 'Registro de ventas');
    fixture.detectChanges();

    const app = fixture.nativeElement as HTMLElement;
    expect(app.querySelector('app-sales-catalog')).not.toBeNull();
  });
});
