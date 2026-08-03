import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FormsModule } from '@angular/forms';
import { ChangeHearingTypeComponent } from './change-hearing-type.component';
import { provideTranslateService } from '@ngx-translate/core';
import { By } from '@angular/platform-browser';

describe('ChangeHearingTypeComponent', () => {
  let component: ChangeHearingTypeComponent;
  let fixture: ComponentFixture<ChangeHearingTypeComponent>;

  const hearingTypes = [
    {
      id: '1',
      seqId: 1,
      hearingCode: '1',
      hearingDescription: 'Plea',
      welshHearingDescription: 'a',
      defaultDurationMin: 1
    },
    {
      id: '2',
      seqId: 2,
      hearingCode: '2',
      hearingDescription: 'Plea and Trial',
      welshHearingDescription: 'a',
      defaultDurationMin: 1
    }
  ];

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService()],
      imports: [FormsModule],
      teardown: { destroyAfterEach: false }
    }).compileComponents();

    fixture = TestBed.createComponent(ChangeHearingTypeComponent);
    component = fixture.componentInstance;
    component.hearingTypes = hearingTypes;
    fixture.detectChanges();
  }));

  it('should render correctly', () => {
    expect(fixture).toMatchSnapshot();
  });

  it('should emit hearingTypeSelected on submit', () => {
    const spyHearingTypeSelected = jest.spyOn(component.onChangeHearingType, 'emit');
    fixture.debugElement
      .query(By.css('hearing-type-selector'))
      .componentInstance.hearingTypeSelected.emit(hearingTypes[0]);
    expect(component.selectedHearingType).toEqual(hearingTypes[0]);
    component.submit();
    expect(spyHearingTypeSelected).toHaveBeenCalledTimes(1);
    expect(spyHearingTypeSelected).toHaveBeenCalledWith({
      eventNote: '',
      hearingType: hearingTypes[0]
    });
  });

  it('should emit cancel when cancel link is clicked', () => {
    const spyOnCancel = jest.spyOn(component.cancel, 'emit');
    component.back();
    expect(spyOnCancel).toHaveBeenCalledTimes(1);
    expect(spyOnCancel).toHaveBeenCalledWith(true);
  });
});
