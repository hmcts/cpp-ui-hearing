import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FindCourtComponent } from './find-court.component';
import { TranslatePipe, TranslateService, provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { provideMockStore } from '@ngrx/store/testing';
import { TranslateMockPipe } from '../../../shared/pipes/mock-pipes/translate-mock.pipe';

describe('FindCourtComponent', () => {
  let component: FindCourtComponent;
  let fixture: ComponentFixture<FindCourtComponent>;
  let translateGetSpy: jest.Mock;

  beforeEach(waitForAsync(() => {
    translateGetSpy = jest.fn().mockReturnValue(of('Check In'));

    jest.spyOn(global.Date, 'now').mockImplementation(function () {
      return new Date(Date.UTC(2019, 11, 14)).getTime();
    });

    TestBed.configureTestingModule({
      imports: [FindCourtComponent],
      providers: [
        provideTranslateService(),
        provideMockStore(),
        { provide: TranslateService, useValue: { get: translateGetSpy } }
      ],
      teardown: { destroyAfterEach: false }
    })
      .overrideComponent(FindCourtComponent, {
        remove: { imports: [TranslatePipe] },
        add: { imports: [TranslateMockPipe] }
      })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FindCourtComponent);
    component = fixture.componentInstance;
    component.appUrl = 'http://app/url';
  });

  it('should create the right templates with actions', () => {
    expect(fixture).toMatchSnapshot();
  });

  describe('ngOnInit', () => {
    it('should subscribe to translations and set translated values', () => {
      const mockTranslations = {
        'CHECK_IN.COURT': 'Court',
        'CHECK_IN.COURT_ERROR': 'Court Error',
        'CHECK_IN.DEFENCE': 'Defence',
        'CHECK_IN.PROSECUTION': 'Prosecution',
        'CHECK_IN.SELECT_A_HEARING': 'Select a Hearing'
      };
      translateGetSpy.mockReturnValue(of(mockTranslations));

      component.ngOnInit();

      expect(translateGetSpy).toHaveBeenCalledWith([
        'CHECK_IN.COURT',
        'CHECK_IN.COURT_ERROR',
        'CHECK_IN.DEFENCE',
        'CHECK_IN.PROSECUTION',
        'CHECK_IN.SELECT_A_HEARING'
      ]);
      expect(component.translated).toEqual({
        COURT: 'Court',
        COURT_ERROR: 'Court Error',
        DEFENCE: 'Defence',
        PROSECUTION: 'Prosecution'
      });
    });

    it('should set currentDate to current date', () => {
      component.ngOnInit();
      expect(component.currentDate).toEqual(new Date(Date.UTC(2019, 11, 14)));
    });
  });

  describe('selectCourt', () => {
    it('should emit onSelect with court centre', () => {
      const mockCourtCentre = { code: 'COURT1', name: 'Test Court' } as any;
      jest.spyOn(component.onSelect, 'emit');

      component.selectCourt({ courtCentre: mockCourtCentre });

      expect(component.onSelect.emit).toHaveBeenCalledWith(mockCourtCentre);
    });
  });

  describe('userGroup getter', () => {
    it('should return DEFENCE when isDefenceUser is true', () => {
      component.isDefenceUser = true;
      component.translated = {
        DEFENCE: 'Defence User',
        PROSECUTION: 'Prosecution User'
      };

      expect(component.userGroup).toBe('Defence User');
    });

    it('should return PROSECUTION when isDefenceUser is false', () => {
      component.isDefenceUser = false;
      component.translated = {
        DEFENCE: 'Defence User',
        PROSECUTION: 'Prosecution User'
      };

      expect(component.userGroup).toBe('Prosecution User');
    });
  });

  describe('formErrorMessage', () => {
    beforeEach(() => {
      component.translated = {
        COURT: 'Court',
        COURT_ERROR: 'Please select a valid court'
      };
    });

    it('should update error messages and emit errors when errors exist', () => {
      const mockErrors = [
        { message: 'Court', fieldId: 'courtCentre' },
        { message: 'Other error', fieldId: 'otherField' }
      ] as any[];
      jest.spyOn(component.onAddCheckinErrors, 'emit');

      component.formErrorMessage(mockErrors);

      expect(component.errors).toBe(mockErrors);
      expect(component.onAddCheckinErrors.emit).toHaveBeenCalledWith(mockErrors);
    });

    it('should emit empty array when errors is null', () => {
      jest.spyOn(component.onAddCheckinErrors, 'emit');

      component.formErrorMessage(null as any);

      expect(component.onAddCheckinErrors.emit).toHaveBeenCalledWith([]);
    });

    it('should emit empty array when errors is undefined', () => {
      jest.spyOn(component.onAddCheckinErrors, 'emit');

      component.formErrorMessage(undefined as any);

      expect(component.onAddCheckinErrors.emit).toHaveBeenCalledWith([]);
    });
  });
});
