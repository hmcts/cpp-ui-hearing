import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output
} from '@angular/core';
import {
  CounselsCache,
  HearingDetail,
  ApplicantCounsel,
  RespondentCounsel,
  ProsecutionCounsel,
  DefenceCounsel,
  CompanyRepresentative,
  Defendant,
  IntermediaryCounsel
} from '../../core';
import {
  ApplicationCounselsFormState,
  ApplicationCounsel
} from './application-counsels-panel/application-counsels-form.component';
import { ProsecutionCaseSummary } from '../../core/model/shared/prosecution-case-summary';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  PdkMarginDirective,
  PdkBorderColorDirective,
  PdkTypographyDirective,
  PdkGridComponent,
  PdkGridDirective
} from '@cpp/pdk';

import { PanelItemComponent } from '../panel-item/panel-item.component';
import { DefenceCounselsPanelComponent } from './defence-counsels-panel/defence-counsels-panel.component';
import { CompanyRepresentativesPanelComponent } from './company-representatives-panel/company-representatives-panel.component';
import { ProsecutionCounselsPanelComponent } from './prosecution-counsels-panel/prosecution-counsels-panel.component';
import { ApplicationCounselsPanelComponent } from './application-counsels-panel/application-counsels-panel.component';
import { IntermediaryCounselsPanelComponent } from './intermediary-counsels-panel/intermediary-counsels-panel.component';

@Component({
  selector: 'attendees-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './attendees-panel.component.html',
  styleUrls: ['./attendees-panel.component.scss'],
  imports: [
    PdkMarginDirective,
    PdkBorderColorDirective,
    PdkTypographyDirective,
    PdkGridComponent,
    PdkGridDirective,
    PanelItemComponent,
    DefenceCounselsPanelComponent,
    CompanyRepresentativesPanelComponent,
    ProsecutionCounselsPanelComponent,
    ApplicationCounselsPanelComponent,
    IntermediaryCounselsPanelComponent,
    TranslatePipe
  ]
})
export class AttendeesPanelComponent implements OnInit {
  @Input() urns: string[];
  @Input() courtApplications: HearingDetail['courtApplications'];
  @Input() applicantCounsels: ApplicantCounsel[];
  @Input() respondentCounsels: RespondentCounsel[];
  @Input() attendanceDay: string;
  @Input() prosecutionCounsels: ProsecutionCounsel[];
  @Input() defenceCounsels: DefenceCounsel[];
  @Input() companyRepresentatives: CompanyRepresentative[];
  @Input() defendantsCurrentHearing: Defendant[];
  @Input() counselsCacheOptions: CounselsCache;
  @Input() isStandAloneApplication: boolean;
  @Input() intermediariesCounsel: IntermediaryCounsel[];
  @Input() prosecutionCasesSummary: ProsecutionCaseSummary[];
  @Input() hearingHasBulkCaseOnly: boolean;
  @Input() isHearingEventLogEnded: boolean;
  @Input() proceedingsConcluded: boolean;
  attendeesMenuItems: string[];
  selectedAttendeeItem: string;
  showMoreUrns = false;
  @Output() onUpdateProsecutionCounsel: EventEmitter<{
    pc?: ProsecutionCounsel;
    removeIndex?: number;
  }> = new EventEmitter();
  @Output() onUpdateDefenceCounsel: EventEmitter<{
    dc?: DefenceCounsel;
    removeIndex?: number;
  }> = new EventEmitter();
  @Output() onUpdateIntermediaryCounsel: EventEmitter<{
    intermediary?: IntermediaryCounsel;
    removeIndex?: number;
  }> = new EventEmitter();
  @Output() onUpdateCompanyRepresentative: EventEmitter<{
    rep?: CompanyRepresentative;
    removeIndex?: number;
  }> = new EventEmitter();
  @Output() onChangeSelectedMenuItem: EventEmitter<string> = new EventEmitter();
  @Output() applicantCounselsFormState = new EventEmitter<ApplicationCounselsFormState>();
  @Output() destroyApplicantCounsel = new EventEmitter<ApplicationCounsel>();
  @Output() respondentCounselsFormState = new EventEmitter<ApplicationCounselsFormState>();
  @Output() destroyRespondentCounsel = new EventEmitter<ApplicationCounsel>();
  @Output() onCounselValid = new EventEmitter<boolean>();

