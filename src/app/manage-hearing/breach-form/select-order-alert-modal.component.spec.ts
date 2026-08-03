import { Component } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ModalModule } from 'ngx-bootstrap/modal';
import { SelectOrderModalComponent } from './select-order-alert-modal.component';
import { provideTranslateService } from '@ngx-translate/core';

describe('SelectOrderModalComponent', () => {
  let component: SelectOrderModalComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService()],
      imports: [ModalModule.forRoot()],
      teardown: { destroyAfterEach: false }
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.debugElement.children[0].componentInstance;
    fixture.detectChanges();
  });

  it('should render the component', () => {
    expect(fixture).toMatchSnapshot();
  });

  describe('#onDismiss', () => {
    it('should emit onDismiss event when alert is closed', () => {
      jest.spyOn(component.onDismiss, 'emit');
      const continueButton = fixture.debugElement.query(By.css('button'));
      continueButton.nativeElement.click();
      fixture.detectChanges();

      expect(component.onDismiss.emit).toHaveBeenCalled();
    });
  });
});

@Component({
  template: ` <select-order-alert (onDismiss)="dismissShowCaseOrderAlert()"></select-order-alert> `,
  imports: [SelectOrderModalComponent]
})
class TestHostComponent {
  dismissShowCaseOrderAlert() {}
}
