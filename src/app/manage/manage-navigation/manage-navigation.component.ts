import { Component, Input, ChangeDetectorRef, AfterViewInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AppState, getSelectedOptions, HearingListFilters } from '../../core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { Store } from '@ngrx/store';
import {
  PdkMarginDirective,
  PdkServiceNavigationComponent,
  PdkServiceNavigationListDirective,
  PdkServiceNavigationListItemDirective,
  PdkTextColorDirective
} from '@cpp/pdk';
import { NgTemplateOutlet } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
@Component({
  selector: 'manage-navigation',
  templateUrl: './manage-navigation.component.html',
  styleUrls: ['./manage-navigation.component.scss'],
  imports: [
    PdkServiceNavigationComponent,
    RouterLink,
    PdkServiceNavigationListDirective,
    PdkServiceNavigationListItemDirective,
    RouterLinkActive,
    PdkTextColorDirective,
    NgTemplateOutlet,
    TranslatePipe,
    PdkMarginDirective
  ]
})
export class ManageNavigationComponent implements AfterViewInit, OnDestroy {
  @Input() isManageHearingPageApplicableFlag = true;
  @Input() isVerdictsPageAvailable: boolean;
  @Input() isPleaApplicableFlag: boolean;
  @Input() isTierAndListTypeAvailable: boolean;
  @Input() isTierAndListTypeEntered: boolean;
  @Input() currentTab: string;
  @Input() isBoxwork: boolean;

  hearingId: string;
  destroy$: Subject<boolean> = new Subject<boolean>();
  hearingListFilter: HearingListFilters;

  constructor(
    private cdRef: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private store: Store<AppState>
  ) {
    this.store
      .select(getSelectedOptions)
      .pipe(takeUntil(this.destroy$))
      .subscribe(selectedOptions => {
        if (selectedOptions) {
          this.hearingListFilter = {
            hearingDate: selectedOptions.dateFilter as string,
            courtCentreName: selectedOptions.courtCentreFilter.name,
            courtCentreId: selectedOptions.courtCentreFilter.id as string,
            courtRoomName: selectedOptions.courtRoomFilter.name,
            courtRoomId: selectedOptions.courtRoomFilter.id as string,
            startTimeFilter: selectedOptions.startTimeFilter,
            endTimeFilter: selectedOptions.endTimeFilter
          };
        }
      });
  }

  ngAfterViewInit() {
    this.cdRef.detectChanges();
    this.hearingId = this.activatedRoute.snapshot.paramMap.get('hearingId');
    if (!this.hearingListFilter) {
      return;
    }
    this.hearingListFilter = { ...this.hearingListFilter, hearingId: this.hearingId };
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  get isEnterResultsActive() {
    return this.router.url.includes('enter-results');
  }
}