  readonly INTERPRETER_INTERMEDIARY = 'INTERPRETER / INTERMEDIARY';
  readonly PROSECUTION = 'PROSECUTION';
  readonly DEFENCE = 'DEFENCE';
  readonly RESPONDENT = 'RESPONDENT';
  readonly APPLICANT = 'APPLICANT';
  readonly APPELLANT = 'APPELLANT';
  readonly COMPANY_REPRESENTATIVE = 'COMPANY REPRESENTATIVE';

  private readonly destroyRef = inject(DestroyRef);

  applicantAppellantSynonym: string;
  applicantAppellantTitle: string;

  constructor(private translate: TranslateService) {}

  ngOnInit() {
    if (!this.isStandAloneApplication) {
      if (this.hearingHasBulkCaseOnly) {
        this.attendeesMenuItems = [this.PROSECUTION];
      } else {
        this.attendeesMenuItems = [
          this.PROSECUTION,
          this.DEFENCE,
          this.COMPANY_REPRESENTATIVE,
          this.INTERPRETER_INTERMEDIARY
        ];
      }
      this.selectAttendeeMenuItem(this.PROSECUTION);
    } else {
      // Hide respondent menu item if there is no respondents in the application
      // @see CPI-226
      if (
        (this.courtApplications || []).length > 0 &&
        (this.courtApplications[0].respondents || []).length > 0
      ) {
        this.attendeesMenuItems = [this.APPLICANT, this.RESPONDENT, this.INTERPRETER_INTERMEDIARY];
      } else {
        this.attendeesMenuItems = [this.APPLICANT, this.INTERPRETER_INTERMEDIARY];
      }

      this.selectAttendeeMenuItem(this.APPLICANT);
    }

    if (this.courtApplications && this.courtApplications.length) {
      const isAppellant = this.courtApplications[0].type.applicantAppellantFlag;
      const titleKey = `ENTER_COUNSELS.${isAppellant ? this.APPELLANT : this.APPLICANT}`;
      const upcaseKey = `ENTER_COUNSELS.${
        isAppellant ? `${this.APPELLANT}_UPCASE` : `${this.APPLICANT}_UPCASE`
      }`;

      this.translate
        .get([titleKey, upcaseKey])
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(translations => {
          this.applicantAppellantTitle = translations[titleKey];
          this.applicantAppellantSynonym = translations[upcaseKey];
        });
    }
  }

  getAttendeeMenuItemLabel(attendeeMenuItem: string) {
    // For concluded (inactive) proceedings, the prosecution / defence tabs are relabelled
    // as applicant / respondent without changing the underlying menu keys.
    if (this.proceedingsConcluded) {
      if (attendeeMenuItem === this.PROSECUTION) {
        return this.APPLICANT;
      }
      if (attendeeMenuItem === this.DEFENCE) {
        return this.RESPONDENT;
      }
    }

    switch (attendeeMenuItem) {
      case this.APPLICANT:
        return this.applicantAppellantSynonym;
      case this.RESPONDENT:
        return this.RESPONDENT;

      default:
        return attendeeMenuItem;
    }
  }

  selectAttendeeMenuItem(attendeeItem: string) {
    this.selectedAttendeeItem = attendeeItem;
    this.onChangeSelectedMenuItem.emit(attendeeItem);
    this.onCounselValid.emit(false);
  }

  toggleUrns() {
    this.showMoreUrns = !this.showMoreUrns;
  }

  updateProsecutionCounsel(pc: { pc?: ProsecutionCounsel; removeIndex?: number }) {
    setTimeout(() => {
      this.onUpdateProsecutionCounsel.emit(pc);
    });
  }

  updateDefenceCounsel(dc: { dc?: DefenceCounsel; removeIndex?: number }) {
    setTimeout(() => {
      this.onUpdateDefenceCounsel.emit(dc);
    });
  }

  updateIntermediaryCounsel(intermediary: {
    intermediaryCounsel?: IntermediaryCounsel;
    removeIndex?: number;
  }): void {
    setTimeout(() => {
      this.onUpdateIntermediaryCounsel.emit(intermediary);
    });
  }

  updateCompanyRepresentative(rep: { rep?: CompanyRepresentative; removeIndex?: number }) {
    setTimeout(() => {
      this.onUpdateCompanyRepresentative.emit(rep);
    });
  }
}
