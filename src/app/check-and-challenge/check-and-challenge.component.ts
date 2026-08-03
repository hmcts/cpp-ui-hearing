import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { Defendant } from '../core';
import { NgForm, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppState } from '../core/reducers/index';
import { clearCurrentHearing } from '../core/actions/hearing';
import {
  PdkMarginDirective,
  PdkFillColorDirective,
  PdkPaddingDirective,
  PdkGridComponent,
  PdkGridDirective,
  PdkTypographyDirective,
  PdkFormComponent,
  PdkFormFieldComponent,
  PdkInputComponent,
  PdkInputDirective,
  PdkTextInputDirective,
  PdkMaxCountValidatorDirective,
  PdkCharacterCountComponent,
  PdkButtonComponent,
  PdkButtonDirective,
  PdkLinkDirective,
  PdkResizeDirective
} from '@cpp/pdk';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'check-and-challenge-component',
  templateUrl: './check-and-challenge.component.html',
  imports: [
    PdkMarginDirective,
    PdkFillColorDirective,
    PdkPaddingDirective,
    PdkGridComponent,
    PdkGridDirective,
    PdkTypographyDirective,
    FormsModule,
    PdkFormComponent,
    PdkFormFieldComponent,
    PdkInputComponent,
    PdkInputDirective,
    PdkTextInputDirective,
    PdkMaxCountValidatorDirective,
    PdkCharacterCountComponent,
    PdkButtonComponent,
    PdkButtonDirective,
    PdkLinkDirective,
    PdkResizeDirective,
    DatePipe,
    TranslatePipe
  ]
})
export class CheckAndChallengeComponent {
  @Input() defendants: Defendant[];
  @Output() onSaveReason = new EventEmitter<string>();
  @ViewChild(NgForm) form: NgForm;

  reason: string;
  target: string;

  constructor(private router: Router, private store: Store<AppState>) {}

  onSubmit() {
    this.onSaveReason.emit(this.reason);
  }

  goBack(): void {
    this.store.dispatch(clearCurrentHearing());
    this.router.navigateByUrl('/');
  }
}
