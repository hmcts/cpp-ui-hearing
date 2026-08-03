import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { provideTranslateService } from '@ngx-translate/core';
import { Defendant, Offence, PleaOption } from '../../../../core';

import { PleaOptionsComponent } from '../plea-options.component';
import { mockDefendant } from '../../../../../app/mock-data/test-mock-data';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';

describe('PleaOptionComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: TestHostComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CommonModule],
      providers: [provideTranslateService(), provideRouter([])],
      teardown: { destroyAfterEach: false }
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
  });

  it('should render the template with the values expected', () => {
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });

  describe('template conditional rendering for magsPleaOnlyOptions', () => {
    it('should render additional mags pleas when hasCivilCase is false and magsPleaOnlyOptions has items', () => {
      component.hasCivilCase = false;
      component.magsPleaOnlyOptions = [
        { label: 'Consents', value: 'CONSENTS' },
        { label: 'Denies', value: 'DENIES' }
      ];

      fixture.detectChanges();

      const magsDetails = fixture.debugElement.query(
        By.css('[data-test-id="additional-mags-pleas"]')
      );
      expect(magsDetails).toBeTruthy();
    });

    it('should NOT render additional mags pleas when hasCivilCase is true', () => {
      component.hasCivilCase = true;
      component.magsPleaOnlyOptions = [{ label: 'Consents', value: 'CONSENTS' }];

      fixture.detectChanges();

      const magsDetails = fixture.debugElement.query(
        By.css('[data-test-id="additional-mags-pleas"]')
      );
      expect(magsDetails).toBeFalsy();
    });

    it('should NOT render additional mags pleas when magsPleaOnlyOptions is empty', () => {
      component.hasCivilCase = false;
      component.magsPleaOnlyOptions = [];

      fixture.detectChanges();

      const magsDetails = fixture.debugElement.query(
        By.css('[data-test-id="additional-mags-pleas"]')
      );
      expect(magsDetails).toBeFalsy();
    });

    it('should render crown pleas when hearingType is CROWN regardless of hasCivilCase', () => {
      component.hearingType = 'CROWN';
      component.hasCivilCase = true;
      component.crownPleaOnlyOptions = [{ label: 'Opposed', value: 'OPPOSED' }];

      fixture.detectChanges();

      const crownDetails = fixture.debugElement.query(By.css('#additional-crown-pleas'));
      expect(crownDetails).toBeTruthy();
    });

    it('should NOT render crown pleas when hearingType is not CROWN', () => {
      component.hearingType = 'MAGS';
      component.crownPleaOnlyOptions = [{ label: 'Opposed', value: 'OPPOSED' }];

      fixture.detectChanges();

      const crownDetails = fixture.debugElement.query(By.css('#additional-crown-pleas'));
      expect(crownDetails).toBeFalsy();
    });
  });
});

@Component({
  selector: 'test-host-component',
  template: `
    <plea-options
      [label]="'Enter plea'"
      [offence]="offence"
      [standardPleaOptions]="pleaOptions"
      [defendant]="defendant"
      [hasCivilCase]="hasCivilCase"
      [magsPleaOnlyOptions]="magsPleaOnlyOptions"
      [crownPleaOnlyOptions]="crownPleaOnlyOptions"
      [hearingType]="hearingType"
    >
    </plea-options>
  `,
  imports: [PleaOptionsComponent]
})
class TestHostComponent {
  @Input() label = 'Plea';
  @Input() pleaOptions: PleaOption[] = [
    { label: 'Guilty', value: 'GUILTY' },
    { label: 'Indicated plea of Guilty', value: 'INDICATED_GUILTY' },
    { label: 'Not Guilty', value: 'NOT_GUILTY' }
  ];
  @Input() offence: Offence = {
    id: 'e1d32d9d-29ec-4934-a932-22a50f223966',
    offenceTitle: 'Test Offence',
    plea: { pleaValue: undefined }
  } as Offence;
  @Input() defaultPleaValue = 'NOT_GUILTY';
  @Input() defendant: Defendant = mockDefendant;
  @Input() hasCivilCase = false;

  magsPleaOnlyOptions: PleaOption[] = [];
  crownPleaOnlyOptions: PleaOption[] = [];
  hearingType = '';
}
