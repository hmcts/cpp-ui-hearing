import { TestBed } from '@angular/core/testing';
import { CaseAccessAlertService } from '../case-access-alert.service';
import { BsModalService } from 'ngx-bootstrap/modal';

describe('CaseAccessAlertService', () => {
  let service: CaseAccessAlertService;
  const nativeDate = Date.now;
  const show = jest.fn();
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CaseAccessAlertService,
        {
          provide: BsModalService,
          useValue: {
            show
          }
        }
      ],
      teardown: { destroyAfterEach: false }
    });

    service = TestBed.inject(CaseAccessAlertService);
    global.Date.now = jest.fn(() => new Date('2020-02-07T10:20:30Z').getTime());
    jest.spyOn(window.localStorage.__proto__, 'setItem');
    jest.spyOn(window.localStorage.__proto__, 'removeItem');
  });

  afterAll(() => {
    global.Date.now = nativeDate;
  });

  it('should show modal if no item on storage', () => {
    expect(service.shouldShowModal(['h1', 'h2'], 'userId')).toBeTruthy();
  });

  it('should save the decision', () => {
    service.saveDecision(['h1', 'h2'], 'userId', true);
    expect((window.localStorage.setItem as any).mock.calls).toMatchSnapshot();
  });

  it('should reset values', () => {
    service.saveDecision(['h1', 'h2'], 'userId', true);
    global.Date.now = jest.fn(() => new Date('2020-02-08T10:20:30Z').getTime());
    service.shouldShowModal(['h1', 'h2'], 'userId');
    expect(window.localStorage.removeItem).toHaveBeenCalled();
    expect(window.localStorage.getItem('accessAlert')).toBe(null);
  });

  it('should not show modal is selected id is not in todays hearing values', () => {
    expect(service.shouldShowModal(['h1', 'h2'], 'userId', 'h3')).toBeFalsy();
  });

  it('should not show modal when selected id is set and in storage', () => {
    service.saveDecision(['h1', 'h2'], 'userId', true);
    expect(service.shouldShowModal(['h1', 'h2'], 'userId', 'h1')).toBeFalsy();
  });

  it('should show modal when selected id is set and not in storage', () => {
    service.saveDecision(['h1', 'h2'], 'userId', true);
    expect(service.shouldShowModal(['h1', 'h2', 'h3'], 'userId', 'h3')).toBeTruthy();
  });

  it('should reset for different user', () => {
    service.saveDecision(['h1', 'h2'], 'userId', true);
    const result = service.shouldShowModal(['h3'], 'userId2');

    expect(result).toBeTruthy();
    expect(window.localStorage.removeItem).toHaveBeenCalled();
    expect(window.localStorage.getItem('accessAlert')).toBe(null);
  });

  it('should add more hearing ids', () => {
    service.saveDecision(['h1', 'h2'], 'userId', true);
    service.saveDecision(['h3'], 'userId2', true);

    expect(window.localStorage.getItem('accessAlert')).toMatchSnapshot();
  });

  it('should show modal', () => {
    service.saveDecision(['h1', 'h2'], 'userId', true);
    service.showModal({
      hearingIds: ['h1', 'h2'],
      userId: 'userId',
      urns: ['urn1'],
      selectedHearingId: 'h3',
      onSubmit: () => {},
      onCancel: () => {}
    });

    expect(show.mock.calls).toMatchSnapshot();
  });
});
