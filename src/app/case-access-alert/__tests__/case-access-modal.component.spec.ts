import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ModalModule } from 'ngx-bootstrap/modal';
import { CaseAccessModalComponent } from '../case-access-modal.component';
import { provideTranslateService } from '@ngx-translate/core';

describe('CaseAccessModalComponent', () => {
  let component: CaseAccessModalComponent;
  let fixture: ComponentFixture<CaseAccessModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ModalModule.forRoot(), CaseAccessModalComponent],
      providers: [provideTranslateService()],
      teardown: { destroyAfterEach: false }
    });

    fixture = TestBed.createComponent(CaseAccessModalComponent);
    component = fixture.componentInstance;
    component.urns = ['URN1', 'URN2'];
    component.show = true;
  });

  it('should render the component', () => {
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });

  it('should submit the form', async () => {
    const onSubmitSpy = jest.fn();
    component.onSubmit.subscribe(onSubmitSpy);

    fixture.detectChanges();
    await fixture.whenStable();

    fixture.debugElement.query(By.css('input[value=true]')).nativeElement.click();
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.debugElement.query(By.css('button[type=submit]')).nativeElement.click();
    expect(onSubmitSpy).toHaveBeenCalledWith(true);
  });

  it('should submit the form with hearing not running hearing option', async () => {
    const onSubmitSpy = jest.fn();
    component.onSubmit.subscribe(onSubmitSpy);

    fixture.detectChanges();
    await fixture.whenStable();

    fixture.debugElement.query(By.css('input[value=false]')).nativeElement.click();
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.debugElement.query(By.css('button[type=submit]')).nativeElement.click();
    expect(onSubmitSpy).toHaveBeenCalledWith(false);
  });

  it('should cancel modal', async () => {
    const onCancelSpy = jest.fn();
    component.onCancel.subscribe(onCancelSpy);

    fixture.detectChanges();

    fixture.debugElement.query(By.css('a')).nativeElement.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(onCancelSpy).toHaveBeenCalled();
  });
});
