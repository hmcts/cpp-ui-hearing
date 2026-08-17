import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { By } from '@angular/platform-browser';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { ValidationError } from '@cpp/pdk';
import {
  getCurrentHearingTierAndListType,
  SetTierAndListTypeAction,
  TierAndListType
} from '../core';
import { TierAndListTypeContainer } from './tier-and-list-type.container';

describe('TierAndListTypeContainer', () => {
  let component: TierAndListTypeContainer;
  let fixture: ComponentFixture<TierAndListTypeContainer>;
  let store: MockStore;
  let dispatch: jest.SpyInstance;

  const scroll = jest.fn();

  const saved: TierAndListType = {
    tier: 'TIER_4',
    listType: 'TYPE_2'
  };

  const setSavedValue = (value: TierAndListType) => {
    store.overrideSelector(getCurrentHearingTierAndListType, value);
    store.refreshState();
    fixture.detectChanges();
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [TierAndListTypeContainer],
      providers: [
        provideTranslateService(),
        provideMockStore({
          selectors: [{ selector: getCurrentHearingTierAndListType, value: undefined }]
        }),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: { hearingId: ':hearingId' } } }
        },
        { provide: 'Window', useValue: { scroll } }
      ],
      teardown: { destroyAfterEach: false }
    }).compileComponents();
  }));

  beforeEach(() => {
    store = TestBed.inject(MockStore);
    dispatch = jest.spyOn(store, 'dispatch');
    fixture = TestBed.createComponent(TierAndListTypeContainer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    dispatch.mockClear();
    scroll.mockClear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('reads the hearing id from the route', () => {
    expect(component.hearingId).toEqual(':hearingId');
  });

  describe('a hearing with no tier saved', () => {
    it('opens on the entry form', () => {
      expect(fixture.debugElement.query(By.css('tier-and-list-type-form'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('tier-and-list-type-summary'))).toBeNull();
    });
  });

  describe('a hearing with a tier saved', () => {
    beforeEach(() => setSavedValue(saved));

    it('opens on the review state', () => {
      expect(fixture.debugElement.query(By.css('tier-and-list-type-summary'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('tier-and-list-type-form'))).toBeNull();
    });

    it('returns to the entry form when the clerk chooses to change it', () => {
      component.edit();
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('tier-and-list-type-form'))).toBeTruthy();
    });
  });

  describe('#save', () => {
    it('dispatches the tier and list type against the hearing', () => {
      component.save(saved);

      expect(dispatch).toHaveBeenCalledWith(
        new SetTierAndListTypeAction({ hearingId: ':hearingId', tierAndListType: saved })
      );
    });

    it('clears any outstanding validation errors', () => {
      component.errors = [{ id: 'tier', message: 'Select the tier for this hearing' }] as
        | ValidationError[];

      component.save(saved);

      expect(component.errors).toBeNull();
    });

    it('shows the review state once the store confirms the save', () => {
      component.edit();
      component.save(saved);
      setSavedValue(saved);

      expect(fixture.debugElement.query(By.css('tier-and-list-type-summary'))).toBeTruthy();
    });
  });

  describe('#updateErrors', () => {
    const errors = [
      { id: 'tier', message: 'Select the tier for this hearing' }
    ] as ValidationError[];

    it('surfaces form errors in the error summary', () => {
      component.updateErrors(errors);
      fixture.detectChanges();

      expect(component.errors).toEqual(errors);
      expect(fixture.debugElement.query(By.css('pdk-error-summary'))).toBeTruthy();
    });

    it('scrolls the summary into view', () => {
      component.updateErrors(errors);

      expect(scroll).toHaveBeenCalledWith(0, 0);
    });

    it('does not scroll when the form clears its errors', () => {
      component.updateErrors(null);

      expect(scroll).not.toHaveBeenCalled();
    });
  });
});
