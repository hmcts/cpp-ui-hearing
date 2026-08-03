import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { By } from '@angular/platform-browser';
import { find } from 'lodash-es';
import { getParsedResultDefinitionByShortCode } from '../../../../core/testing';
import { PromptChoice } from '../../../../results.interfaces';
import { FixedListInputComponent } from '../fixed-list-input.component';
import { PromptChoiceValidatorDirective } from '../../prompt-choice-validator.directive';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

describe('FixedListInputComponent', () => {
  let fixture: ComponentFixture<FixedListInputTestComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FixedListInputTestComponent],
      teardown: { destroyAfterEach: false }
    });

    fixture = TestBed.createComponent(FixedListInputTestComponent);
  });

  describe('FIXL prompt choice', () => {
    beforeEach(() => {
      const { promptChoices } = getParsedResultDefinitionByShortCode('RI');
      const promptChoice = find(promptChoices, { promptRef: 'remandBasis' });

      fixture.componentInstance.promptChoice = promptChoice;
      fixture.componentInstance.limit = 1;
    });

    it('should render', () => {
      fixture.detectChanges();
      expect(fixture).toMatchSnapshot();
    });

    it('should capture an ngModelChange event', () => {
      fixture.detectChanges();

      const selectRef = fixture.debugElement.query(By.css('select')).nativeElement;
      selectRef.value = selectRef.options[1].value;
      selectRef.dispatchEvent(new Event('change'));

      expect(fixture.componentInstance.onChange).toHaveBeenCalledWith(
        'Charged with a violent or sexual offence'
      );
    });

    it('should populate an existing value', async () => {
      fixture.componentInstance.value = 'Charged with a violent or sexual offence';
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();

      const selectRef = fixture.debugElement.query(By.css('select')).nativeElement;

      expect(selectRef.value).toEqual('1');
    });
  });

  describe('FIXLO prompt choice', () => {
    beforeEach(() => {
      const { promptChoices } = getParsedResultDefinitionByShortCode('diffc');
      const promptChoice = find(promptChoices, { promptRef: 'purposeOfTheNextHearing' });

      fixture.componentInstance.promptChoice = promptChoice;
      fixture.componentInstance.limit = 1;
    });

    it('should render', () => {
      fixture.detectChanges();
      expect(fixture).toMatchSnapshot();
    });

    it('should capture an ngModelChange event', () => {
      fixture.detectChanges();

      const selectRef = fixture.debugElement.query(By.css('select')).nativeElement;
      selectRef.value = selectRef.options[0].value;
      selectRef.dispatchEvent(new Event('change'));

      expect(fixture.componentInstance.onChange).toHaveBeenCalledWith(
        'This is for a case management hearing. You must attend this hearing'
      );
    });

    it('should populate an existing value', async () => {
      fixture.componentInstance.value =
        'This is for the trial to take place, where the court will hear the evidence in the case. You must attend this hearing';
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();

      const selectRef = fixture.debugElement.query(By.css('select')).nativeElement;

      expect(selectRef.value).toEqual('2');
    });

    it('should populate an "Other" entry', async () => {
      fixture.componentInstance.value = 'Unknown';
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(fixture).toMatchSnapshot();

      const inputRef = fixture.debugElement.query(By.css('input[type=text]')).nativeElement;

      expect(inputRef.value).toEqual('Unknown');
    });
  });

  describe('FIXLOM prompt choice', () => {
    beforeEach(() => {
      const { promptChoices } = getParsedResultDefinitionByShortCode('RI');
      const promptChoice = find(promptChoices, { promptRef: 'bailExceptionReason' });

      fixture.componentInstance.promptChoice = promptChoice;
      fixture.componentInstance.limit = Infinity;
    });

    it('should render', () => {
      fixture.detectChanges();
      expect(fixture).toMatchSnapshot();
    });

    it('should capture an ngModelChange event', () => {
      fixture.detectChanges();

      const checkboxes = fixture.debugElement.queryAll(By.css('input[type=checkbox]'));
      checkboxes[1].nativeElement.click();

      expect(fixture.componentInstance.onChange).toHaveBeenCalledWith(['Broken bail conditions']);
    });

    it('should populate an existing value', async () => {
      fixture.componentInstance.value = ['Broken bail conditions', 'Failed to surrender'];
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();

      const checkboxes = fixture.debugElement.queryAll(By.css('input[type=checkbox]'));

      expect(checkboxes[0].nativeElement.checked).toBe(false);
      expect(checkboxes[1].nativeElement.checked).toBe(true);
      expect(checkboxes[2].nativeElement.checked).toBe(true);
    });

    it('should populate an "Other" entry', async () => {
      fixture.componentInstance.value = ['Broken bail conditions', 'Unknown'];
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(fixture).toMatchSnapshot();

      const inputRef = fixture.debugElement.query(By.css('input[type=text]')).nativeElement;

      expect(inputRef.value).toEqual('Unknown');
    });
  });

  @Component({
    template: `
      <cpp-fixed-list-input
        [ngModel]="value"
        (ngModelChange)="onChange($event)"
        [name]="promptChoice.promptRef"
        [customOptionEnabled]="customOptionEnabled"
        [fixedList]="promptChoice.fixedList"
        [limit]="limit"
        [promptChoiceValidator]="promptChoice"
      >
      </cpp-fixed-list-input>
    `,
    imports: [FixedListInputComponent, PromptChoiceValidatorDirective, CommonModule, FormsModule]
  })
  class FixedListInputTestComponent {
    onChange = jest.fn();
    limit: number;
    promptChoice: PromptChoice;
    value: unknown;

    get customOptionEnabled() {
      return this.promptChoice.type === 'FIXLO' || this.promptChoice.type === 'FIXLOM';
    }
  }
});
