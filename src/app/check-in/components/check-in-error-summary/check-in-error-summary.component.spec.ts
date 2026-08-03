import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CheckInErrorSummaryComponent } from './check-in-error-summary.component';

describe('CheckInErrorSummaryComponent', () => {
  let fixture: ComponentFixture<CheckInErrorSummaryComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CheckInErrorSummaryComponent],
      teardown: { destroyAfterEach: false }
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckInErrorSummaryComponent);
    fixture.detectChanges();
  });

  it('should match the snapshot', () => {
    expect(fixture).toMatchSnapshot();
  });
});
