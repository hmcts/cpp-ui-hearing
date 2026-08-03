import { TestBed } from '@angular/core/testing';
import { cold } from 'jasmine-marbles';
import { DefendantBreachApplication } from '../../model/breach-application';
import { ProgressionService } from './progression.service';
import { CppHttp, provideCppCoreHttpServices } from '@cpp/core';

describe('ProgressionService', () => {
  let service: ProgressionService;
  let http: CppHttp;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideCppCoreHttpServices(),
        {
          provide: CppHttp,
          useValue: {
            query: jest.fn(),
            command: jest.fn(),
            commandSync: jest.fn()
          }
        },
        ProgressionService
      ],
      teardown: { destroyAfterEach: false }
    });
    http = TestBed.inject(CppHttp);
    service = TestBed.inject(ProgressionService);
  });

  describe('create application', () => {
    it('should send application request', () => {
      const response = { body: '*' };
      const body = <DefendantBreachApplication>{
        hearingId: 'hearingId'
      };
      const response$ = cold('-a|', { a: response });
      const expected$ = cold('-b|', { b: response });
      http.commandSync = jest.fn().mockReturnValue(response$);
      const command$ = service.addBreachApplication(body);
      expect(command$).toBeObservable(expected$);
      expect(http.commandSync).toHaveBeenCalledWith({
        url: `/progression-command-api/command/api/rest/progression/add-breach-application`,
        requestType: 'application/vnd.progression.add-breach-application+json',
        successEvent: 'public.hearing.hearing-breach-applications-added',
        body
      });
    });
  });
});
