import { TestBed } from '@angular/core/testing';
import { CppHttp } from '@cpp/core';
import { of } from 'rxjs';
import { PtphDetail, SavePtphDetailPayload } from '../../models/ptph-detail.model';
import { PtphDetailService } from '../ptph-detail.service';

const QUERY_URL = '/hearing-query-api/query/api/rest/hearing/hearings/hearing-1/ptph-detail';
const COMMAND_URL = '/hearing-command-api/command/api/rest/hearing/hearings/hearing-1';

describe('PtphDetailService', () => {
  let service: PtphDetailService;
  let query: jest.Mock;
  let commandSync: jest.Mock;

  const commandArgs = () => commandSync.mock.calls[0][0];
  const commandBody = () => commandArgs().body as Record<string, unknown>;

  beforeEach(() => {
    query = jest.fn().mockReturnValue(of({ finalised: false } as PtphDetail));
    commandSync = jest.fn().mockReturnValue(of({}));

    TestBed.configureTestingModule({
      providers: [
        PtphDetailService,
        {
          provide: CppHttp,
          useValue: { query, command: jest.fn(), commandSync }
        }
      ],
      teardown: { destroyAfterEach: false }
    });

    service = TestBed.inject(PtphDetailService);
  });

  describe('getPtphDetail', () => {
    it('should query the ptph detail endpoint with the get media type', () => {
      service.getPtphDetail('hearing-1').subscribe();

      expect(query).toHaveBeenCalledWith({
        url: QUERY_URL,
        requestType: 'application/vnd.hearing.get-ptph-detail+json'
      });
    });

    it('should return the queried detail', () => {
      const detail: PtphDetail = { tier: 'TIER_2', listType: 'TYPE_2_FLEXIBLE', finalised: false };
      query.mockReturnValue(of(detail));

      let received: PtphDetail | undefined;
      service.getPtphDetail('hearing-1').subscribe(value => (received = value));

      expect(received).toEqual(detail);
    });

    it('should not send a command when querying', () => {
      service.getPtphDetail('hearing-1').subscribe();

      expect(commandSync).not.toHaveBeenCalled();
    });
  });

  describe('savePtphDetail', () => {
    const payload: SavePtphDetailPayload = {
      hearingId: 'hearing-1',
      tier: 'TIER_1',
      listType: 'TYPE_1_FIXED',
      keyReason: 'Key witness unavailable'
    };

    it('should send the save command to the hearing endpoint with the save media type and event', () => {
      service.savePtphDetail(payload).subscribe();

      expect(commandSync).toHaveBeenCalledWith({
        url: COMMAND_URL,
        requestType: 'application/vnd.hearing.save-ptph-detail+json',
        successEvent: 'public.hearing.ptph-detail-saved',
        body: {
          hearingId: 'hearing-1',
          tier: 'TIER_1',
          listType: 'TYPE_1_FIXED',
          keyReason: 'Key witness unavailable'
        }
      });
    });

    it('should repeat the hearingId inside the command body', () => {
      service.savePtphDetail(payload).subscribe();

      expect(commandBody().hearingId).toBe('hearing-1');
    });

    it('should always send the tier', () => {
      service.savePtphDetail({ hearingId: 'hearing-1', tier: 'TIER_7' }).subscribe();

      expect(commandBody().tier).toBe('TIER_7');
    });

    it('should omit the listType key entirely when it is not provided', () => {
      service.savePtphDetail({ hearingId: 'hearing-1', tier: 'TIER_1' }).subscribe();

      expect(Object.keys(commandBody()).sort()).toEqual(['hearingId', 'tier']);
      expect('listType' in commandBody()).toBe(false);
    });

    it('should omit the listType key entirely when it is null', () => {
      service
        .savePtphDetail({ hearingId: 'hearing-1', tier: 'TIER_1', listType: null })
        .subscribe();

      expect('listType' in commandBody()).toBe(false);
    });

    it('should omit the keyReason key entirely when it is not provided', () => {
      service
        .savePtphDetail({ hearingId: 'hearing-1', tier: 'TIER_1', listType: 'TYPE_1_FIXED' })
        .subscribe();

      expect(Object.keys(commandBody()).sort()).toEqual(['hearingId', 'listType', 'tier']);
      expect('keyReason' in commandBody()).toBe(false);
    });

    it('should omit the keyReason key entirely when it is an empty string', () => {
      service
        .savePtphDetail({
          hearingId: 'hearing-1',
          tier: 'TIER_1',
          listType: 'TYPE_1_FIXED',
          keyReason: ''
        })
        .subscribe();

      expect('keyReason' in commandBody()).toBe(false);
    });

    it('should omit the keyReason key entirely when it is whitespace only', () => {
      service
        .savePtphDetail({
          hearingId: 'hearing-1',
          tier: 'TIER_1',
          listType: 'TYPE_1_FIXED',
          keyReason: '   '
        })
        .subscribe();

      expect('keyReason' in commandBody()).toBe(false);
    });

    it('should omit the keyReason key entirely when it is null', () => {
      service
        .savePtphDetail({
          hearingId: 'hearing-1',
          tier: 'TIER_1',
          listType: 'TYPE_1_FIXED',
          keyReason: null
        })
        .subscribe();

      expect('keyReason' in commandBody()).toBe(false);
    });

    it('should keep a keyReason that has content', () => {
      service
        .savePtphDetail({
          hearingId: 'hearing-1',
          tier: 'TIER_1',
          listType: 'TYPE_1_FIXED',
          keyReason: 'A reason'
        })
        .subscribe();

      expect(commandBody().keyReason).toBe('A reason');
    });

    it('should return the command response', () => {
      const response = { status: 'accepted' };
      commandSync.mockReturnValue(of(response));

      let received: object | undefined;
      service.savePtphDetail(payload).subscribe(value => (received = value));

      expect(received).toEqual(response);
    });
  });

  describe('finalisePtphDetail', () => {
    it('should send the finalise command with its own media type and event', () => {
      service.finalisePtphDetail('hearing-1').subscribe();

      expect(commandSync).toHaveBeenCalledWith({
        url: COMMAND_URL,
        requestType: 'application/vnd.hearing.finalise-ptph-detail+json',
        successEvent: 'public.hearing.ptph-detail-finalised',
        body: {}
      });
    });

    it('should send an empty body that does not repeat the hearingId', () => {
      service.finalisePtphDetail('hearing-1').subscribe();

      expect(Object.keys(commandBody())).toEqual([]);
      expect('hearingId' in commandBody()).toBe(false);
    });
  });

  describe('deletePtphDetail', () => {
    it('should send the delete command with its own media type and event', () => {
      service.deletePtphDetail('hearing-1').subscribe();

      expect(commandSync).toHaveBeenCalledWith({
        url: COMMAND_URL,
        requestType: 'application/vnd.hearing.delete-ptph-detail+json',
        successEvent: 'public.hearing.ptph-detail-deleted',
        body: {}
      });
    });

    it('should send an empty body that does not repeat the hearingId', () => {
      service.deletePtphDetail('hearing-1').subscribe();

      expect(Object.keys(commandBody())).toEqual([]);
      expect('hearingId' in commandBody()).toBe(false);
    });
  });
});
