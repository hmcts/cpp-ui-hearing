import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { HearingListFilterSummaryComponent } from './hearing-list-filter-summary.component';

describe('HearingListFilterSummaryComponent', () => {
  let component: HearingListFilterSummaryComponent;
  let fixture: ComponentFixture<HearingListFilterSummaryComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService()],
      teardown: { destroyAfterEach: false }
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HearingListFilterSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the template with the values expected', () => {
    expect(fixture).toMatchSnapshot();
  });
});
