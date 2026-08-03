import { SortLoggedEventsPipe } from './sort-logged-events.pipe';
import { inject, TestBed } from '@angular/core/testing';
import { HearingEventsLogService } from '../services/hearing-events-log.service';
import { EventLog } from '../../../core';

class HearingEventsLogServiceMock {
  sortLoggedEvents(events: EventLog[]) {}
}

describe('SortLoggedEventsPipe', () => {
  let pipe: SortLoggedEventsPipe;
  let service: HearingEventsLogService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SortLoggedEventsPipe,
        {
          provide: HearingEventsLogService,
          useClass: HearingEventsLogServiceMock
        }
      ],
      teardown: { destroyAfterEach: false }
    });
    service = TestBed.inject(HearingEventsLogService);
  });

  beforeEach(inject([SortLoggedEventsPipe], (p: SortLoggedEventsPipe) => {
    jest.spyOn(service, 'sortLoggedEvents').mockImplementation(x => x);
    pipe = p;
  }));

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('call to hearingEventsLogService.sortLoggedEvents', () => {
    pipe.transform([]);
    expect(service.sortLoggedEvents).toHaveBeenCalled();
  });
});
