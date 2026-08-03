import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { AppConfigService } from '../../../config';
import { CheckInOutcomeComponent } from './check-in-outcome.component';

describe('CheckInOutcomeComponent', () => {
  let component: CheckInOutcomeComponent;
  let fixture: ComponentFixture<CheckInOutcomeComponent>;
  const getBaseUrl = jest.fn();

  describe('with failed cases', () => {
    beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [CheckInOutcomeComponent],
        providers: [
          provideTranslateService(),
          provideRouter([]),
          { provide: AppConfigService, useValue: { getBaseUrl } },
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: {
                queryParams: {
                  numberOfSuccessfulHearings: 3,
                  failedCases: '62GD9725420,88GD9063320',
                  role: 'prosecution',
                  courtHouse: 'Lavender'
                }
              }
            }
          }
        ],
        teardown: { destroyAfterEach: false }
      }).compileComponents();

      getBaseUrl.mockReturnValue('http://base-url');
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(CheckInOutcomeComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should match the snapshot', () => {
      expect(fixture).toMatchSnapshot();
    });

    it('should parse failed cases from query params', () => {
      expect(component.failedCases).toEqual(['62GD9725420', '88GD9063320']);
    });

    it('should format failed cases as comma-separated string', () => {
      expect(component.failedCasesFormatted).toBe('62GD9725420, 88GD9063320');
    });

    it('should return success check-in params', () => {
      expect(component.successCheckInparams).toEqual({
        role: 'prosecution',
        numberOfSuccessfulHearings: 3,
        courtHouse: 'Lavender'
      });
    });
  });

  describe('without failed cases', () => {
    beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [CheckInOutcomeComponent],
        providers: [
          provideTranslateService(),
          provideRouter([]),
          { provide: AppConfigService, useValue: { getBaseUrl } },
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: {
                queryParams: {
                  numberOfSuccessfulHearings: 1,
                  failedCases: '',
                  role: 'defence',
                  courtHouse: 'Westminster'
                }
              }
            }
          }
        ],
        teardown: { destroyAfterEach: false }
      }).compileComponents();

      getBaseUrl.mockReturnValue('http://base-url');
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(CheckInOutcomeComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should set failedCases to empty array when failedCases param is empty', () => {
      expect(component.failedCases).toEqual([]);
    });

    it('should return empty string for failedCasesFormatted when no failed cases', () => {
      expect(component.failedCasesFormatted).toBe('');
    });
  });
});
