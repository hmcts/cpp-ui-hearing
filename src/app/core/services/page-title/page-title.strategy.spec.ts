import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, TitleStrategy, withRouterConfig } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { PageTitleService } from './page-title.service';
import { PageTitleStrategy } from './page-title.strategy';

@Component({ template: '' })
class DummyComponent {}

describe('PageTitleStrategy', () => {
  let title: jest.Mocked<Title>;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    title = { setTitle: jest.fn(), getTitle: jest.fn() } as any;

    TestBed.configureTestingModule({
      providers: [
        { provide: Title, useValue: title },
        { provide: TitleStrategy, useClass: PageTitleStrategy },
        provideRouter(
          [
            {
              path: 'static',
              component: DummyComponent,
              data: { title: 'My hearing list | Common Platform | GOV.UK' }
            },
            {
              path: 'resolved',
              component: DummyComponent,
              title: () => 'Resolved page'
            },
            {
              path: 'manage/:hearingId',
              component: DummyComponent,
              data: { title: 'Manage hearing | Common Platform | GOV.UK' },
              children: [
                { path: '', component: DummyComponent },
                {
                  path: 'enter-pleas',
                  component: DummyComponent,
                  data: { title: 'Enter pleas | Common Platform | GOV.UK' }
                },
                { path: 'enter-results', component: DummyComponent }
              ]
            },
            { path: 'untitled', component: DummyComponent }
          ],
          withRouterConfig({ paramsInheritanceStrategy: 'always' })
        )
      ],
      teardown: { destroyAfterEach: false }
    });

    harness = await RouterTestingHarness.create();
  });

  it('should use data.title of the deepest activated route', async () => {
    await harness.navigateByUrl('/manage/123/enter-pleas');

    expect(title.setTitle).toHaveBeenLastCalledWith('Enter pleas | Common Platform | GOV.UK');
  });

  it('should inherit data.title from the parent route', async () => {
    await harness.navigateByUrl('/manage/123/enter-results');

    expect(title.setTitle).toHaveBeenLastCalledWith('Manage hearing | Common Platform | GOV.UK');
  });

  it('should prefer a resolved route title and append the suffix once', async () => {
    await harness.navigateByUrl('/resolved');

    expect(title.setTitle).toHaveBeenLastCalledWith('Resolved page | Common Platform | GOV.UK');
  });

  it('should fall back to the bare suffix when no route declares a title', async () => {
    await harness.navigateByUrl('/untitled');

    expect(title.setTitle).toHaveBeenLastCalledWith('Common Platform | GOV.UK');
  });

  it('should compose with the hearing header names on later navigations', async () => {
    TestBed.inject(PageTitleService).setDefendantNames([{ firstName: 'John', lastName: 'Smith' }]);

    await harness.navigateByUrl('/static');

    expect(title.setTitle).toHaveBeenLastCalledWith(
      'Smith J - My hearing list | Common Platform | GOV.UK'
    );
  });
});
