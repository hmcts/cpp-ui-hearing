import { Injectable } from '@angular/core';
import { ModalService } from '@cpp/pdk';
import { select, Store } from '@ngrx/store';
import moment from 'moment';
import { combineLatest } from 'rxjs';
import { take } from 'rxjs/operators';
import {
  AmendmentReason,
  getCurrentHearing,
  getCurrentAmendmentReason,
  setCurrentAmendmentReason
} from '../../../core';
import {
  filterResults,
  getTargetId,
  isActiveDraftResultLine,
  isResolvedDraftResultLine
} from '../../core/helpers';
import { getDraftResult, ResultsState } from '../../core/store';
import { ResolvedDraftResultLine } from '../../results.interfaces';
import {
  AmendmentNoticeData,
  AmendmentReasonNoticeComponent
} from '../components/amendment-notice.component';
import {
  AmendmentReasonFormComponent,
  AmendmentsReasonData
} from '../components/amendment-reason-form.component';

interface RequestAmendmentReasonOptions {
  initialValue?: AmendmentReason;
  targetIds?: string[];
}

export type AmendmentLockedReason = AmendmentNoticeData['noticeType'] | null;

@Injectable({ providedIn: 'root' })
export class AmendmentService {
  constructor(private modalService: ModalService, private store: Store<ResultsState>) {}

  requestAmendmentReason({
    initialValue,
    targetIds = []
  }: RequestAmendmentReasonOptions = {}): Promise<AmendmentReason | null> {
    return new Promise<AmendmentReason | null>(resolve => {
      if (targetIds.length > 0) {
        for (const targetId of targetIds) {
          const noticeType = this.validateTarget(targetId);

          if (noticeType) {
            this.showAmendmentNoticeModal(noticeType).then(resolve);
            return;
          }
        }
      }
      this.store
        .pipe(select(getCurrentAmendmentReason))
        .pipe(take(1))
        .subscribe(amendmentReason => {
          if (!!amendmentReason) {
            resolve(amendmentReason);
          } else {
            this.showAmendmentModal(initialValue).then(resolve);
          }
        });
    });
  }

  private showAmendmentModal(initialValue: AmendmentReason): Promise<AmendmentReason | null> {
    return new Promise(resolve => {
      const modalRef = this.modalService.open(AmendmentReasonFormComponent, {
        data: {
          initialValue,
          onSubmit: amendmentReason => {
            this.store.dispatch(setCurrentAmendmentReason({ amendmentReason }));
            modalRef.dispose();
            resolve(amendmentReason);
          },
          onCancel: () => {
            modalRef.dispose();
            resolve(null);
          }
        } as AmendmentsReasonData
      });
    });
  }

  private showAmendmentNoticeModal(noticeType: AmendmentNoticeData['noticeType']): Promise<null> {
    return new Promise(resolve => {
      const modalRef = this.modalService.open(AmendmentReasonNoticeComponent, {
        data: {
          noticeType,
          onCancel: () => {
            modalRef.dispose();
            resolve(null);
          }
        } as AmendmentNoticeData
      });
    });
  }

  private validateTarget(targetId: string): AmendmentLockedReason {
    let error: AmendmentLockedReason = null;

    combineLatest([
      this.store.pipe(select(getCurrentHearing)),
      this.store.pipe(select(getDraftResult))
    ])
      .pipe(take(1))
      .subscribe(([{ earliestNextHearingDate }, draftResult]) => {
        // When the result line belongs to a hearing adjournment, we must
        // determine if that hearing has yet to take place, else the user
        // is trying to amend a result line for an elapsed hearing.
        if (earliestNextHearingDate && moment(earliestNextHearingDate).isSameOrBefore(new Date())) {
          // check for the next hearing types anywhere in the result
          // line's hierarchy – this caters for these result definitions
          // belonging to the current result line, or as due to a parents
          // like 'NEXH' having introduced them
          const activeResults = filterResults<ResolvedDraftResultLine>(
            draftResult,
            result =>
              getTargetId(result.resultLine) === targetId &&
              isActiveDraftResultLine(result.resultLine) &&
              isResolvedDraftResultLine(result.resultLine) &&
              (['nhmc', 'nhccs'].includes(result.resultLine.shortCode.toLowerCase()) ||
                result.resultLine.unscheduled)
          );

          if (activeResults.length > 0) {
            error = 'NEXH';
          }
        }
      });

    return error;
  }
}
