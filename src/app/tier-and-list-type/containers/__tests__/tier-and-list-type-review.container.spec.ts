import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { getCurrentHearingUrn } from '../../../core';
import { TierAndListTypeReviewComponent } from '../../components/tier-and-list-type-review/tier-and-list-type-review.component';
import { PtphDetail } from '../../models/ptph-detail.model';
import { PtphDetailService } from '../../services/ptph-detail.service';
import { TierAndListTypeStore } from '../../store/tier-and-list-type.store';
import { TierAndListTypeReviewContainer } from '../tier-and-list-type-review.container';

const HEARING_ID = 'hearing-1';
const FORM_ROUTE = ['/manage', HEARING_ID, 'tier-and-list-type', 'edit'];

const blankRecord: PtphDetail = { finalised: false };
const completeRecord: PtphDetail = { tier: 'TIER_1', listType: 'TYPE_1_FIXED', finalised: false };

@Component({
  selector: 'tier-and-list-type-review',
  template: '<div>mock review</div>',
  changeDetection: ChangeDetectionStrategy.OnPush
})
class MockTierAndListTypeReviewComponent {
  readonly ptphDetail = input.required<PtphDetail>();
  readonly canFinalise = input(false);
  readonly formRoute = input.required<string[]>();

  readonly finalise = output<void>();
  readonly delete = output<void>();
}

describe('TierAndListTypeReviewContainer', () => {
  let fixture: ComponentFixture<TierAndListTypeReviewContainer>;
  let component: TierAndListTypeReviewContainer;
  let store: InstanceType<typeof TierAndListTypeStore>;
  let mockStore: MockStore;
  let getPtphDetail: jest.Mock;
  let finalisePtphDetail: jest.Mock;
  let deletePtphDetail: jest.Mock;

  const childElement = () =>
    fixture.debugElement.query(By.directive(MockTierAndListTypeReviewComponent));
  const child = () => childElement().componentInstance as MockTierAndListTypeReviewComponent;

  const loadDetail = (detail: PtphDetail) => {
    getPtphDetail.mockReturnValue(of(detail));
    store.load(HEARING_ID);
    fixture.detectChanges();
  };

  beforeEach(() => {
    getPtphDetail = jest.fn().mockReturnValue(of(blankRecord));
    finalisePtphDetail = jest.fn().mockReturnValue(of({}));
    deletePtphDetail = jest.fn().mockReturnValue(of({}));

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
            savePtphDetail: jest.fn().mockReturnValue(of({})),
            finalisePtphDetail,
            deletePtphDetail
          }
        }
      ],
      teardown: { destroyAfterEach: false }
    });

    TestBed.overrideComponent(TierAndListTypeReviewContainer, {
      remove: { imports: [TierAndListTypeReviewComponent] },
      add: { imports: [MockTierAndListTypeReviewComponent] }
    });

    mockStore = TestBed.inject(MockStore);
    mockStore.overrideSelector(getCurrentHearingUrn, 'URN-1');
    mockStore.refreshState();

    store = TestBed.inject(TierAndListTypeStore);

    fixture = TestBed.createComponent(TierAndListTypeReviewContainer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    mockStore.resetSelectors();
  });

  describe('rendering', () => {
    it('should render the review page before anything is loaded', () => {
      expect(fixture).toMatchSnapshot();
    });

    it('should render the review page with a loaded record', () => {
      loadDetail(completeRecord);

      expect(fixture).toMatchSnapshot();
    });

    it('should render the review heading', () => {
      expect(fixture.debugElement.query(By.css('h1')).nativeElement.textContent).toContain(
        'TIER_AND_LIST_TYPE.REVIEW_HEADING'
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

    it('should not render the review component before anything is loaded', () => {
      expect(childElement()).toBeNull();
    });
  });

  describe('inputs passed to the review component', () => {
    it('should pass the loaded detail down', () => {
      loadDetail(completeRecord);

      expect(child().ptphDetail()).toEqual(completeRecord);
    });

    it('should pass the form route down', () => {
      loadDetail(completeRecord);

      expect(child().formRoute()).toEqual(FORM_ROUTE);
      expect(component.formRoute).toEqual(FORM_ROUTE);
    });

    it('should pass canFinalise as true for a complete record', () => {
      loadDetail(completeRecord);

      expect(child().canFinalise()).toBe(true);
    });

    it('should pass canFinalise as false for a blank record', () => {
      loadDetail(blankRecord);

      expect(child().canFinalise()).toBe(false);
    });
  });

  describe('onFinalise', () => {
    it('should finalise through the store using the route hearingId', () => {
      loadDetail(completeRecord);
      const finaliseSpy = jest.spyOn(store, 'finalise');

      child().finalise.emit();

      expect(finaliseSpy).toHaveBeenCalledWith(HEARING_ID);
      expect(finalisePtphDetail).toHaveBeenCalledWith(HEARING_ID);
    });
  });

  describe('onDelete', () => {
    it('should remove through the store using the route hearingId', () => {
      loadDetail(completeRecord);
      const removeSpy = jest.spyOn(store, 'remove');

      child().delete.emit();

      expect(removeSpy).toHaveBeenCalledWith(HEARING_ID);
      expect(deletePtphDetail).toHaveBeenCalledWith(HEARING_ID);
    });
  });
});
