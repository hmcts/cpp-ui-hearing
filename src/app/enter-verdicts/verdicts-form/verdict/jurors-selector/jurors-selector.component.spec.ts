import { Component } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { JurorsSelectorComponent } from './jurors-selector.component';
import { keys } from 'lodash-es';

const mockPleas = require('../../../mock-data/mock-pleas.json');

let mockValue: any;
const offenceDefinitionId = keys(mockPleas[0].defendantsByOffence)[0];
const mockOffence = mockPleas[0].defendantsByOffence[offenceDefinitionId].defendants[0].offences[0];

describe('JurorsSelectorComponent', () => {
  let component: JurorsSelectorComponent;
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
    component = fixture.debugElement.children[0].componentInstance;
    fixture.detectChanges();
  }));

  it('should render the template with the values expected', () => {
    expect(fixture).toMatchSnapshot();
  });

  it('should fire an event when click on apply', fakeAsync(() => {
    component.isEditMode = true;
    component.toggleEditMode();
    tick();
    expect(component.isEditMode).toBeFalsy();
    expect(mockValue).toEqual(mockOffence);
  }));

  it('should set numberOfJurors', () => {
    component.selectNumberOfJurors(11);
    expect(component.offenceCopy.verdict.jurors.numberOfJurors).toEqual(11);
  });

  it('should set numberOfSplitJurors', () => {
    component.selectSplit(10);
    expect(component.offenceCopy.verdict.jurors.numberOfSplitJurors).toEqual(10);
  });
});

@Component({
  template: `
    <jurors-selector [offence]="offence" (changed)="onChange($event)"></jurors-selector>
  `,
  imports: [JurorsSelectorComponent]
})
class TestHostComponent {
  offence = mockOffence;

  onChange($event: any) {
    mockValue = $event;
  }
}
