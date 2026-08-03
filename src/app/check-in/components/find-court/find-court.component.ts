import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ChangeDetectionStrategy,
  DestroyRef,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgForm, FormsModule } from '@angular/forms';
import {
  ValidationError,
  PdkTypographyDirective,
  PdkInsetTextComponent,
  PdkFormComponent,
  PdkFormFieldComponent,
  PdkFormGroupComponent,
  PdkFormGroupDirective,
  PdkButtonComponent,
  PdkButtonDirective,
  PdkLinkDirective
} from '@cpp/pdk';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { OrganisationUnit, OrganisationUnitAutosuggestComponent } from '@cpp/reference-data';
import { DatePipe } from '@angular/common';
import { isNullOrUndefined } from '../../../core';

interface FormDataInfo {
  courtCentre: OrganisationUnit;
}

@Component({
  selector: 'find-court',
  templateUrl: './find-court.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      pdk-form-field {
        width: 50%;
      }
    `
  ],
  imports: [
    PdkTypographyDirective,
    PdkInsetTextComponent,
    FormsModule,
    PdkFormComponent,
    PdkFormFieldComponent,
    OrganisationUnitAutosuggestComponent,
    PdkFormGroupComponent,
    PdkFormGroupDirective,
    PdkButtonComponent,
    PdkButtonDirective,
    PdkLinkDirective,
    TranslatePipe,
    DatePipe
  ]
})
export class FindCourtComponent implements OnInit {
  @ViewChild(NgForm) form: NgForm;
  @Input() appUrl: string;
  @Input() isDefenceUser: boolean;
  @Output() onSelect = new EventEmitter<OrganisationUnit>();
  @Output() onAddCheckinErrors = new EventEmitter<ValidationError[]>();

  errors: ValidationError[];
  currentDate: Date;
  translated: { [key: string]: string };

  private destroyRef = inject(DestroyRef);

  constructor(private translateService: TranslateService) {}

  ngOnInit() {
    this.translateService
      .get([
        'CHECK_IN.COURT',
        'CHECK_IN.COURT_ERROR',
        'CHECK_IN.DEFENCE',
        'CHECK_IN.PROSECUTION',
        'CHECK_IN.SELECT_A_HEARING'
      ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(values => {
        this.translated = {
          COURT: values['CHECK_IN.COURT'],
          COURT_ERROR: values['CHECK_IN.COURT_ERROR'],
          DEFENCE: values['CHECK_IN.DEFENCE'],
          PROSECUTION: values['CHECK_IN.PROSECUTION']
        };
      });
    this.currentDate = new Date(Date.now());
  }

  selectCourt(formData: FormDataInfo) {
    this.onSelect.emit(formData.courtCentre);
  }

  get userGroup() {
    return this.isDefenceUser ? this.translated.DEFENCE : this.translated.PROSECUTION;
  }

  formErrorMessage($event: ValidationError[]) {
    this.errors = $event;
    if (this.errors) {
      this.errors.forEach(item => {
        if (!isNullOrUndefined(item.message === this.translated.COURT)) {
          item.message = this.translated.COURT_ERROR;
        }
      });
      this.onAddCheckinErrors.emit(this.errors);
    } else {
      this.onAddCheckinErrors.emit([]);
    }
  }
}
