import { TestBed } from '@angular/core/testing';
import { NEVER, of, throwError } from 'rxjs';
import { PtphDetail, SavePtphDetailPayload } from '../../models/ptph-detail.model';
import { PtphDetailService } from '../../services/ptph-detail.service';
import { TierAndListTypeStore } from '../tier-and-list-type.store';

const HEARING_ID = 'hearing-1';

const blankRecord: PtphDetail = { finalised: false };
const tierOnlyRecord: PtphDetail = { tier: 'TIER_1', finalised: false };
const listTypeOnlyRecord: PtphDetail = { listType: 'TYPE_1_FIXED', finalised: false };
const completeRecord: PtphDetail = {
  tier: 'TIER_1',
  listType: 'TYPE_1_FIXED',
  keyReason: 'Key witness',
  finalised: false
};
const finalisedRecord: PtphDetail = { ...completeRecord, finalised: true };

const savePayload: SavePtphDetailPayload = {
  hearingId: HEARING_ID,
  tier: 'TIER_1',
  listType: 'TYPE_1_FIXED'
};

const failure = (messageKey: string) => ({ kind: 'warning', messageKey });
const success = (messageKey: string) => ({ kind: 'success', messageKey });

describe('TierAndListTypeStore', () => {
  let store: InstanceType<typeof TierAndListTypeStore>;
  let getPtphDetail: jest.Mock;
  let savePtphDetail: jest.Mock;
  let finalisePtphDetail: jest.Mock;
  let deletePtphDetail: jest.Mock;

  const givenAnExistingFailureAlert = () => {
    getPtphDetail.mockReturnValueOnce(throwError(() => new Error('load failed')));
    store.load(HEARING_ID);
    expect(store.alert()).toEqual(failure('TIER_AND_LIST_TYPE.ALERT_LOAD_FAILURE'));
  };

  beforeEach(() => {
    getPtphDetail = jest.fn().mockReturnValue(of(blankRecord));
    savePtphDetail = jest.fn().mockReturnValue(of({}));
    finalisePtphDetail = jest.fn().mockReturnValue(of({}));
    deletePtphDetail = jest.fn().mockReturnValue(of({}));

    TestBed.configureTestingModule({
      providers: [
        TierAndListTypeStore,
        {
          provide: PtphDetailService,
          useValue: { getPtphDetail, savePtphDetail, finalisePtphDetail, deletePtphDetail }
        }
      ],
      teardown: { destroyAfterEach: false }
    });

    store = TestBed.inject(TierAndListTypeStore);
  });

  describe('initial state', () => {
    it('should start with no detail and no alert', () => {
      expect(store.detail()).toBeNull();
      expect(store.alert()).toBeNull();
    });

    it('should not allow finalising before anything is loaded', () => {
      expect(store.canFinalise()).toBe(false);
    });
  });

  describe('load', () => {
    it('should query the detail for the given hearing', () => {
      store.load(HEARING_ID);

      expect(getPtphDetail).toHaveBeenCalledWith(HEARING_ID);
    });

    it('should populate detail from the query response', () => {
      getPtphDetail.mockReturnValue(of(completeRecord));

      store.load(HEARING_ID);

      expect(store.detail()).toEqual(completeRecord);
      expect(store.alert()).toBeNull();
    });

    it('should set the load failure alert and leave detail untouched when the query fails', () => {
      getPtphDetail.mockReturnValue(throwError(() => new Error('load failed')));

      store.load(HEARING_ID);

      expect(store.alert()).toEqual(failure('TIER_AND_LIST_TYPE.ALERT_LOAD_FAILURE'));
      expect(store.detail()).toBeNull();
    });

    it('should clear an existing alert as soon as the load starts', () => {
      givenAnExistingFailureAlert();
      getPtphDetail.mockReturnValue(NEVER);

      store.load(HEARING_ID);

      expect(store.alert()).toBeNull();
    });
  });

  describe('save', () => {
    it('should send the save command with the payload', () => {
      store.save(savePayload);

      expect(savePtphDetail).toHaveBeenCalledWith(savePayload);
    });

    it('should re-query the detail after the command resolves', () => {
      store.save(savePayload);

      expect(savePtphDetail).toHaveBeenCalledTimes(1);
      expect(getPtphDetail).toHaveBeenCalledWith(HEARING_ID);
    });

    it('should drive detail from the re-query rather than from the saved payload', () => {
      getPtphDetail.mockReturnValue(of(blankRecord));

      store.save(savePayload);

      expect(store.detail()).toEqual(blankRecord);
      expect(store.alert()).toBeNull();
    });

    it('should set the save failure alert when the command fails and should not re-query', () => {
      savePtphDetail.mockReturnValue(throwError(() => new Error('save failed')));

      store.save(savePayload);

      expect(getPtphDetail).not.toHaveBeenCalled();
      expect(store.alert()).toEqual(failure('TIER_AND_LIST_TYPE.ALERT_SAVE_FAILURE'));
      expect(store.detail()).toBeNull();
    });

    it('should set the save failure alert when the re-query fails', () => {
      getPtphDetail.mockReturnValue(throwError(() => new Error('query failed')));

      store.save(savePayload);

      expect(store.alert()).toEqual(failure('TIER_AND_LIST_TYPE.ALERT_SAVE_FAILURE'));
    });

    it('should clear an existing alert as soon as the save starts', () => {
      givenAnExistingFailureAlert();
      savePtphDetail.mockReturnValue(NEVER);

      store.save(savePayload);

      expect(store.alert()).toBeNull();
    });

    it('should not raise a success alert on a successful save', () => {
      getPtphDetail.mockReturnValue(of(completeRecord));

      store.save(savePayload);

      expect(store.alert()).toBeNull();
    });
  });

  describe('finalise', () => {
    it('should send the finalise command for the hearing', () => {
      store.finalise(HEARING_ID);

      expect(finalisePtphDetail).toHaveBeenCalledWith(HEARING_ID);
    });

    it('should re-query the detail after the command resolves', () => {
      store.finalise(HEARING_ID);

      expect(getPtphDetail).toHaveBeenCalledWith(HEARING_ID);
    });

    it('should drive detail from the re-query and raise the finalised success alert', () => {
      getPtphDetail.mockReturnValue(of(finalisedRecord));

      store.finalise(HEARING_ID);

      expect(store.detail()).toEqual(finalisedRecord);
      expect(store.alert()).toEqual(success('TIER_AND_LIST_TYPE.ALERT_FINALISED_SUCCESS'));
    });

    it('should not assume success when the re-query says the record is still not finalised', () => {
      getPtphDetail.mockReturnValue(of(completeRecord));

      store.finalise(HEARING_ID);

      expect(store.detail()).toEqual(completeRecord);
      expect(store.detail()?.finalised).toBe(false);
    });

    it('should set the finalise failure alert when the command fails', () => {
      finalisePtphDetail.mockReturnValue(throwError(() => new Error('finalise failed')));

      store.finalise(HEARING_ID);

      expect(getPtphDetail).not.toHaveBeenCalled();
      expect(store.alert()).toEqual(failure('TIER_AND_LIST_TYPE.ALERT_FINALISE_FAILURE'));
    });

    it('should set the finalise failure alert when the re-query fails', () => {
      getPtphDetail.mockReturnValue(throwError(() => new Error('query failed')));

      store.finalise(HEARING_ID);

      expect(store.alert()).toEqual(failure('TIER_AND_LIST_TYPE.ALERT_FINALISE_FAILURE'));
    });

    it('should clear an existing alert as soon as the finalise starts', () => {
      givenAnExistingFailureAlert();
      finalisePtphDetail.mockReturnValue(NEVER);

      store.finalise(HEARING_ID);

      expect(store.alert()).toBeNull();
    });
  });

  describe('remove', () => {
    it('should send the delete command for the hearing', () => {
      store.remove(HEARING_ID);

      expect(deletePtphDetail).toHaveBeenCalledWith(HEARING_ID);
    });

    it('should re-query the detail after the command resolves', () => {
      store.remove(HEARING_ID);

      expect(getPtphDetail).toHaveBeenCalledWith(HEARING_ID);
    });

    it('should drive detail from the re-query and raise the deleted success alert', () => {
      getPtphDetail.mockReturnValue(of(blankRecord));

      store.remove(HEARING_ID);

      expect(store.detail()).toEqual(blankRecord);
      expect(store.alert()).toEqual(success('TIER_AND_LIST_TYPE.ALERT_DELETED_SUCCESS'));
    });

    it('should set the delete failure alert when the command fails', () => {
      deletePtphDetail.mockReturnValue(throwError(() => new Error('delete failed')));

      store.remove(HEARING_ID);

      expect(getPtphDetail).not.toHaveBeenCalled();
      expect(store.alert()).toEqual(failure('TIER_AND_LIST_TYPE.ALERT_DELETE_FAILURE'));
    });

    it('should set the delete failure alert when the re-query fails', () => {
      getPtphDetail.mockReturnValue(throwError(() => new Error('query failed')));

      store.remove(HEARING_ID);

      expect(store.alert()).toEqual(failure('TIER_AND_LIST_TYPE.ALERT_DELETE_FAILURE'));
    });

    it('should clear an existing alert as soon as the remove starts', () => {
      givenAnExistingFailureAlert();
      deletePtphDetail.mockReturnValue(NEVER);

      store.remove(HEARING_ID);

      expect(store.alert()).toBeNull();
    });
  });

  describe('canFinalise', () => {
    const loaded = (detail: PtphDetail) => {
      getPtphDetail.mockReturnValue(of(detail));
      store.load(HEARING_ID);
    };

    it('should be true when both tier and listType are set and the record is not finalised', () => {
      loaded(completeRecord);

      expect(store.canFinalise()).toBe(true);
    });

    it('should be false for a blank record returned by the api', () => {
      loaded(blankRecord);

      expect(store.detail()).toEqual({ finalised: false });
      expect('tier' in (store.detail() as PtphDetail)).toBe(false);
      expect(store.canFinalise()).toBe(false);
    });

    it('should be false when only the tier is set', () => {
      loaded(tierOnlyRecord);

      expect(store.canFinalise()).toBe(false);
    });

    it('should be false when only the listType is set', () => {
      loaded(listTypeOnlyRecord);

      expect(store.canFinalise()).toBe(false);
    });

    it('should be false when the record is already finalised', () => {
      loaded(finalisedRecord);

      expect(store.canFinalise()).toBe(false);
    });

    it('should be false when tier or listType are explicitly null', () => {
      loaded({ tier: null, listType: null, finalised: false });

      expect(store.canFinalise()).toBe(false);
    });
  });

  describe('dismissAlert', () => {
    it('should clear the current alert', () => {
      givenAnExistingFailureAlert();

      store.dismissAlert();

      expect(store.alert()).toBeNull();
    });

    it('should leave detail untouched', () => {
      getPtphDetail.mockReturnValue(of(completeRecord));
      store.load(HEARING_ID);

      store.dismissAlert();

      expect(store.detail()).toEqual(completeRecord);
    });
  });
});
