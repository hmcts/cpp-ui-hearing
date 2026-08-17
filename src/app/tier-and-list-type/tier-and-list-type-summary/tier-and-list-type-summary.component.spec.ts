import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideTranslateService } from '@ngx-translate/core';
import { TierAndListTypeSummaryComponent } from './tier-and-list-type-summary.component';

describe('TierAndListTypeSummaryComponent', () => {
  let component: TierAndListTypeSummaryComponent;
  let fixture: ComponentFixture<TierAndListTypeSummaryComponent>;

  const query = (role: string) => fixture.debugElement.query(By.css(`[data-role="${role}"]`));

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [TierAndListTypeSummaryComponent],
      providers: [provideTranslateService()],
      teardown: { destroyAfterEach: false }
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TierAndListTypeSummaryComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('renders a tier saved without a list type', () => {
    component.tierAndListType = { tier: 'TIER_5' };
    fixture.detectChanges();

    expect(component.tierLabelKey).toEqual('TIER_AND_LIST_TYPE.TIER_5');
    expect(component.listTypeLabelKey).toBeUndefined();
    expect(fixture.nativeElement).toMatchSnapshot();
  });

  it('renders a tier 2 decision with its subcategory', () => {
    component.tierAndListType = {
      tier: 'TIER_2',
      tier2Subcategory: 'WITNESS_FROM_ABROAD'
    };
    fixture.detectChanges();

    expect(component.tier2SubcategoryLabelKey).toEqual(
      'TIER_AND_LIST_TYPE.TIER_2_WITNESS_FROM_ABROAD'
    );
    expect(query('summary-tier-2-subcategory')).toBeTruthy();
  });

  it('does not show a subcategory for tiers other than 2', () => {
    component.tierAndListType = {
      tier: 'TIER_3',
      tier2Subcategory: 'WITNESS_FROM_ABROAD'
    };
    fixture.detectChanges();

    expect(component.tier2SubcategoryLabelKey).toBeNull();
    expect(query('summary-tier-2-subcategory')).toBeNull();
  });

  it('shows the fixed date reason for a type 1 list type', () => {
    component.tierAndListType = {
      tier: 'TIER_1',
      listType: 'TYPE_1',
      fixedDateReason: 'Witness only available in June'
    };
    fixture.detectChanges();

    expect(component.showFixedDateReason).toBe(true);
    expect(query('summary-fixed-date-reason').nativeElement.textContent).toContain(
      'Witness only available in June'
    );
  });

  it('does not show a fixed date reason for a type 2 list type', () => {
    component.tierAndListType = { tier: 'TIER_1', listType: 'TYPE_2' };
    fixture.detectChanges();

    expect(component.showFixedDateReason).toBe(false);
    expect(query('summary-fixed-date-reason')).toBeNull();
  });

  it('emits when the clerk chooses to change the decision', () => {
    component.tierAndListType = { tier: 'TIER_1' };
    fixture.detectChanges();
    const changeSelection = jest.fn();
    component.changeSelection.subscribe(changeSelection);

    query('change-tier-and-list-type').nativeElement.click();

    expect(changeSelection).toHaveBeenCalled();
  });
});
