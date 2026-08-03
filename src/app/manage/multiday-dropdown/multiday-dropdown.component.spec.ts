import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync } from '@angular/core/testing';
import { MultiDayDropDownComponent } from './multiday-dropdown.component';
import { provideTranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

describe('MultiDayDropDownComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService()],
      imports: [TestHostComponent],
      teardown: { destroyAfterEach: false }
    }).compileComponents();
  }));

  beforeEach(fakeAsync(() => {
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  }));

  it('should render the template with the values expected', () => {
    expect(fixture).toMatchSnapshot();
  });
});

@Component({
  template: `
    <form #form="ngForm" pdk-form novalidate>
      <multiday-dropdown [days]="days" [selectedDay]="'2018-01-02'" (onSelectDay)="(changeDate)">
      </multiday-dropdown>
    </form>
  `,
  imports: [MultiDayDropDownComponent, FormsModule]
})
class TestHostComponent {
  days = [{ sittingDay: '2018-01-01' }, { sittingDay: '2018-01-02' }, { sittingDay: '2018-01-03' }];

  changeDate() {}
}
