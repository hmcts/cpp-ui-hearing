import { ComponentFixture, TestBed, fakeAsync, waitForAsync } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { By } from '@angular/platform-browser';
import { AddDefenceWitnessComponent } from './add-defence-witness.component';
import { Component } from '@angular/core';

describe('AddDefenceWitnessComponent', () => {
  let component: AddDefenceWitnessComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  function clickBackButton() {
    fixture.debugElement.query(By.css('[data-role="witness-name-back"]')).nativeElement.click();
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService()],
      imports: [TestHostComponent],
      teardown: { destroyAfterEach: false }
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    component = fixture.debugElement.children[0].componentInstance;
  }));

  it('should render the template with the values expected', () => {
    expect(fixture).toMatchSnapshot();
  });

  it('should fire an event when clicking the back button', fakeAsync(() => {
    clickBackButton();

    expect(fixture.componentInstance.cancel).toHaveBeenCalledTimes(1);
  }));

  it('should fire an event when clicking the back button', fakeAsync(() => {
    component.witnessNameSelected();

    expect(fixture.componentInstance.witnessNameSelected).toHaveBeenCalledTimes(1);
  }));
});

@Component({
  selector: 'test-host-component',
  template: `
    <add-defence-witness
      (onCancel)="cancel($event)"
      (onWitnessNameSelected)="witnessNameSelected($event)"
    >
    </add-defence-witness>
  `,
  imports: [AddDefenceWitnessComponent]
})
class TestHostComponent {
  witnessName = 'Test Witness Name';

  cancel = jest.fn();
  witnessNameSelected = jest.fn();
}
