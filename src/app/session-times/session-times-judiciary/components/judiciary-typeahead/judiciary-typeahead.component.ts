import {
  ChangeDetectorRef,
  Component,
  Injector,
  Input,
  ViewChild,
  forwardRef,
  OnDestroy
} from '@angular/core';
import {
  NgControl,
  NgForm,
  NG_VALUE_ACCESSOR,
  ControlValueAccessor,
  AbstractControl,
  ValidationErrors,
  NG_VALIDATORS,
  Validator
} from '@angular/forms';
import { Subject } from 'rxjs';
import { auditTime, filter, map, switchMap } from 'rxjs/operators';
import { FormFieldControl, PdkAutosuggestLiteComponent } from '@cpp/pdk';
import { JudicialMember } from '../../../../core/model';
import { ReferenceDataService } from '../../../../core/services';
import { AsyncPipe } from '@angular/common';

export interface JudiciaryAutoSuggestOption extends JudicialMember {
  judicialMemberName: string;
  judicialMemberLocation?: string;
}

const coerceBooleanProperty = (value: any): boolean => {
  return value != null && `${value}` !== 'false';
};

@Component({
  selector: 'judiciary-typeahead',
  templateUrl: './judiciary-typeahead.component.html',
  styleUrls: ['./judiciary-typeahead.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => JudiciaryTypeaheadComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => JudiciaryTypeaheadComponent),
      multi: true
    },
    {
      provide: FormFieldControl,
      useExisting: forwardRef(() => JudiciaryTypeaheadComponent)
    }
  ],
  imports: [AsyncPipe, PdkAutosuggestLiteComponent]
})
export class JudiciaryTypeaheadComponent
  implements ControlValueAccessor, FormFieldControl, Validator, OnDestroy
{
  id: string;
  ariaDescribedBy: string | null;
  @ViewChild('autosuggest', { static: true })
  autoSuggest: PdkAutosuggestLiteComponent<JudiciaryAutoSuggestOption>;

  @Input()
  get required() {
    return this._required;
  }
  set required(req: any) {
    this._required = coerceBooleanProperty(req);
  }

  input$ = new Subject<any>();
  source$ = new Subject<JudiciaryAutoSuggestOption[]>();

  selectedJudicialMember: JudiciaryAutoSuggestOption;
  controlType = 'typeahead';
  hasError = false;
  noResult = false;
  multi = false;
  _required: boolean;

  private propagateChange: (_: any) => void = (_: any) => {};

  constructor(
    private injector: Injector,
    private changeDetectorRef: ChangeDetectorRef,
    private ngForm: NgForm,
    referenceDataService: ReferenceDataService
  ) {
    this.input$
      .pipe(
        filter(text => text.length > 1),
        auditTime(250),
        switchMap(text => referenceDataService.getJudicialMembersByNamePattern(text, 50)),
        map(judicialMembers =>
          judicialMembers.map(judicialMember => {
            let judiciaryTitle = judicialMember.titlePrefix || '';
            if (judicialMember.titleJudicialPrefix) {
              judiciaryTitle = judicialMember.titleJudicialPrefix;
            }
            let judiciaryLocation = judicialMember.ljaShortName || '';
            if (judicialMember.baseLocation) {
              judiciaryLocation = judicialMember.baseLocation;
            }
            let judiciaryMemberType = judicialMember.judiciaryType || '';
            return {
              ...judicialMember,
              judicialMemberName: `${judiciaryTitle} ${judicialMember.forenames} ${judicialMember.surname}`,
              judicialMemberLocation: `${judiciaryMemberType} ${judiciaryLocation}`
            } as JudiciaryAutoSuggestOption;
          })
        )
      )
      .subscribe(this.source$);
    (ngForm as any).ngSubmit.subscribe(() => {
      this.hasError = Boolean(this.ngControl.errors);

      this.changeDetectorRef.markForCheck();
    });
  }

  ngOnDestroy(): void {
    if (!!this.ngForm.controls[this.ngControl.name]) {
      this.ngForm.controls[this.ngControl.name].setErrors(undefined);
    }
  }

  get ngControl() {
    return this.injector.get(NgControl);
  }

  onSelect(match: JudiciaryAutoSuggestOption) {
    this.propagateChange(match);
  }

  validate(c: AbstractControl): ValidationErrors | null {
    if (this.required && !c.value) {
      return { required: { actual: c.value } };
    }
    return null;
  }

  writeValue(value: JudicialMember): void {
    if (this.autoSuggest && value) {
      let judiciaryTitle = value.titlePrefix || '';
      if (value.titleJudicialPrefix) {
        judiciaryTitle = value.titleJudicialPrefix;
      }
      this.selectedJudicialMember = {
        ...value,
        judicialMemberName: `${judiciaryTitle} ${value.forenames} ${value.surname}`
      };
      this.autoSuggest.writeValue(this.selectedJudicialMember);
    }
  }

  registerOnChange = (fn: (_: any) => void) => {
    this.propagateChange = fn.bind(this);

    fn = (autoSuggest: JudiciaryAutoSuggestOption) => {
      this.propagateChange(autoSuggest);
    };

    this.autoSuggest.registerOnChange(fn);
  };

  registerOnTouched(fn: any) {}
}
