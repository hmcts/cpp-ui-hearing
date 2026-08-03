import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { CheckInNoHearingsAvailableComponent } from './check-in-no-hearings-available.component';

describe('CheckInNoHearingsAvailableComponent', () => {
  let fixture: ComponentFixture<CheckInNoHearingsAvailableComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService()],
      imports: [CheckInNoHearingsAvailableComponent],
      teardown: { destroyAfterEach: false }
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckInNoHearingsAvailableComponent);
    fixture.detectChanges();
  });

  it('should match the snapshot', () => {
    expect(fixture).toMatchSnapshot();
  });
});
