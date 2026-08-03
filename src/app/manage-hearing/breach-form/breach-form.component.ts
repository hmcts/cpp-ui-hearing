import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  ChangeDetectorRef
} from '@angular/core';
import {
  ValidationError,
  PdkWarningTextComponent,
  PdkMarginDirective,
  PdkCheckboxComponent,
  PdkTypographyDirective,
  PdkFormComponent,
  PdkInsetTextComponent,
  PdkPaddingDirective,
  PdkTextColorDirective,
  PdkFormFieldComponent,
  PdkAutosuggestLiteComponent,
  PdkButtonComponent,
  PdkButtonDirective
} from '@cpp/pdk';
import { CourtApplicationType } from '@cpp/reference-data';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { BreachedApplication } from '../../core/model/breach-application';
import { CourtOrder, CourtOrderOffence } from '../../core/model/court-orders';
import { SelectOrderModalComponent } from './select-order-alert-modal.component';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { DisplayListPipe } from '../../shared/pipes/display-list.pipe';
import { CPPDatePipe } from '../../shared/pipes/cpp-date.pipe';

type ModelBreaches = { orderId: string; selected: boolean; breachType: CourtApplicationType }[];
const BREACH_TYPES_LIMIT = 5;

@Component({
  selector: 'breach-form',
  templateUrl: './breach-form.component.html',
  styleUrls: ['./breach-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SelectOrderModalComponent,
    PdkWarningTextComponent,
    PdkMarginDirective,
    PdkCheckboxComponent,
    FormsModule,
    PdkTypographyDirective,
    PdkFormComponent,
    PdkInsetTextComponent,
    PdkPaddingDirective,
    PdkTextColorDirective,
    PdkFormFieldComponent,
    PdkAutosuggestLiteComponent,
    PdkButtonComponent,
    PdkButtonDirective,
    TranslatePipe,
    DisplayListPipe,
    CPPDatePipe
  ]
})
export class BreachFormComponent {
  @Input()
  set courtOrders(courtOrders: CourtOrder[]) {
    this._courtOrders = courtOrders;
    this.createModel();
  }
  get courtOrders() {
    return this._courtOrders;
  }
  @Input() breachTypes: CourtApplicationType[];

  @Output() onSubmit: EventEmitter<BreachedApplication[]> = new EventEmitter();
  @Output() onError: EventEmitter<ValidationError[]> = new EventEmitter();

  errors: ValidationError[];

  modelBreaches: ModelBreaches;
  _courtOrders: CourtOrder[];
  filteredBreachTypes: CourtApplicationType[] = [];
  openActiveOrdersForm = false;

  bsModalRef: BsModalRef;
  showCaseOrderAlert = false;

  constructor(private cdref: ChangeDetectorRef) {}

  toggleSelectedCourtOrder(index: number, isCourtOrderSelected: boolean) {
    this.modelBreaches[index].selected = isCourtOrderSelected;
  }

  toggleActiveOrders(openActiveOrdersForm: boolean) {
    this.openActiveOrdersForm = openActiveOrdersForm;
    if (!openActiveOrdersForm) {
      this.createModel();
    }
  }

  handleSearchSuggestions(text: string) {
    if (text.length !== 0) {
      const filteredBreachTypes = this.breachTypes.filter(
        breachType =>
          breachType.type.toLowerCase().indexOf(text.toLowerCase()) !== -1 ||
          (breachType.code && breachType.code.toLowerCase().indexOf(text.toLowerCase()) !== -1)
      );
      this.filteredBreachTypes = filteredBreachTypes.slice(0, BREACH_TYPES_LIMIT);
    } else {
      this.filteredBreachTypes = [];
    }
  }

  submitBreachForm() {
    const breachesToSubmit = <BreachedApplication[]>this.modelBreaches.reduce(
      (breaches, breach) => {
        if (breach.selected) {
          const defendantCourtOrder = this.courtOrders.find(
            courtOrder => courtOrder.id === breach.orderId
          );
          return <BreachedApplication[]>[
            ...breaches,
            {
              courtOrder: { ...defendantCourtOrder, showUnpaidWorkWarning: undefined },
              applicationType: breach.breachType
            }
          ];
        }
        return breaches;
      },
      <BreachedApplication[]>[]
    );
    if (breachesToSubmit.length > 0) {
      this.openActiveOrdersForm = false;
      this.onSubmit.emit(breachesToSubmit);
      this.createModel();
      this.cdref.detectChanges();
    } else {
      this.showCaseOrderAlert = true;
    }
  }

  dismissShowCaseOrderAlert() {
    this.showCaseOrderAlert = false;
  }

  handleError(errors: ValidationError[]) {
    this.errors = errors;
    this.onError.emit(errors);
  }

  uniqueCaseReferences(courtOrderOffences: CourtOrderOffence[]): string[] {
    return courtOrderOffences
      .map(
        courtOrderOffence =>
          courtOrderOffence.prosecutionCaseIdentifier.caseURN ||
          courtOrderOffence.prosecutionCaseIdentifier.prosecutionAuthorityReference
      )
      .filter((value, index, self) => self.indexOf(value) === index);
  }

  private createModel(): void {
    this.modelBreaches = this._courtOrders.map(activeOrder => {
      return {
        orderId: activeOrder.id,
        selected: false,
        breachType: undefined as CourtApplicationType
      };
    });
  }
}
