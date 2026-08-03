import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { DelegatedPowersComponent } from './delegated-powers.component';
import { provideTranslateService } from '@ngx-translate/core';

@Component({
  template: `<delegated-powers></delegated-powers>`,
  imports: [DelegatedPowersComponent]
})
class TestHostComponent {}

describe('DelegatedPowersComponent', () => {
  let component: DelegatedPowersComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService()],
      imports: [TestHostComponent],
      teardown: { destroyAfterEach: false }
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.debugElement.children[0].componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the template with the values expected', () => {
    expect(fixture).toMatchSnapshot();
  });

  it('should set selectedOption to POWERS_ON when delegatedPowers has a value', () => {
    component.delegatedPowers = 'some-value';
    expect(component.selectedOption).toBe('POWERS_ON');
  });

  it('should set selectedOption to POWERS_OFF when delegatedPowers is falsy', () => {
    component.delegatedPowers = '';
    expect(component.selectedOption).toBe('POWERS_OFF');
  });

  it('should emit true when onChanges is called with POWERS_ON', () => {
    const emitSpy = jest.spyOn(component.delegatedPowersChange, 'emit');
    component.onChanges('POWERS_ON');
    expect(emitSpy).toHaveBeenCalledWith(true);
  });

  it('should emit false when onChanges is called with POWERS_OFF', () => {
    const emitSpy = jest.spyOn(component.delegatedPowersChange, 'emit');
    component.onChanges('POWERS_OFF');
    expect(emitSpy).toHaveBeenCalledWith(false);
  });

  it('should unsubscribe on destroy', () => {
    const unsubscribeSpy = jest.spyOn(component.translateSubscription, 'unsubscribe');
    component.ngOnDestroy();
    expect(unsubscribeSpy).toHaveBeenCalled();
  });
});
