import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
  Inject
} from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { v4 as uuid } from 'uuid';
import { DOCUMENT } from '@angular/common';
import { ApplicantCounsel, RespondentCounsel, HearingDetail } from '../../../core';
import { PageScrollService, PageScrollInstance } from 'ngx-page-scroll-core';

import {
  PdkFormComponent,
  PdkLinkDirective,
  PdkFormFieldComponent,
  PdkTextInputDirective
} from '@cpp/pdk';
import { TranslatePipe } from '@ngx-translate/core';
export type ApplicationCounsel = ApplicantCounsel | RespondentCounsel;

export type ApplicationCounselType = 'applicant' | 'respondent';

export interface ApplicationCounselsFormState<T = ApplicationCounsel> {
  added: T[];
  updated: T[];
  valid: boolean;
}

@Component({
  selector: 'application-counsels-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form pdk-form autocomplete="off" novalidate>
      @for (item of counselItems; track item.id) {
      <div data-test-id="applicationCounsel" class="item-container" [id]="item.id">
        <section [ngModelGroup]="item.id" [attr.data-test-id]="item.id">
          <div class="item-destroy">
            @if (isDefaultForm) {
            <span secondary>
              {{ 'COMMON.DELETE' | translate }}
            </span>
            } @if (!isDefaultForm) {
            <a
              pdk-link
              href="javascript:void(0);"
              class="item-destroy"
              data-test-id="remove-application-counsel"
              (click)="handleDestroyCounsel(item)"
            >
              {{ 'COMMON.DELETE' | translate }}
            </a>
            }
          </div>
          <pdk-form-field label="{{ 'ENTER_COUNSELS.FIRST_NAME' | translate }}" labelType="small">
            <input
              type="text"
              name="firstName"
              [(ngModel)]="item.firstName"
              pdk-text-input
              required
            />
          </pdk-form-field>
          <pdk-form-field label="{{ 'ENTER_COUNSELS.LAST_NAME' | translate }}" labelType="small">
            <input
              type="text"
              name="lastName"
              [(ngModel)]="item.lastName"
              pdk-text-input
              required
            />
          </pdk-form-field>
          <pdk-form-field
            label="{{ 'ENTER_COUNSELS.STATUS_ON_CASE' | translate }}"
            hintText="{{ 'ENTER_COUNSELS.STATUS_SUBTEXT' | translate }}"
            labelType="small"
          >
            <input type="text" name="status" [(ngModel)]="item.status" pdk-text-input />
          </pdk-form-field>
          <hr />
        </section>
      </div>
      }
      <a pdk-link data-test-id="add-counsel" href="javascript:void(0)" (click)="handleAddCounsel()">
        {{ 'ENTER_COUNSELS.ADD_ANOTHER_ATTENDEE' | translate }}
      </a>
      <hr />
    </form>
  `,
  styles: [
    `
      .item-container {
        position: relative;
      }
      .item-destroy {
        position: absolute;
        top: 0;
        right: 0;
      }
      .item-destroy--disabled {
        color: #6f777b !important;
      }
    `
  ],
  imports: [
    FormsModule,
    PdkFormComponent,
    PdkLinkDirective,
    PdkFormFieldComponent,
    PdkTextInputDirective,
    TranslatePipe
  ]
})
export class ApplicationCounselsFormComponent implements OnInit, AfterViewInit {
  @Input() applications: HearingDetail['courtApplications'] = [];
  @Input() attendanceDay: string;
  @Input() counselType: ApplicationCounselType;
  @Input() initialCounsels: ApplicationCounsel[] = [];
  @Output() destroy = new EventEmitter<ApplicationCounsel>();
  @Output() state = new EventEmitter<ApplicationCounselsFormState>();

  @ViewChild(NgForm) form: NgForm;

  counselItems: ApplicationCounsel[] = [];

  ngOnInit() {
    this.counselItems =
      this.initialCounsels.length > 0
        ? this.initialCounsels.map(counsel => ({ ...counsel }))
        : [this.createCounsel()];
  }

  constructor(
    private pageScrollService: PageScrollService,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngAfterViewInit() {
    // As this form is submitted external to the component, we emit its internal
    // state to external consumers whenever the form values change
    this.form.valueChanges.subscribe(() => this.handleCounselsChanged());
  }

  createCounsel(): ApplicationCounsel {
    let counsel: ApplicantCounsel | RespondentCounsel;
    switch (this.counselType) {
      case 'applicant':
        counsel = {
          id: uuid(),
          applicants: this.applications.map(application => application.applicant.id),
          attendanceDays: [this.attendanceDay],
          title: '',
          firstName: '',
          lastName: '',
          status: ''
        };
        break;
      case 'respondent':
        counsel = {
          id: uuid(),
          respondents: this.applications.reduce(
            (respondentIds, application) => [
              ...respondentIds,
              ...(application.respondents || []).map(respondent => respondent.id)
            ],
            [] as string[]
          ),
          attendanceDays: [this.attendanceDay],
          title: '',
          firstName: '',
          lastName: '',
          status: ''
        };
        break;
      default:
        throw new Error('Unrecognised `counselType`');
    }
    const hearingDetailsPanel = <HTMLInputElement>document.getElementById('hearing-details-panel');
    setTimeout(() => {
      const pageScrollInstance: PageScrollInstance = this.pageScrollService.create({
        document: this.document,
        scrollTarget: `#${counsel.id}`,
        scrollViews: [hearingDetailsPanel]
      });
      this.pageScrollService.start(pageScrollInstance);
    });
    return counsel;
  }

  handleAddCounsel() {
    this.counselItems.push(this.createCounsel());
  }

  handleDestroyCounsel(counselItem: ApplicationCounsel) {
    this.counselItems = this.counselItems.filter(item => item !== counselItem);
    this.handleCounselsChanged();

    if (this.counselItems.length === 0) {
      // always maintain at least one available counsel
      this.handleAddCounsel();
    }
    if (this.initialCounsels.find(counsel => counsel.id === counselItem.id)) {
      this.destroy.emit(counselItem);
    }
  }

  handleCounselsChanged() {
    // Determine the counsels added by the form by virtue of their ids not
    // existing in the initial (persisted) counsels array. When the form is in
    // its default state, we do not consider this item as added until it is modified
    const added = this.isDefaultForm
      ? []
      : this.counselItems.filter(
          item => !this.initialCounsels.find(counsel => counsel.id === item.id)
        );

    // Determine the counsels updated by this form by inspecting for any differences
    // existing in the initial (persisted) counsels and those counsels with the same
    // id that may have received updates through the form inputs
    const updated = this.counselItems.filter(next => {
      const prev = this.initialCounsels.find(counsel => counsel.id === next.id);

      return (
        prev &&
        (prev.firstName !== next.firstName ||
          prev.lastName !== next.lastName ||
          prev.status !== (next.status || ''))
      );
    });

    // Validity of the form is when no counsels have been removed, and a new or
    // updated counsel exists
    const valid = this.form.valid && (added.length !== 0 || updated.length !== 0);

    this.state.emit({
      added,
      updated,
      valid
    });
  }

  // The notion of the default form is one where a single counsel item exists
  // and the value of each of its input is untouched
  get isDefaultForm() {
    if (this.counselItems.length === 1) {
      const { id, firstName, lastName, status } = this.counselItems[0];
      const didUpdate = this.initialCounsels.some(counsel => counsel.id === id);

      if (!didUpdate) {
        return firstName === '' && lastName === '' && status === '';
      }
    }
    return false;
  }
}
