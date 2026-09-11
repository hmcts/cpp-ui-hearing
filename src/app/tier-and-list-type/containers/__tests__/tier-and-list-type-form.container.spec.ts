import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { PdkErrorSummaryComponent, ValidationError } from '@cpp/pdk';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { getCurrentHearingUrn } from '../../../core';
import { TierAndListTypeFormComponent } from '../../components/tier-and-list-type-form/tier-and-list-type-form.component';
import { PtphDetail, SavePtphDetailPayload } from '../../models/ptph-detail.model';
import { PtphDetailService } from '../../services/ptph-detail.service';
import { TierAndListTypeStore } from '../../store/tier-and-list-type.store';
import { TierAndListTypeFormContainer } from '../tier-and-list-type-form.container';

const HEARING_ID = 'hearing-1';
const REVIEW_ROUTE = ['/manage', HEARING_ID, 'tier-and-list-type'];
const FORM_ROUTE = ['/manage', HEARING_ID, 'tier-and-list-type', 'edit'];

const blankRecord: PtphDetail = { finalised: false };
const savedRecord: PtphDetail = { tier: 'TIER_1', listType: 'TYPE_1_FIXED', finalised: false };

const validationErrors: ValidationError[] = [{ id: 'tier-error', message: 'Select a tier' }];

@Component({
  selector: 'tier-and-list-type-form',
  template: '<div>mock form</div>',
  changeDetection: ChangeDetectionStrategy.OnPush
})
class MockTierAndListTypeFormComponent {
  readonly ptphDetail = input<PtphDetail | null>(null);
  readonly hearingId = input.required<string>();
  readonly cancelRoute = input.required<string[]>();

  readonly save = output<SavePtphDetailPayload>();
  readonly errors = output<ValidationError[] | null>();
  readonly cancel = output<void>();
}

