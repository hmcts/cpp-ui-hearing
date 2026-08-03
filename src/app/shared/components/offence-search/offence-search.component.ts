import {
  Component,
  forwardRef,
  Injector,
  Input,
  ViewChild,
  ChangeDetectorRef,
  OnInit
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NgControl, FormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { filter, map, switchMap, throttleTime, tap } from 'rxjs/operators';
import { Subject } from 'rxjs';
import {
  FormFieldControl,
  PdkAutosuggest,
  PdkAutosuggestComponent,
  PdkGrid,
  PdkGridComponent,
  PdkTextColorDirective
} from '@cpp/pdk';
import { OffenceType, ReferenceDataOffenceService } from '../../../core';
import { OffenceComponent } from '../offence/offence.component';

let i = 1;

const coerceBooleanProperty = (value: any): boolean => {
  return value != null && `${value}` !== 'false';
};

const generateId = () => {
  return `offence-search-${i++}`;
};

interface OffenceTypeAutoSuggestion {
  label: string;
  offence: OffenceType;
  id: string;
}

@Component({
  selector: 'offence-search',
  styleUrls: ['./offence-search.scss'],
  templateUrl: 'offence-search.component.html',
  providers: [
    {
      provide: FormFieldControl,
      useExisting: forwardRef(() => OffenceSearchComponent)
    },
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OffenceSearchComponent),
      multi: true
    }
  ],
  imports: [
    FormsModule,
    AsyncPipe,
    PdkAutosuggest,
    PdkGrid,
    PdkGridComponent,
    PdkTextColorDirective,
    OffenceComponent
  ]
})
export class OffenceSearchComponent implements ControlValueAccessor, FormFieldControl, OnInit {
  @Input() id = generateId();
  @Input() ariaDescribedBy: string | null;
  @Input() selectedOffenceCode: string;
  @Input() isVerdictDeleted: boolean;

  @Input()
  get fullWidth() {
    return this._fullWidth;
  }
  set fullWidth(on: boolean) {
    this._fullWidth = coerceBooleanProperty(on);
  }

  @Input()
  get required() {
    return this._required;
  }
  set required(req: any) {
    this._required = coerceBooleanProperty(req);
  }

  @ViewChild('autosuggest', { static: true })
  autoSuggest: PdkAutosuggestComponent<OffenceTypeAutoSuggestion>;

  noResult = false;
  controlType = 'typeahead';
  hasError = false;
  input$ = new Subject<any>();
  multi = false;
  selected: OffenceType | null = null;
  source$ = new Subject<OffenceTypeAutoSuggestion[]>();

  get inputValue() {
    return this._inputValue;
  }

  set inputValue(value: string) {
    if (!value) {
      this.source$.next([]);
    }
    this._inputValue = value;
    this.noResult = false;
  }

  _fullWidth: boolean;
  _required: boolean;
  _inputValue: string;
  private _value: OffenceType | null = null;

  propagateChange: (_: any) => void = (_: any) => {};

  constructor(
    private injector: Injector,
    private changeDetectorRef: ChangeDetectorRef,
    public referenceDataOffenceService: ReferenceDataOffenceService
  ) {
    this.input$
      .pipe(
        tap(text => (this.inputValue = text)),
        filter(text => text.length > 2),
        throttleTime(250),
        switchMap(text => referenceDataOffenceService.searchOffenceTypes(text, 10, '')),
        tap(offences => {
          if (!offences || offences.length === 0) {
            this.noResult = true;
            return;
          }
          this.noResult = false;
        }),
        // In order to ensure that the auto suggest does not populate the value of the input we must transform the label to
        // an empty string as this is part of the requirement. This behaviour is undesirable in the
        // case of this component, where the selected offence is profiled in a separate
        // component, so we instead make an empty label available to the TypeaheadMatch
        // so as to clear the input upon selection
        map(offences =>
          offences.map(offence => ({
            label: '',
            id: offence.offenceId,
            offence
          }))
        )
      )
      .subscribe(this.source$);
    // TODO: Restore ngForm submit handler if needed
    // (ngForm as any).ngSubmit.subscribe(() => {
    //   this.hasError = Boolean(this.ngControl.errors);
    //     this.changeDetectorRef.markForCheck();
    // });
  }
  ngOnInit() {
    setTimeout(() => {
      if (this.selectedOffenceCode && !this.isVerdictDeleted) {
        this.referenceDataOffenceService
          .searchOffenceTypes(this.selectedOffenceCode, 10, '')
          .subscribe(offences => {
            offences.map((offence: OffenceType) => {
              if (offence.cjsOffenceCode === this.selectedOffenceCode) {
                this.selected = offence;
                this.changeDetectorRef.detectChanges();
              }
            });
          });
      }
    });
  }

  get ngControl() {
    return this.injector.get(NgControl);
  }

  getKey(option: OffenceTypeAutoSuggestion) {
    if (option.offence) {
      return option.offence.offenceId;
    }
    return undefined;
  }

  getLabel(option: OffenceTypeAutoSuggestion) {
    return option.label;
  }

  getTitleTextColour(highlighted: boolean) {
    return highlighted ? 'white' : 'black';
  }

  getMatchedTitle = <U extends keyof OffenceType>(suggestion: OffenceType, key: U): string => {
    if (suggestion && key in suggestion) {
      const label = suggestion[key];
      if (this.inputValue.length > 0 && label) {
        const offset = this.inputValue.length;
        const idx = label.toLowerCase().indexOf(this.inputValue.toLowerCase());
        if (idx !== -1) {
          return (
            `${label.substring(0, idx)}<b>${label.substring(idx, idx + offset)}</b>` +
            `${label.substring(idx + offset)}`
          );
        }
      }
      return label;
    }
    return '';
  };

  registerOnChange = (fn: (_: any) => void) => {
    this.propagateChange = fn.bind(this);
    const onChangeWrapper = (value: unknown) => {
      const offenceTypeAutoSuggestion = value as OffenceTypeAutoSuggestion;
      if (offenceTypeAutoSuggestion && offenceTypeAutoSuggestion.offence) {
        this.selected = offenceTypeAutoSuggestion.offence;
        this.propagateChange(this.selected);
      }
    };
    if (this.autoSuggest) {
      this.autoSuggest.registerOnChange(onChangeWrapper);
    }
  };
  registerOnTouched(fn: any) {
    if (this.autoSuggest && this.autoSuggest.registerOnTouched) {
      this.autoSuggest.registerOnTouched(fn);
    }
  }
  writeValue(value?: OffenceType | null): void {
    if (value !== this._value) {
      this._value = value || null;
      this.selected = value || null;

      if (this.autoSuggest) {
        if (value) {
          const wrappedValue: OffenceTypeAutoSuggestion = {
            label: '',
            offence: value,
            id: value.offenceId
          };
          this.autoSuggest.writeValue(wrappedValue);
        } else {
          this.autoSuggest.writeValue(null);
        }
        this.changeDetectorRef.detectChanges();
      }
    }
  }
}
