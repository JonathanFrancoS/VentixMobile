import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { routes } from './app.routes';

describe('app routes', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('redirects the root and legacy Inbox URLs to Inicio', async () => {
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/');
    expect(router.url).toBe('/folder/Inicio');

    await router.navigateByUrl('/folder/Inbox');
    expect(router.url).toBe('/folder/Inicio');
  });
});
