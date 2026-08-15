import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { PtphDetail } from '../../../models/ptph-detail.model';
import { formRoute } from '../../../utils/tier-and-list-type.paths';
import { TierAndListTypeReviewComponent } from '../tier-and-list-type-review.component';

const HEARING_ID = 'hearing-1';
const FORM_ROUTE = formRoute(HEARING_ID);
const FORM_HREF = '/manage/hearing-1/tier-and-list-type/edit';

const notFinalised: PtphDetail = {
  tier: 'TIER_1',
  listType: 'TYPE_1_FIXED',
  keyReason: 'Key witness unavailable',
  finalised: false
};

const finalised: PtphDetail = { ...notFinalised, finalised: true };

describe('TierAndListTypeReviewComponent', () => {
  let fixture: ComponentFixture<TierAndListTypeReviewComponent>;
  let component: TierAndListTypeReviewComponent;
  let finaliseEvents: unknown[];
  let deleteEvents: unknown[];

  const actionCells = () => fixture.debugElement.queryAll(By.css('dd[pdk-summary-list-action]'));
  const valueCells = () => fixture.debugElement.queryAll(By.css('dd[pdk-summary-list-value]'));
  const tierActionCell = () => actionCells()[0];
  const listTypeActionCell = () => actionCells()[1];
  const tierValueCell = () => valueCells()[0];
  const listTypeValueCell = () => valueCells()[1];
  const finaliseButton = () => fixture.debugElement.query(By.css('button[pdk-button]'));
  const insetText = () => fixture.debugElement.query(By.css('pdk-inset-text'));
  const warningText = () => fixture.debugElement.query(By.css('pdk-warning-text'));
  const changeLinks = () =>
    fixture.debugElement
      .queryAll(By.css('dd[pdk-summary-list-action] a'))
      .filter(link => link.nativeElement.textContent.includes('TIER_AND_LIST_TYPE.CHANGE'));
  const deleteLink = () =>
    fixture.debugElement
      .queryAll(By.css('dd[pdk-summary-list-action] a'))
      .find(link => link.nativeElement.textContent.includes('TIER_AND_LIST_TYPE.DELETE'));

  const render = (detail: PtphDetail, canFinalise = false) => {
    fixture.componentRef.setInput('ptphDetail', detail);
    fixture.componentRef.setInput('canFinalise', canFinalise);
    fixture.detectChanges();
  };

  beforeEach(waitForAsync(() => {
    const finalises: unknown[] = [];
    const deletes: unknown[] = [];

    finaliseEvents = finalises;
    deleteEvents = deletes;

    TestBed.configureTestingModule({
      providers: [provideTranslateService(), provideRouter([])],
      teardown: { destroyAfterEach: false }
    }).compileComponents();

    jest.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    fixture = TestBed.createComponent(TierAndListTypeReviewComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('ptphDetail', notFinalised);
    fixture.componentRef.setInput('formRoute', FORM_ROUTE);

    component.finalise.subscribe(() => finalises.push(true));
    component.delete.subscribe(() => deletes.push(true));

    fixture.detectChanges();
  }));

  describe('rendering', () => {
    it('should render a record that is not finalised', () => {
      render(notFinalised);

      expect(fixture).toMatchSnapshot();
    });

    it('should render a record that can be finalised', () => {
      render(notFinalised, true);

      expect(fixture).toMatchSnapshot();
    });

    it('should render a finalised record', () => {
      render(finalised);

      expect(fixture).toMatchSnapshot();
    });

    it('should render the summary list keys', () => {
      const keys = fixture.debugElement.queryAll(By.css('dt[pdk-summary-list-key]'));

      expect(keys.map(key => key.nativeElement.textContent.trim())).toEqual([
        'TIER_AND_LIST_TYPE.TIER',
        'TIER_AND_LIST_TYPE.LIST_TYPE'
      ]);
    });
  });

  describe('when the record is not finalised', () => {
    beforeEach(() => render(notFinalised));

    it('should expose isFinalised as false', () => {
      expect(component.isFinalised()).toBe(false);
    });

    it('should show a change link in every row pointing at the form route', () => {
      expect(changeLinks().length).toBe(2);
      changeLinks().forEach(link =>
        expect(link.nativeElement.getAttribute('href')).toBe(FORM_HREF)
      );
    });

    it('should not show a delete link', () => {
      expect(deleteLink()).toBeUndefined();
    });

    it('should show the warning about not being able to change after finalisation', () => {
      expect(warningText()).not.toBeNull();
      expect(warningText().nativeElement.textContent).toContain(
        'TIER_AND_LIST_TYPE.NO_CHANGE_AFTER_FINALISATION'
      );
    });

    it('should show the finalise button', () => {
      expect(finaliseButton()).not.toBeNull();
      expect(finaliseButton().nativeElement.textContent).toContain('TIER_AND_LIST_TYPE.FINALISE');
    });
  });

  describe('when the record is finalised', () => {
    beforeEach(() => render(finalised));

    it('should expose isFinalised as true', () => {
      expect(component.isFinalised()).toBe(true);
    });

    it('should show the delete link in the tier row action cell', () => {
      expect(tierActionCell().nativeElement.textContent).toContain('TIER_AND_LIST_TYPE.DELETE');
      expect(deleteLink()).toBeDefined();
    });

    it('should leave the list type row action cell empty', () => {
      expect(listTypeActionCell().nativeElement.textContent.trim()).toBe('');
    });

    it('should not show any change links', () => {
      expect(changeLinks().length).toBe(0);
    });

    it('should not show the inset text, the warning or the finalise button', () => {
      expect(insetText()).toBeNull();
      expect(warningText()).toBeNull();
      expect(finaliseButton()).toBeNull();
    });
  });

  describe('finalise button', () => {
    it('should be disabled when the record cannot be finalised', () => {
      render(notFinalised, false);

      expect(finaliseButton().nativeElement.disabled).toBe(true);
    });

    it('should be enabled when the record can be finalised', () => {
      render(notFinalised, true);

      expect(finaliseButton().nativeElement.disabled).toBe(false);
    });

    it('should emit finalise when clicked', () => {
      render(notFinalised, true);

      finaliseButton().triggerEventHandler('click', new MouseEvent('click'));

      expect(finaliseEvents.length).toBe(1);
    });
  });

  describe('needed to finalise inset text', () => {
    it('should show when the record cannot be finalised', () => {
      render(notFinalised, false);

      expect(insetText()).not.toBeNull();
      expect(insetText().nativeElement.textContent).toContain(
        'TIER_AND_LIST_TYPE.NEEDED_TO_FINALISE'
      );
    });

    it('should be hidden when the record can be finalised', () => {
      render(notFinalised, true);

      expect(insetText()).toBeNull();
    });

    it('should not hide the warning text when the record can be finalised', () => {
      render(notFinalised, true);

      expect(warningText()).not.toBeNull();
    });
  });

  describe('delete link', () => {
    it('should emit delete without navigating', () => {
      render(finalised);
      const event = new MouseEvent('click', { cancelable: true });

      deleteLink()?.triggerEventHandler('click', event);

      expect(deleteEvents.length).toBe(1);
      expect(event.defaultPrevented).toBe(true);
    });
  });

  describe('tier row', () => {
    it('should render the tier label and description', () => {
      render({ tier: 'TIER_3', finalised: false });

      expect(tierValueCell().nativeElement.textContent).toContain(
        'TIER_AND_LIST_TYPE.TIER_3_LABEL'
      );
      expect(tierValueCell().nativeElement.textContent).toContain(
        'TIER_AND_LIST_TYPE.TIER_3_DESCRIPTION'
      );
    });

    it('should render the tier 2 intro plus all five bullet keys', () => {
      render({ tier: 'TIER_2', finalised: false });

      const bullets = tierValueCell().queryAll(By.css('li'));

      expect(tierValueCell().nativeElement.textContent).toContain(
        'TIER_AND_LIST_TYPE.TIER_2_INTRO'
      );
      expect(bullets.length).toBe(5);
      expect(bullets.map(bullet => bullet.nativeElement.textContent.trim())).toEqual([
        'TIER_AND_LIST_TYPE.TIER_2_BULLET_1',
        'TIER_AND_LIST_TYPE.TIER_2_BULLET_2',
        'TIER_AND_LIST_TYPE.TIER_2_BULLET_3',
        'TIER_AND_LIST_TYPE.TIER_2_BULLET_4',
        'TIER_AND_LIST_TYPE.TIER_2_BULLET_5'
      ]);
    });

    it('should not render a bullet list for tiers without bullet keys', () => {
      render({ tier: 'TIER_1', finalised: false });

      expect(tierValueCell().queryAll(By.css('li')).length).toBe(0);
    });

    it('should leave the value empty when no tier is recorded', () => {
      render({ finalised: false });

      expect(component.tierOption()).toBeUndefined();
      expect(tierValueCell().nativeElement.textContent.trim()).toBe('');
    });
  });

  describe('list type row', () => {
    it('should render the fixed date label and hint', () => {
      render({ tier: 'TIER_1', listType: 'TYPE_1_FIXED', finalised: false });

      expect(component.listTypeOption()?.labelKey).toBe('TIER_AND_LIST_TYPE.LIST_TYPE_1_LABEL');
      expect(component.listTypeOption()?.hintKey).toBe('TIER_AND_LIST_TYPE.LIST_TYPE_1_HINT');
      expect(listTypeValueCell().nativeElement.textContent).toContain(
        'TIER_AND_LIST_TYPE.LIST_TYPE_1_LABEL'
      );
      expect(listTypeValueCell().nativeElement.textContent).toContain(
        'TIER_AND_LIST_TYPE.LIST_TYPE_1_HINT'
      );
    });

    it('should render the flexible label and hint', () => {
      render({ tier: 'TIER_1', listType: 'TYPE_2_FLEXIBLE', finalised: false });

      expect(component.listTypeOption()?.labelKey).toBe('TIER_AND_LIST_TYPE.LIST_TYPE_2_LABEL');
      expect(component.listTypeOption()?.hintKey).toBe('TIER_AND_LIST_TYPE.LIST_TYPE_2_HINT');
      expect(listTypeValueCell().nativeElement.textContent).toContain(
        'TIER_AND_LIST_TYPE.LIST_TYPE_2_LABEL'
      );
    });

    it('should render the none selected key when no list type is recorded', () => {
      render({ tier: 'TIER_1', finalised: false });

      expect(component.listTypeOption()).toBeUndefined();
      expect(listTypeValueCell().nativeElement.textContent).toContain(
        'TIER_AND_LIST_TYPE.NONE_SELECTED'
      );
    });
  });
});
