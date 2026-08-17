import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { provideTranslateService } from '@ngx-translate/core';
import { TierAndListTypeFormComponent } from './tier-and-list-type-form.component';

describe('TierAndListTypeFormComponent', () => {
  let component: TierAndListTypeFormComponent;
  let fixture: ComponentFixture<TierAndListTypeFormComponent>;

  const query = (role: string) => fixture.debugElement.query(By.css(`[data-role="${role}"]`));
  const queryAll = (role: string) => fixture.debugElement.queryAll(By.css(`[data-role="${role}"]`));

  /**
   * Conditionally revealed controls register with NgForm on a microtask, so every
   * interaction has to settle before the form's validity reflects it.
   */
  const settle = () => {
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
  };

  const selectRadio = (role: string, index: number) => {
    queryAll(role)[index].query(By.css('input')).nativeElement.click();
    settle();
  };

  const setTextarea = (role: string, value: string) => {
    const textarea = query(role).nativeElement;
    textarea.value = value;
    textarea.dispatchEvent(new Event('input'));
    settle();
  };

  const submit = () => {
    fixture.debugElement.query(By.css('form')).nativeElement.dispatchEvent(new Event('submit'));
    settle();
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [TierAndListTypeFormComponent, FormsModule],
      providers: [provideTranslateService()],
      teardown: { destroyAfterEach: false }
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TierAndListTypeFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('presents the seven tiers as radio buttons', () => {
    expect(queryAll('tier-option').length).toEqual(7);
  });

  it('presents both list types as radio buttons', () => {
    expect(queryAll('list-type-option').length).toEqual(2);
  });

  it('renders the entry screen', () => {
    expect(fixture.nativeElement).toMatchSnapshot();
  });

  describe('tier 2 subcategories', () => {
    it('are hidden until tier 2 is selected', () => {
      expect(queryAll('tier-2-subcategory-option').length).toEqual(0);
    });

    it('reveals six subcategories when tier 2 is selected', fakeAsync(() => {
      selectRadio('tier-option', 1);

      expect(component.tier).toEqual('TIER_2');
      expect(queryAll('tier-2-subcategory-option').length).toEqual(6);
    }));

    it('are hidden again when another tier is selected', fakeAsync(() => {
      selectRadio('tier-option', 1);
      selectRadio('tier-option', 0);

      expect(queryAll('tier-2-subcategory-option').length).toEqual(0);
      expect(component.tier2Subcategory).toBeNull();
    }));

    it('blocks submission until a subcategory is chosen', fakeAsync(() => {
      const formSubmit = jest.fn();
      component.formSubmit.subscribe(formSubmit);

      selectRadio('tier-option', 1);
      submit();

      expect(formSubmit).not.toHaveBeenCalled();
    }));

    it('submits the chosen subcategory alongside the tier', fakeAsync(() => {
      const formSubmit = jest.fn();
      component.formSubmit.subscribe(formSubmit);

      selectRadio('tier-option', 1);
      selectRadio('tier-2-subcategory-option', 3);
      submit();

      expect(formSubmit).toHaveBeenCalledWith({
        tier: 'TIER_2',
        tier2Subcategory: 'WITNESS_FROM_ABROAD',
        listType: undefined,
        fixedDateReason: undefined
      });
    }));
  });

  describe('list type', () => {
    it('is optional — a tier on its own can be saved', fakeAsync(() => {
      const formSubmit = jest.fn();
      component.formSubmit.subscribe(formSubmit);

      selectRadio('tier-option', 2);
      submit();

      expect(formSubmit).toHaveBeenCalledWith({
        tier: 'TIER_3',
        tier2Subcategory: undefined,
        listType: undefined,
        fixedDateReason: undefined
      });
    }));

    it('reveals the fixed date reason when type 1 is selected', fakeAsync(() => {
      selectRadio('list-type-option', 0);

      expect(query('fixed-date-reason')).toBeTruthy();
    }));

    it('does not reveal the fixed date reason when type 2 is selected', fakeAsync(() => {
      selectRadio('list-type-option', 1);

      expect(query('fixed-date-reason')).toBeNull();
    }));

    it('blocks submission when type 1 is selected with an empty reason', fakeAsync(() => {
      const formSubmit = jest.fn();
      component.formSubmit.subscribe(formSubmit);

      selectRadio('tier-option', 0);
      selectRadio('list-type-option', 0);
      submit();

      expect(formSubmit).not.toHaveBeenCalled();
    }));

    it('blocks submission when the reason is only whitespace', fakeAsync(() => {
      const formSubmit = jest.fn();
      component.formSubmit.subscribe(formSubmit);

      selectRadio('tier-option', 0);
      selectRadio('list-type-option', 0);
      setTextarea('fixed-date-reason', '   ');
      submit();

      expect(formSubmit).not.toHaveBeenCalled();
    }));

    it('submits the trimmed reason with type 1', fakeAsync(() => {
      const formSubmit = jest.fn();
      component.formSubmit.subscribe(formSubmit);

      selectRadio('tier-option', 0);
      selectRadio('list-type-option', 0);
      setTextarea('fixed-date-reason', '  Witness only available in June  ');
      submit();

      expect(formSubmit).toHaveBeenCalledWith({
        tier: 'TIER_1',
        tier2Subcategory: undefined,
        listType: 'TYPE_1',
        fixedDateReason: 'Witness only available in June'
      });
    }));

    it('drops the reason when the list type changes to type 2', fakeAsync(() => {
      selectRadio('list-type-option', 0);
      setTextarea('fixed-date-reason', 'Witness only available in June');
      selectRadio('list-type-option', 1);

      expect(component.fixedDateReason).toEqual('');
    }));

    it('clears both the list type and the reason', fakeAsync(() => {
      selectRadio('list-type-option', 0);
      setTextarea('fixed-date-reason', 'Witness only available in June');

      query('clear-list-type').nativeElement.click();
      settle();

      expect(component.listType).toBeNull();
      expect(component.fixedDateReason).toEqual('');
      expect(query('fixed-date-reason')).toBeNull();
    }));
  });

  describe('validation errors', () => {
    it('emits an error when no tier is selected', fakeAsync(() => {
      const errors = jest.fn();
      component.errors.subscribe(errors);

      submit();

      expect(errors).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ id: expect.any(String) })])
      );
    }));
  });

  describe('a saved decision', () => {
    it('pre-populates the form', fakeAsync(() => {
      component.tierAndListType = {
        tier: 'TIER_2',
        tier2Subcategory: 'ESTIMATE_EXCEEDS_5_DAYS',
        listType: 'TYPE_1',
        fixedDateReason: 'Expert unavailable until the autumn'
      };
      settle();

      expect(component.tier).toEqual('TIER_2');
      expect(component.tier2Subcategory).toEqual('ESTIMATE_EXCEEDS_5_DAYS');
      expect(component.listType).toEqual('TYPE_1');
      expect(component.fixedDateReason).toEqual('Expert unavailable until the autumn');
      expect(queryAll('tier-2-subcategory-option').length).toEqual(6);
      expect(query('fixed-date-reason')).toBeTruthy();
    }));

    it('resets to empty when cleared', fakeAsync(() => {
      component.tierAndListType = null;
      settle();

      expect(component.tier).toBeNull();
      expect(component.tier2Subcategory).toBeNull();
      expect(component.listType).toBeNull();
      expect(component.fixedDateReason).toEqual('');
    }));
  });
});
