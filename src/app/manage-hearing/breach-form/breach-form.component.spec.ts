import { Component } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { ComponentFixture, fakeAsync, TestBed } from '@angular/core/testing';
import { BreachedApplication } from '../../core/model/breach-application';
import { BreachFormComponent } from './breach-form.component';
import { By } from '@angular/platform-browser';
import { applicationTypeMockOne, applicationTypeMockTwo } from '@cpp/reference-data';
import { mockCourtOrders, mockCourtOrderOne } from '../../mock-data/test-mock-data';
import { FormsModule } from '@angular/forms';

jest.mock('uuid/v4', () => () => 'id');
describe('BreachFormComponent', () => {
  let component: BreachFormComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService()],
      imports: [TestHostComponent, FormsModule],
      teardown: { destroyAfterEach: false }
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.debugElement.children[0].componentInstance;
    fixture.detectChanges();
  });

  beforeEach(() => {
    const activeOrderFormToggleCheck = fixture.debugElement.query(
      By.css('pdk-warning-text + [data-role="tick-input"] input')
    );
    activeOrderFormToggleCheck.nativeElement.click();
    fixture.detectChanges();
  });

  it('should render the template with the active orders form open', () => {
    expect(fixture).toMatchSnapshot();
  });

  describe('#onSubmit', () => {
    it('should emit breach form values', () => {
      jest.spyOn(component.onSubmit, 'emit');
      const breachToggleCheck = fixture.debugElement.queryAll(
        By.css('form [data-role="tick-input"]')
      );
      breachToggleCheck[0].query(By.css('input')).nativeElement.click();
      fixture.detectChanges();
      component.modelBreaches[0].breachType = applicationTypeMockOne;
      component.submitBreachForm();
      expect(component.onSubmit.emit).toHaveBeenCalledWith([
        {
          courtOrder: mockCourtOrderOne,
          applicationType: applicationTypeMockOne
        }
      ]);
    });
  });

  describe('breach form', () => {
    it('should show when checkbox is selected', () => {
      const breachToggleCheck = fixture.debugElement.queryAll(
        By.css('form [data-role="tick-input"]')
      );
      breachToggleCheck[0].query(By.css('input')).nativeElement.click();
      fixture.detectChanges();
      const insetText = fixture.debugElement.queryAll(By.css('pdk-inset-text'));

      expect(insetText.length).toBe(1);
      expect(insetText[0].nativeElement).toMatchSnapshot();
    });

    it('should show altert dialog when submit button is clicked for an empty form', () => {
      const submitBreachBtn = fixture.debugElement.query(By.css('button'));
      submitBreachBtn.nativeElement.click();
      fixture.detectChanges();
      const selectOrderAlert = fixture.debugElement.query(By.css('select-order-alert'));

      expect(selectOrderAlert.nativeElement).toMatchSnapshot();
    });

    it('should show typahead options when text is input that matches the court application `type`', () => {
      const breachToggleCheck = fixture.debugElement.queryAll(
        By.css('form [data-role="tick-input"]')
      );
      breachToggleCheck[0].query(By.css('input')).nativeElement.click();
      fixture.detectChanges();
      const autosuggestInput = fixture.debugElement.query(By.css('pdk-autosuggest-lite input'));
      autosuggestInput.nativeElement.value = 'A';
      autosuggestInput.nativeElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      const options = fixture.debugElement.queryAll(By.css('pdk-autosuggest-lite ul li'));
      expect(options.length).toBe(2);
    });

    it('should show typahead options when text is input that matches the court application `code`', () => {
      const breachToggleCheck = fixture.debugElement.queryAll(
        By.css('form [data-role="tick-input"]')
      );
      breachToggleCheck[0].query(By.css('input')).nativeElement.click();
      fixture.detectChanges();
      const autosuggestInput = fixture.debugElement.query(By.css('pdk-autosuggest-lite input'));
      autosuggestInput.nativeElement.value = 'CODE01';
      autosuggestInput.nativeElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      const options = fixture.debugElement.queryAll(By.css('pdk-autosuggest-lite ul li'));
      expect(options.length).toBe(1);
    });

    it('should show empty form when checkbox is selected, unselected and again selected', () => {
      const breachFormToggle = fixture.debugElement.query(
        By.css('[data-test-id="showActiveOrders"]')
      );
      const breachToggleCheck = fixture.debugElement.queryAll(
        By.css('form [data-role="tick-input"]')
      );
      // Open the breach for and fill it in
      breachToggleCheck[0].query(By.css('input')).nativeElement.click();
      fixture.detectChanges();
      const autosuggestInput = fixture.debugElement.query(By.css('pdk-autosuggest-lite input'));
      autosuggestInput.nativeElement.value = 'A';
      autosuggestInput.nativeElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      const insetTextPresent = fixture.debugElement.queryAll(By.css('pdk-inset-text'));
      expect(insetTextPresent[0]).toBeDefined();

      // Close the breach form
      breachFormToggle.query(By.css('input')).nativeElement.click();
      fixture.detectChanges();
      // Open the breach form again
      breachFormToggle.query(By.css('input')).nativeElement.click();
      fixture.detectChanges();

      const insetTextNoPresent = fixture.debugElement.queryAll(By.css('pdk-inset-text'));
      expect(insetTextNoPresent[0]).toBeUndefined();
    });

    describe('unpaid work warning', () => {
      it('should show warning when order is selected and has showUnpaidWorkWarning property set to true', () => {
        fixture.componentInstance.courtOrders[0].showUnpaidWorkWarning = true;
        fixture.detectChanges();

        const breachToggleCheck = fixture.debugElement.queryAll(
          By.css('form [data-role="tick-input"]')
        );
        breachToggleCheck[0].query(By.css('input')).nativeElement.click();
        fixture.detectChanges();

        const componentText = fixture.nativeElement.textContent;
        expect(componentText).toContain('ENTER_BREACHES.UNPAID_WORK_HOURS_COMPLETED');
      });

      it('should not show warning when order is selected but showUnpaidWorkWarning is false/null', () => {
        fixture.componentInstance.courtOrders[0].showUnpaidWorkWarning = null;
        fixture.detectChanges();

        const breachToggleCheck = fixture.debugElement.queryAll(
          By.css('form [data-role="tick-input"]')
        );
        breachToggleCheck[0].query(By.css('input')).nativeElement.click();
        fixture.detectChanges();

        const componentText = fixture.nativeElement.textContent;
        expect(componentText).not.toContain('ENTER_BREACHES.UNPAID_WORK_HOURS_COMPLETED');
      });

      it('should not show warning when order has showUnpaidWorkWarning true but is not selected', () => {
        fixture.componentInstance.courtOrders[0].showUnpaidWorkWarning = true;
        fixture.detectChanges();

        const componentText = fixture.nativeElement.textContent;
        expect(componentText).not.toContain('ENTER_BREACHES.UNPAID_WORK_HOURS_COMPLETED');
      });
    });
  });
});

@Component({
  template: `
    <breach-form
      [courtOrders]="courtOrders"
      [breachTypes]="breachTypes"
      (onSubmit)="onSubmit(breaches)"
    >
    </breach-form>
  `,
  imports: [BreachFormComponent]
})
class TestHostComponent {
  courtOrders = mockCourtOrders;
  breachTypes = [applicationTypeMockOne, applicationTypeMockTwo];
  onSubmit(breaches: BreachedApplication[]) {}
}
