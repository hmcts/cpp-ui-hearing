import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { ValidationError } from '@cpp/pdk';
import { provideTranslateService } from '@ngx-translate/core';
import { PtphDetail, SavePtphDetailPayload } from '../../../models/ptph-detail.model';
import { TIER_OPTIONS } from '../../../models/tier-options';
import { formRoute, reviewRoute } from '../../../utils/tier-and-list-type.paths';
import { TierAndListTypeFormComponent } from '../tier-and-list-type-form.component';

const HEARING_ID = 'hearing-1';

describe('TierAndListTypeFormComponent', () => {
  let fixture: ComponentFixture<TierAndListTypeFormComponent>;
  let component: TierAndListTypeFormComponent;
  let savedPayloads: SavePtphDetailPayload[];
  let emittedErrors: (ValidationError[] | null)[];
  let cancelEvents: unknown[];

  const formElement = () => fixture.debugElement.query(By.css('form'));
  const revealElement = () => fixture.debugElement.query(By.css('pdk-radio-conditional'));
  const keyReasonElement = () => fixture.debugElement.query(By.css('textarea[pdk-text-input]'));
  const clearLink = () => fixture.debugElement.query(By.css('a[href="javascript:void(0)"]'));
  const cancelLink = () => fixture.debugElement.query(By.css('pdk-button-group a'));

  const submit = () => {
    formElement().triggerEventHandler('submit', new Event('submit'));
    fixture.detectChanges();
  };

  const selectListType = (listType: PtphDetail['listType']) => {
    component.form.controls.listType.setValue(listType ?? null);
    fixture.detectChanges();
  };

  const setPtphDetail = (detail: PtphDetail | null) => {
    fixture.componentRef.setInput('ptphDetail', detail);
    fixture.detectChanges();
  };

  beforeEach(waitForAsync(() => {
    const saved: SavePtphDetailPayload[] = [];
    const seenErrors: (ValidationError[] | null)[] = [];
    const cancels: unknown[] = [];

    savedPayloads = saved;
    emittedErrors = seenErrors;
    cancelEvents = cancels;

    TestBed.configureTestingModule({
      providers: [provideTranslateService(), provideRouter([])],
      teardown: { destroyAfterEach: false }
    }).compileComponents();

    jest.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    fixture = TestBed.createComponent(TierAndListTypeFormComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('hearingId', HEARING_ID);
    fixture.componentRef.setInput('cancelRoute', reviewRoute(HEARING_ID));

    component.save.subscribe(payload => saved.push(payload));
    component.errors.subscribe(errors => seenErrors.push(errors));
    component.cancel.subscribe(() => cancels.push(true));

    fixture.detectChanges();
  }));

  describe('rendering', () => {
    it('should render the empty form', () => {
      expect(fixture).toMatchSnapshot();
    });

    it('should render the form with a fixed date list type selected', () => {
      selectListType('TYPE_1_FIXED');

      expect(fixture).toMatchSnapshot();
    });

    it('should render a radio button for every tier option', () => {
      const radios = fixture.debugElement.queryAll(By.css('pdk-radio-group'));
      const tierRadios = radios[0].queryAll(By.css('pdk-radio-button'));

      expect(tierRadios.length).toBe(TIER_OPTIONS.length);
    });

    it('should render all five tier 2 bullet keys as hint list items', () => {
      const tierGroup = fixture.debugElement.queryAll(By.css('pdk-radio-group'))[0];
      const bullets = tierGroup.queryAll(By.css('ul[pdk-list="bullet"] li'));

      expect(bullets.length).toBe(5);
      expect(bullets.map(bullet => bullet.nativeElement.textContent.trim())).toEqual([
        'TIER_AND_LIST_TYPE.TIER_2_BULLET_1',
        'TIER_AND_LIST_TYPE.TIER_2_BULLET_2',
        'TIER_AND_LIST_TYPE.TIER_2_BULLET_3',
        'TIER_AND_LIST_TYPE.TIER_2_BULLET_4',
        'TIER_AND_LIST_TYPE.TIER_2_BULLET_5'
      ]);
    });

    it('should point the cancel link at the supplied cancel route', () => {
      expect(cancelLink().nativeElement.getAttribute('href')).toBe(
        '/manage/hearing-1/tier-and-list-type'
      );
    });

    it('should follow a changed cancel route', () => {
      fixture.componentRef.setInput('cancelRoute', formRoute(HEARING_ID));
      fixture.detectChanges();

      expect(cancelLink().nativeElement.getAttribute('href')).toBe(
        '/manage/hearing-1/tier-and-list-type/edit'
      );
    });
  });

  describe('validation', () => {
    it('should require a tier', () => {
      expect(component.form.controls.tier.hasError('required')).toBe(true);
      expect(component.form.invalid).toBe(true);
    });

    it('should be valid with a tier alone so the list type never blocks submit', () => {
      component.form.controls.tier.setValue('TIER_3');
      fixture.detectChanges();

      expect(component.form.valid).toBe(true);
      expect(component.form.controls.listType.errors).toBeNull();
    });

    it('should not cross validate tier against list type', () => {
      selectListType('TYPE_2_FLEXIBLE');

      expect(component.form.controls.listType.errors).toBeNull();
      expect(component.form.errors).toBeNull();
      expect(component.form.controls.tier.errors).toEqual({ required: true });
    });

    it('should stay valid when a list type is chosen without a tier being the blocker', () => {
      component.form.controls.tier.setValue('TIER_1');
      selectListType('TYPE_2_FLEXIBLE');

      expect(component.form.valid).toBe(true);
    });

    it('should add the required validator to keyReason only for the fixed date list type', () => {
      expect(component.form.controls.keyReason.hasValidator(Validators.required)).toBe(false);

      selectListType('TYPE_1_FIXED');

      expect(component.form.controls.keyReason.hasValidator(Validators.required)).toBe(true);
      expect(component.form.controls.keyReason.hasError('required')).toBe(true);
    });

    it('should remove the keyReason validator and clear its value when a different list type is chosen', () => {
      selectListType('TYPE_1_FIXED');
      component.form.controls.keyReason.setValue('Key witness unavailable');
      fixture.detectChanges();

      selectListType('TYPE_2_FLEXIBLE');

      expect(component.form.controls.keyReason.hasValidator(Validators.required)).toBe(false);
      expect(component.form.controls.keyReason.value).toBeNull();
      expect(component.form.controls.keyReason.valid).toBe(true);
    });

    it('should remove the keyReason validator and clear its value when the list type is cleared', () => {
      selectListType('TYPE_1_FIXED');
      component.form.controls.keyReason.setValue('Key witness unavailable');
      fixture.detectChanges();

      selectListType(null);

      expect(component.form.controls.keyReason.hasValidator(Validators.required)).toBe(false);
      expect(component.form.controls.keyReason.value).toBeNull();
    });

    it('should keep the form valid for the fixed date list type once a keyReason is given', () => {
      component.form.controls.tier.setValue('TIER_1');
      selectListType('TYPE_1_FIXED');
      component.form.controls.keyReason.setValue('Key witness unavailable');
      fixture.detectChanges();

      expect(component.form.valid).toBe(true);
    });
  });

  describe('fixedDateSelected', () => {
    it('should start hidden', () => {
      expect(component.fixedDateSelected()).toBe(false);
      expect(revealElement()).toBeNull();
    });

    it('should reveal the keyReason field when the fixed date list type is selected', () => {
      selectListType('TYPE_1_FIXED');

      expect(component.fixedDateSelected()).toBe(true);
      expect(revealElement()).not.toBeNull();
      expect(keyReasonElement()).not.toBeNull();
    });

    it('should hide the keyReason field when the flexible list type is selected', () => {
      selectListType('TYPE_1_FIXED');
      selectListType('TYPE_2_FLEXIBLE');

      expect(component.fixedDateSelected()).toBe(false);
      expect(revealElement()).toBeNull();
    });

    it('should hide the keyReason field when the list type is cleared', () => {
      selectListType('TYPE_1_FIXED');
      selectListType(null);

      expect(component.fixedDateSelected()).toBe(false);
      expect(revealElement()).toBeNull();
    });
  });

  describe('clearListTypeSelection', () => {
    it('should null the list type, clear the keyReason and drop its validator', () => {
      selectListType('TYPE_1_FIXED');
      component.form.controls.keyReason.setValue('Key witness unavailable');
      fixture.detectChanges();

      component.clearListTypeSelection();
      fixture.detectChanges();

      expect(component.form.controls.listType.value).toBeNull();
      expect(component.form.controls.keyReason.value).toBeNull();
      expect(component.form.controls.keyReason.hasValidator(Validators.required)).toBe(false);
      expect(component.fixedDateSelected()).toBe(false);
    });

    it('should be triggered from the clear link without navigating', () => {
      selectListType('TYPE_1_FIXED');
      const event = new MouseEvent('click', { cancelable: true });

      clearLink().triggerEventHandler('click', event);
      fixture.detectChanges();

      expect(component.form.controls.listType.value).toBeNull();
      expect(event.defaultPrevented).toBe(true);
    });

    it('should leave the tier selection alone', () => {
      component.form.controls.tier.setValue('TIER_4');
      selectListType('TYPE_1_FIXED');

      component.clearListTypeSelection();
      fixture.detectChanges();

      expect(component.form.controls.tier.value).toBe('TIER_4');
    });
  });

  describe('ptphDetail input', () => {
    it('should not touch the form when no detail is supplied', () => {
      expect(component.form.value).toEqual({ tier: null, listType: null, keyReason: null });
    });

    it('should seed the form from a saved record', () => {
      setPtphDetail({ tier: 'TIER_5', listType: 'TYPE_2_FLEXIBLE', finalised: false });

      expect(component.form.value).toEqual({
        tier: 'TIER_5',
        listType: 'TYPE_2_FLEXIBLE',
        keyReason: null
      });
    });

    it('should treat a blank record as an empty form', () => {
      setPtphDetail({ finalised: false });

      expect(component.form.value).toEqual({ tier: null, listType: null, keyReason: null });
    });

    it('should open the reveal and attach the keyReason validator when seeding a fixed date record', () => {
      setPtphDetail({
        tier: 'TIER_1',
        listType: 'TYPE_1_FIXED',
        keyReason: 'Key witness unavailable',
        finalised: false
      });

      expect(component.fixedDateSelected()).toBe(true);
      expect(revealElement()).not.toBeNull();
      expect(component.form.controls.keyReason.hasValidator(Validators.required)).toBe(true);
      expect(component.form.controls.keyReason.value).toBe('Key witness unavailable');
      expect(component.form.valid).toBe(true);
    });

    it('should reseed the form when a new record arrives', () => {
      setPtphDetail({
        tier: 'TIER_1',
        listType: 'TYPE_1_FIXED',
        keyReason: 'First',
        finalised: false
      });
      setPtphDetail({ tier: 'TIER_6', finalised: false });

      expect(component.form.controls.tier.value).toBe('TIER_6');
      expect(component.form.controls.listType.value).toBeNull();
      expect(component.fixedDateSelected()).toBe(false);
    });
  });

  describe('onValidSubmit', () => {
    it('should emit a payload carrying the hearingId and tier only', () => {
      component.form.controls.tier.setValue('TIER_1');

      component.onValidSubmit();

      expect(savedPayloads).toEqual([{ hearingId: HEARING_ID, tier: 'TIER_1' }]);
      expect(Object.keys(savedPayloads[0]).sort()).toEqual(['hearingId', 'tier']);
    });

    it('should include the list type when one is selected', () => {
      component.form.controls.tier.setValue('TIER_1');
      selectListType('TYPE_2_FLEXIBLE');

      component.onValidSubmit();

      expect(savedPayloads[0]).toEqual({
        hearingId: HEARING_ID,
        tier: 'TIER_1',
        listType: 'TYPE_2_FLEXIBLE'
      });
    });

    it('should omit keyReason for the flexible list type even when the control still holds a value', () => {
      component.form.controls.tier.setValue('TIER_1');
      selectListType('TYPE_2_FLEXIBLE');
      component.form.controls.keyReason.setValue('Left over');
      fixture.detectChanges();

      component.onValidSubmit();

      expect('keyReason' in savedPayloads[0]).toBe(false);
    });

    it('should trim the keyReason for the fixed date list type', () => {
      component.form.controls.tier.setValue('TIER_1');
      selectListType('TYPE_1_FIXED');
      component.form.controls.keyReason.setValue('   Key witness unavailable   ');
      fixture.detectChanges();

      component.onValidSubmit();

      expect(savedPayloads[0]).toEqual({
        hearingId: HEARING_ID,
        tier: 'TIER_1',
        listType: 'TYPE_1_FIXED',
        keyReason: 'Key witness unavailable'
      });
    });

    it('should omit an empty keyReason for the fixed date list type', () => {
      component.form.controls.tier.setValue('TIER_1');
      selectListType('TYPE_1_FIXED');
      component.form.controls.keyReason.setValue('');
      fixture.detectChanges();

      component.onValidSubmit();

      expect('keyReason' in savedPayloads[0]).toBe(false);
    });
  });

  describe('form submission', () => {
    it('should emit save and clear errors when the form is valid', () => {
      component.form.controls.tier.setValue('TIER_2');
      fixture.detectChanges();

      submit();

      expect(savedPayloads).toEqual([{ hearingId: HEARING_ID, tier: 'TIER_2' }]);
      expect(emittedErrors).toEqual([null]);
    });

    it('should not emit save and should emit errors when the tier is missing', () => {
      submit();

      expect(savedPayloads).toEqual([]);
      expect(emittedErrors.length).toBe(1);
      expect(emittedErrors[0]?.length).toBe(1);
    });

    it('should not emit save when the fixed date list type has no keyReason', () => {
      component.form.controls.tier.setValue('TIER_1');
      selectListType('TYPE_1_FIXED');

      submit();

      expect(savedPayloads).toEqual([]);
      expect(emittedErrors[0]).not.toBeNull();
    });

    it('should emit save when the fixed date list type has a keyReason', () => {
      component.form.controls.tier.setValue('TIER_1');
      selectListType('TYPE_1_FIXED');
      component.form.controls.keyReason.setValue('Key witness unavailable');
      fixture.detectChanges();

      submit();

      expect(savedPayloads).toEqual([
        {
          hearingId: HEARING_ID,
          tier: 'TIER_1',
          listType: 'TYPE_1_FIXED',
          keyReason: 'Key witness unavailable'
        }
      ]);
    });

    it('should emit save when a list type is left unselected', () => {
      component.form.controls.tier.setValue('TIER_7');
      fixture.detectChanges();

      submit();

      expect(savedPayloads).toEqual([{ hearingId: HEARING_ID, tier: 'TIER_7' }]);
    });
  });

  describe('cancel', () => {
    it('should emit cancel when the cancel link is activated', () => {
      cancelLink().triggerEventHandler('click', new MouseEvent('click', { cancelable: true }));

      expect(cancelEvents.length).toBe(1);
    });
  });
});