describe('TierAndListTypeFormContainer', () => {
  let fixture: ComponentFixture<TierAndListTypeFormContainer>;
  let component: TierAndListTypeFormContainer;
  let store: InstanceType<typeof TierAndListTypeStore>;
  let mockStore: MockStore;
  let getPtphDetail: jest.Mock;
  let savePtphDetail: jest.Mock;

  const childElement = () =>
    fixture.debugElement.query(By.directive(MockTierAndListTypeFormComponent));
  const child = () => childElement().componentInstance as MockTierAndListTypeFormComponent;
  const errorSummary = () => fixture.debugElement.query(By.directive(PdkErrorSummaryComponent));

  const loadDetail = (detail: PtphDetail) => {
    getPtphDetail.mockReturnValue(of(detail));
    store.load(HEARING_ID);
    fixture.detectChanges();
  };

  beforeEach(() => {
    getPtphDetail = jest.fn().mockReturnValue(of(blankRecord));
    savePtphDetail = jest.fn().mockReturnValue(of({}));

    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(),
        provideMockStore({ initialState: {} }),
        TierAndListTypeStore,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {},
              parent: { params: { hearingId: HEARING_ID }, parent: null }
            }
          }
        },
        {
          provide: PtphDetailService,
          useValue: {
            getPtphDetail,
            savePtphDetail,
            finalisePtphDetail: jest.fn().mockReturnValue(of({})),
            deletePtphDetail: jest.fn().mockReturnValue(of({}))
          }
        }
      ],
      teardown: { destroyAfterEach: false }
    });

    TestBed.overrideComponent(TierAndListTypeFormContainer, {
      remove: { imports: [TierAndListTypeFormComponent] },
      add: { imports: [MockTierAndListTypeFormComponent] }
    });

    mockStore = TestBed.inject(MockStore);
    mockStore.overrideSelector(getCurrentHearingUrn, 'URN-1');
    mockStore.refreshState();

    store = TestBed.inject(TierAndListTypeStore);

    fixture = TestBed.createComponent(TierAndListTypeFormContainer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    mockStore.resetSelectors();
  });

  describe('rendering', () => {
    it('should render the entry page', () => {
      expect(fixture).toMatchSnapshot();
    });

    it('should render the entry heading', () => {
      expect(fixture.debugElement.query(By.css('h1')).nativeElement.textContent).toContain(
        'TIER_AND_LIST_TYPE.ENTRY_HEADING'
      );
    });

    it('should render the case urn from the current hearing selector', () => {
      expect(fixture.debugElement.query(By.css('strong')).nativeElement.textContent).toContain(
        'URN-1'
      );
      expect(component.caseUrn()).toBe('URN-1');
    });

    it('should hide the case urn when the selector has no urn', () => {
      mockStore.overrideSelector(getCurrentHearingUrn, undefined);
      mockStore.refreshState();
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('strong'))).toBeNull();
    });

    it('should not render an error summary until errors are reported', () => {
      expect(errorSummary()).toBeNull();
    });
  });

  describe('hearingId', () => {
    it('should be taken from the flattened route params', () => {
      expect(component.hearingId).toBe(HEARING_ID);
      expect(child().hearingId()).toBe(HEARING_ID);
    });
  });

  describe('ptphDetail', () => {
    it('should pass the stored detail down to the form', () => {
      loadDetail(savedRecord);

      expect(child().ptphDetail()).toEqual(savedRecord);
    });

    it('should pass null down before anything is loaded', () => {
      expect(child().ptphDetail()).toBeNull();
    });
  });

  describe('cancelRoute', () => {
    it('should be the form route before anything is loaded', () => {
      expect(component.cancelRoute()).toEqual(FORM_ROUTE);
      expect(child().cancelRoute()).toEqual(FORM_ROUTE);
    });

    it('should be the form route when the loaded record has no tier', () => {
      loadDetail(blankRecord);

      expect(component.cancelRoute()).toEqual(FORM_ROUTE);
      expect(child().cancelRoute()).toEqual(FORM_ROUTE);
    });

    it('should be the review route when a tier is already saved', () => {
      loadDetail(savedRecord);

      expect(component.cancelRoute()).toEqual(REVIEW_ROUTE);
      expect(child().cancelRoute()).toEqual(REVIEW_ROUTE);
    });
  });

  describe('onSave', () => {
    it('should delegate the payload to the store', () => {
      const saveSpy = jest.spyOn(store, 'save');
      const payload: SavePtphDetailPayload = { hearingId: HEARING_ID, tier: 'TIER_1' };

      child().save.emit(payload);

      expect(saveSpy).toHaveBeenCalledWith(payload);
    });

    it('should send the save command through the service', () => {
      const payload: SavePtphDetailPayload = { hearingId: HEARING_ID, tier: 'TIER_2' };

      child().save.emit(payload);

      expect(savePtphDetail).toHaveBeenCalledWith(payload);
    });
  });

  describe('onErrors', () => {
    it('should store the errors and dismiss any alert', () => {
      const dismissSpy = jest.spyOn(store, 'dismissAlert');

      child().errors.emit(validationErrors);
      fixture.detectChanges();

      expect(component.formErrors()).toEqual(validationErrors);
      expect(dismissSpy).toHaveBeenCalled();
    });

    it('should render an error summary once errors are reported', () => {
      child().errors.emit(validationErrors);
      fixture.detectChanges();

      expect(errorSummary()).not.toBeNull();
      expect(errorSummary().componentInstance.errors).toEqual(validationErrors);
    });

    it('should clear the error summary when the errors are reset to null', () => {
      child().errors.emit(validationErrors);
      fixture.detectChanges();

      child().errors.emit(null);
      fixture.detectChanges();

      expect(component.formErrors()).toBeNull();
      expect(errorSummary()).toBeNull();
    });

    it('should not render an error summary for an empty error list', () => {
      child().errors.emit([]);
      fixture.detectChanges();

      expect(errorSummary()).toBeNull();
    });
  });

  describe('onCancel', () => {
    it('should dismiss any alert', () => {
      const dismissSpy = jest.spyOn(store, 'dismissAlert');

      child().cancel.emit();

      expect(dismissSpy).toHaveBeenCalled();
    });

    it('should not report any form errors', () => {
      child().cancel.emit();

      expect(component.formErrors()).toBeNull();
    });
  });
});
