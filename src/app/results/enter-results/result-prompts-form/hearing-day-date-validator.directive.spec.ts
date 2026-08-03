import { FormControl } from '@angular/forms';
import { HearingDayDateValidatorDirective } from './hearing-day-date-validator.directive';

describe('HearingDayDateValidatorDirective', () => {
  const HEARING_DAY = '2026-07-01';

  let directive: HearingDayDateValidatorDirective;

  beforeEach(() => {
    directive = new HearingDayDateValidatorDirective();
  });

  it('should create', () => {
    expect(directive).toBeTruthy();
  });

  describe('validate', () => {
    it('should be inert when no hearing day is set', () => {
      directive.hearingDayDateValidator = null;

      expect(directive.validate(new FormControl('2020-01-01'))).toBeNull();
    });

    it('should reject the hearing day itself', () => {
      directive.hearingDayDateValidator = HEARING_DAY;

      expect(directive.validate(new FormControl(HEARING_DAY))).toEqual({ pastDate: true });
    });

    it('should reject dates before the hearing day', () => {
      directive.hearingDayDateValidator = HEARING_DAY;

      expect(directive.validate(new FormControl('2026-06-30'))).toEqual({ pastDate: true });
      expect(directive.validate(new FormControl('2020-01-01'))).toEqual({ pastDate: true });
    });

    it('should accept dates strictly after the hearing day', () => {
      directive.hearingDayDateValidator = HEARING_DAY;

      expect(directive.validate(new FormControl('2026-07-02'))).toBeNull();
    });
  });

  describe('registerOnValidatorChange', () => {
    it('should re-run validation when the hearing day input changes', () => {
      const onChange = jest.fn();
      directive.registerOnValidatorChange(onChange);

      directive.ngOnChanges();

      expect(onChange).toHaveBeenCalled();
    });
  });
});
