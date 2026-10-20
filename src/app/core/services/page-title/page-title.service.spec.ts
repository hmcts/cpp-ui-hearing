import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { PageTitleService } from './page-title.service';

describe('PageTitleService', () => {
  let service: PageTitleService;
  let title: jest.Mocked<Title>;

  beforeEach(() => {
    title = { setTitle: jest.fn(), getTitle: jest.fn() } as any;

    TestBed.configureTestingModule({
      providers: [{ provide: Title, useValue: title }],
      teardown: { destroyAfterEach: false }
    });

    service = TestBed.inject(PageTitleService);
  });

  it('should write the page title with the Common Platform | GOV.UK suffix', () => {
    service.setPageTitle('Manage hearing');

    expect(title.setTitle).toHaveBeenLastCalledWith('Manage hearing | Common Platform | GOV.UK');
  });

  it('should prefix the page title with the lead defendant once names are set', () => {
    service.setPageTitle('Manage hearing | Common Platform | GOV.UK');
    service.setDefendantNames([
      { firstName: 'John', lastName: 'Smith' },
      { firstName: 'Jane', lastName: 'Doe' }
    ]);

    expect(title.setTitle).toHaveBeenLastCalledWith(
      'Smith J - Manage hearing | Common Platform | GOV.UK'
    );
  });

  it('should keep the defendant prefix when the page title changes', () => {
    service.setDefendantNames([{ firstName: 'John', lastName: 'Smith' }]);
    service.setPageTitle('Enter results');

    expect(title.setTitle).toHaveBeenLastCalledWith(
      'Smith J - Enter results | Common Platform | GOV.UK'
    );
  });

  it('should drop the prefix when the defendant names are cleared', () => {
    service.setPageTitle('Manage hearing');
    service.setDefendantNames([{ firstName: 'John', lastName: 'Smith' }]);
    service.clearDefendantNames();

    expect(title.setTitle).toHaveBeenLastCalledWith('Manage hearing | Common Platform | GOV.UK');
  });

  it('should treat null names as no names', () => {
    service.setPageTitle('Manage hearing');
    service.setDefendantNames(null);

    expect(title.setTitle).toHaveBeenLastCalledWith('Manage hearing | Common Platform | GOV.UK');
  });
});
