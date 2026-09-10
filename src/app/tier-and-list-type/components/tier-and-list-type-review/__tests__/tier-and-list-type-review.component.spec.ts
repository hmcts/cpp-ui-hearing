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
  const summaryRows = () => fixture.debugElement.queryAll(By.css('div[pdk-summary-list-item]'));
  const foldableText = () => fixture.debugElement.query(By.css('pdk-foldable-text'));
  const foldableInstance = () =>
    foldableText().componentInstance as {
      lineClamp: number;
      ariaMoreLabel: string;
      ariaLessLabel: string;
    };

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

  describe('key reason', () => {
    const keyReasonLabel = () =>
      listTypeValueCell().query(By.css('[data-test-id="keyReasonLabel"]'));

    it('should sit inside the list type value cell rather than its own row', () => {
      render(notFinalised);

      expect(summaryRows().length).toBe(2);
      expect(keyReasonLabel()).not.toBeNull();
      expect(listTypeValueCell().query(By.css('pdk-foldable-text'))).not.toBeNull();
    });

    it('should read the label immediately before its value', () => {
      render(notFinalised);

      const text = listTypeValueCell().nativeElement.textContent;

      expect(text).toContain('TIER_AND_LIST_TYPE.KEY_REASON');
      expect(text.indexOf('TIER_AND_LIST_TYPE.KEY_REASON')).toBeLessThan(
        text.indexOf('Key witness unavailable')
      );
    });

    it('should read as one phrase ending in a colon', () => {
      render(notFinalised);

      expect(keyReasonLabel().nativeElement.textContent).toBe(
        'TIER_AND_LIST_TYPE.KEY_REASON TIER_AND_LIST_TYPE.KEY_REASON_CONTEXT:'
      );
    });

    it('should tell assistive technology what the key reason explains', () => {
      render(notFinalised);

      const hidden = keyReasonLabel().query(By.css('span[pdk-visually-hidden]'));

      expect(hidden.nativeElement.textContent.trim()).toBe('TIER_AND_LIST_TYPE.KEY_REASON_CONTEXT');
      expect(hidden.nativeElement.classList.contains('govuk-visually-hidden')).toBe(true);
    });

    it('should not use a heading or a nested list for the label', () => {
      render(notFinalised);

      expect(listTypeValueCell().queryAll(By.css('h1, h2, h3, h4, h5, h6')).length).toBe(0);
      expect(listTypeValueCell().query(By.css('dl'))).toBeNull();
      expect(listTypeValueCell().query(By.css('strong'))).toBeNull();
    });

    it('should fold the key reason to three lines', () => {
      render(notFinalised);

      expect(foldableInstance().lineClamp).toBe(3);
    });

    it('should give the fold toggle translated accessible labels', () => {
      render(notFinalised);

      expect(foldableInstance().ariaMoreLabel).toBe('TIER_AND_LIST_TYPE.KEY_REASON_SHOW_MORE');
      expect(foldableInstance().ariaLessLabel).toBe('TIER_AND_LIST_TYPE.KEY_REASON_SHOW_LESS');
    });

    it('should still show the key reason once finalised', () => {
      render(finalised);

      expect(keyReasonLabel()).not.toBeNull();
      expect(foldableText().nativeElement.textContent).toContain('Key witness unavailable');
    });

    it('should omit the key reason entirely when none is recorded', () => {
      render({ tier: 'TIER_1', listType: 'TYPE_2_FLEXIBLE', finalised: false });

      expect(keyReasonLabel()).toBeNull();
      expect(foldableText()).toBeNull();
    });

    it('should omit the key reason when it is an empty string', () => {
      render({ ...notFinalised, keyReason: '' });

      expect(keyReasonLabel()).toBeNull();
      expect(foldableText()).toBeNull();
    });
  });

  describe('accessible action link names', () => {
    const hiddenTextIn = (cell: { queryAll: Function }) =>
      cell
        .queryAll(By.css('span[pdk-visually-hidden]'))
        .map((span: { nativeElement: HTMLElement }) => span.nativeElement.textContent.trim());

    it('should qualify the tier change link with the field name', () => {
      render(notFinalised);

      expect(hiddenTextIn(tierActionCell())).toEqual(['TIER_AND_LIST_TYPE.TIER']);
    });

    it('should qualify the list type change link with the field name', () => {
      render(notFinalised);

      expect(hiddenTextIn(listTypeActionCell())).toEqual(['TIER_AND_LIST_TYPE.LIST_TYPE']);
    });

    it('should qualify the delete link with what it deletes', () => {
      render(finalised);

      expect(hiddenTextIn(tierActionCell())).toEqual(['TIER_AND_LIST_TYPE.REVIEW_HEADING']);
    });

    it('should hide the qualifiers visually via the govuk class', () => {
      render(notFinalised);

      const spans = fixture.debugElement.queryAll(
        By.css('dd[pdk-summary-list-action] span[pdk-visually-hidden]')
      );

      expect(spans.length).toBe(2);
      spans.forEach(span =>
        expect(span.nativeElement.classList.contains('govuk-visually-hidden')).toBe(true)
      );
    });
  });
});
