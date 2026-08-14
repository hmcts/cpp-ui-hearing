import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { PdkAlertComponent } from '@cpp/pdk';
import { provideTranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { PtphDetail } from '../../models/ptph-detail.model';
import { PtphDetailService } from '../../services/ptph-detail.service';
import { TierAndListTypeContainer } from '../tier-and-list-type.container';

const HEARING_ID = 'hearing-1';
const REVIEW_ROUTE = ['/manage', HEARING_ID, 'tier-and-list-type'];
const FORM_ROUTE = ['/manage', HEARING_ID, 'tier-and-list-type', 'edit'];

const blankRecord: PtphDetail = { finalised: false };
const tierOnlyRecord: PtphDetail = { tier: 'TIER_1', finalised: false };
const completeRecord: PtphDetail = { tier: 'TIER_1', listType: 'TYPE_1_FIXED', finalised: false };
const finalisedRecord: PtphDetail = { ...completeRecord, finalised: true };

describe('TierAndListTypeContainer', () => {
  let fixture: ComponentFixture<TierAndListTypeContainer>;
  let component: TierAndListTypeContainer;
  let navigate: jest.Mock;
  let getPtphDetail: jest.Mock;
  let savePtphDetail: jest.Mock;
  let finalisePtphDetail: jest.Mock;
  let deletePtphDetail: jest.Mock;
  let routeStub: {
    snapshot: {
      params: Record<string, string>;
      parent: { params: Record<string, string>; parent: null };
      firstChild: { routeConfig: { path: string } } | null;
    };
  };

  const createComponent = () => {
    fixture = TestBed.createComponent(TierAndListTypeContainer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  const alertComponent = () => fixture.debugElement.query(By.directive(PdkAlertComponent));

  beforeEach(() => {
    navigate = jest.fn().mockResolvedValue(true);
    getPtphDetail = jest.fn().mockReturnValue(of(blankRecord));
    savePtphDetail = jest.fn().mockReturnValue(of({}));
    finalisePtphDetail = jest.fn().mockReturnValue(of({}));
    deletePtphDetail = jest.fn().mockReturnValue(of({}));

    routeStub = {
      snapshot: {
        params: {},
        parent: { params: { hearingId: HEARING_ID }, parent: null },
        firstChild: { routeConfig: { path: '' } }
      }
    };

    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(),
        { provide: ActivatedRoute, useValue: routeStub },
        { provide: Router, useValue: { navigate } },
        {
          provide: PtphDetailService,
          useValue: { getPtphDetail, savePtphDetail, finalisePtphDetail, deletePtphDetail }
        }
      ],
      teardown: { destroyAfterEach: false }
    });
  });

  describe('rendering', () => {
    it('should render without an alert', () => {
      getPtphDetail.mockReturnValue(of(completeRecord));

      createComponent();

      expect(alertComponent()).toBeNull();
      expect(fixture).toMatchSnapshot();
    });

    it('should render a failure alert', () => {
      getPtphDetail.mockReturnValue(throwError(() => new Error('load failed')));

      createComponent();

      expect(fixture).toMatchSnapshot();
    });

    it('should render the alert message key', () => {
      getPtphDetail.mockReturnValue(throwError(() => new Error('load failed')));

      createComponent();

      expect(alertComponent().nativeElement.textContent).toContain(
        'TIER_AND_LIST_TYPE.ALERT_LOAD_FAILURE'
      );
    });
  });

  describe('ngOnInit', () => {
    it('should load the detail using the hearingId from the ancestor route params', () => {
      createComponent();

      expect(getPtphDetail).toHaveBeenCalledWith(HEARING_ID);
    });

    it('should resolve the hearingId from the ancestor route when the child route also declares one', () => {
      routeStub.snapshot.params = { hearingId: 'child-hearing' };

      createComponent();

      expect(getPtphDetail).toHaveBeenCalledTimes(1);
      expect(getPtphDetail).toHaveBeenCalledWith(HEARING_ID);
    });
  });

  describe('redirect effect', () => {
    it('should navigate to the form route after the first load when there is no tier', () => {
      getPtphDetail.mockReturnValue(of(blankRecord));

      createComponent();

      expect(navigate).toHaveBeenCalledWith(FORM_ROUTE);
    });

    it('should leave the user on review when the loaded record has a tier', () => {
      getPtphDetail.mockReturnValue(of(tierOnlyRecord));

      createComponent();

      expect(navigate).not.toHaveBeenCalled();
    });

    it('should not navigate when the form route is already the active child route', () => {
      routeStub.snapshot.firstChild = { routeConfig: { path: 'edit' } };
      getPtphDetail.mockReturnValue(of(blankRecord));

      createComponent();

      expect(navigate).not.toHaveBeenCalled();
    });

    it('should not navigate while nothing has been loaded', () => {
      getPtphDetail.mockReturnValue(throwError(() => new Error('load failed')));

      createComponent();

      expect(navigate).not.toHaveBeenCalled();
    });

    it('should treat a missing active child route as the review route', () => {
      routeStub.snapshot.firstChild = null;
      getPtphDetail.mockReturnValue(of(tierOnlyRecord));

      createComponent();

      expect(navigate).not.toHaveBeenCalled();
    });

    it('should navigate to the form route when there is no tier and no active child route', () => {
      routeStub.snapshot.firstChild = null;
      getPtphDetail.mockReturnValue(of(blankRecord));

      createComponent();

      expect(navigate).toHaveBeenCalledWith(FORM_ROUTE);
    });

    it('should navigate back to review when an amend save replaces a record that already had a tier', () => {
      getPtphDetail.mockReturnValue(of(tierOnlyRecord));
      createComponent();
      expect(navigate).not.toHaveBeenCalled();

      routeStub.snapshot.firstChild = { routeConfig: { path: 'edit' } };
      getPtphDetail.mockReturnValue(of({ ...tierOnlyRecord, listType: 'TYPE_1_FIXED' }));

      component.store.save({ hearingId: HEARING_ID, tier: 'TIER_1', listType: 'TYPE_1_FIXED' });
      fixture.detectChanges();

      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith(REVIEW_ROUTE);
    });

    it('should navigate back to review after a first save from the form route', () => {
      routeStub.snapshot.firstChild = { routeConfig: { path: 'edit' } };
      getPtphDetail.mockReturnValue(of(blankRecord));
      createComponent();
      expect(navigate).not.toHaveBeenCalled();

      getPtphDetail.mockReturnValue(of(completeRecord));
      component.store.save({ hearingId: HEARING_ID, tier: 'TIER_1', listType: 'TYPE_1_FIXED' });
      fixture.detectChanges();

      expect(navigate).toHaveBeenCalledWith(REVIEW_ROUTE);
    });

    it('should navigate to the form route when a delete leaves a blank record', () => {
      getPtphDetail.mockReturnValue(of(finalisedRecord));
      createComponent();
      expect(navigate).not.toHaveBeenCalled();

      getPtphDetail.mockReturnValue(of(blankRecord));
      component.store.remove(HEARING_ID);
      fixture.detectChanges();

      expect(navigate).toHaveBeenCalledWith(FORM_ROUTE);
    });

    it('should not navigate when a finalise leaves the record on the review route', () => {
      getPtphDetail.mockReturnValue(of(completeRecord));
      createComponent();

      getPtphDetail.mockReturnValue(of(finalisedRecord));
      component.store.finalise(HEARING_ID);
      fixture.detectChanges();

      expect(navigate).not.toHaveBeenCalled();
    });
  });

  describe('alertType', () => {
    it('should map a failure alert to a warning alert', () => {
      getPtphDetail.mockReturnValue(throwError(() => new Error('load failed')));

      createComponent();

      expect(component.alertType()).toBe('warning');
      expect(alertComponent().componentInstance.type).toBe('warning');
    });

    it('should map a success alert to a success alert', () => {
      getPtphDetail.mockReturnValue(of(completeRecord));
      createComponent();

      getPtphDetail.mockReturnValue(of(finalisedRecord));
      component.store.finalise(HEARING_ID);
      fixture.detectChanges();

      expect(component.store.alert()).toEqual({
        kind: 'success',
        messageKey: 'TIER_AND_LIST_TYPE.ALERT_FINALISED_SUCCESS'
      });
      expect(component.alertType()).toBe('success');
      expect(alertComponent().componentInstance.type).toBe('success');
    });

    it('should remove the alert once it is dismissed', () => {
      getPtphDetail.mockReturnValue(throwError(() => new Error('load failed')));
      createComponent();
      expect(alertComponent()).not.toBeNull();

      component.store.dismissAlert();
      fixture.detectChanges();

      expect(alertComponent()).toBeNull();
    });
  });
});
