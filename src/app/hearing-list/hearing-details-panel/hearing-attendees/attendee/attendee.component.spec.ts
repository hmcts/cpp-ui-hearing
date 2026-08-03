import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Component } from '@angular/core';
import { AttendeeComponent } from './attendee.component';

describe('AttendeeComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      teardown: { destroyAfterEach: false }
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  }));

  it('should render the template with the values expected', () => {
    expect(fixture).toMatchSnapshot();
  });
});

@Component({
  selector: 'test-host-component',
  template: ` <attendee [name]="name" [type]="type"> </attendee> `,
  imports: [AttendeeComponent]
})
class TestHostComponent {
  name = 'Fabio Tisci';
  type = 'Defence';
}
