import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  NgZone,
  ChangeDetectorRef
} from '@angular/core';
import { EventLog } from '../../core';
import moment from 'moment';
import { Subject, timer } from 'rxjs';
import { map, distinctUntilChanged, tap, skip, takeUntil } from 'rxjs/operators';
import { PdkTypographyDirective, PdkMarginDirective, PdkPaddingDirective } from '@cpp/pdk';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'total-jury-deliberation',
  templateUrl: './total-jury-deliberation.component.html',
  styleUrls: ['./total-jury-deliberation.component.scss'],
  imports: [PdkTypographyDirective, PdkMarginDirective, PdkPaddingDirective, TranslatePipe]
})
export class TotalJuryDeliberationComponent implements OnChanges, OnDestroy {
  @Input() loggedEvents: EventLog[];

  deliberationTimerInMinutes = 0;

  destroy$: Subject<boolean> = new Subject<boolean>();

  private readonly JURY_RETIRES = 'Jury retired';
  private readonly JURY_RETURNED = 'Jury returned';
  private readonly DISCHARGE_JURY = 'Jury discharged';
  private readonly HEARING_ENDED = 'Hearing ended';

  constructor(private zone: NgZone, private changeDetectorRef: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges) {
    // TODO: once it's upgraded to Angular 8.x -> change to if(changes?.loggedEvents)
    if (changes && changes.loggedEvents) {
      this.calculateJuryDeliberationTimer();
    }
  }

  formatDeliberationTimer() {
    const durationAsMiliseconds = moment
      .duration(this.deliberationTimerInMinutes, 'minutes')
      .asMilliseconds();

    return moment.utc(durationAsMiliseconds).format('H[h] mm[m]');
  }

  private calculateJuryDeliberationTimer() {
    this.destroy$.next(true);
    this.deliberationTimerInMinutes = 0;

    const deliberationEvents = this.loggedEvents.filter(
      loggedEvent =>
        loggedEvent.recordedLabel === this.JURY_RETIRES ||
        loggedEvent.recordedLabel === this.JURY_RETURNED ||
        loggedEvent.recordedLabel === this.DISCHARGE_JURY ||
        loggedEvent.recordedLabel === this.HEARING_ENDED
    );

    const deliberationEventsAsc = deliberationEvents.slice().reverse();

    let lastRetireTime: string = null;

    deliberationEventsAsc.forEach(event => {
      if (event.recordedLabel === this.JURY_RETIRES && !lastRetireTime) {
        lastRetireTime = event.eventTime;

        if (this.deliberationTimerInMinutes === 0) {
          this.deliberationTimerInMinutes = 1;
        }
      }

      if (
        (event.recordedLabel === this.JURY_RETURNED ||
          event.recordedLabel === this.HEARING_ENDED) &&
        lastRetireTime
      ) {
        this.deliberationTimerInMinutes += moment(event.eventTime)
          .endOf('minutes')
          .diff(lastRetireTime, 'minutes');
        lastRetireTime = null;
      }

      if (event.recordedLabel === this.DISCHARGE_JURY) {
        lastRetireTime = null;
        this.deliberationTimerInMinutes = 0;
      }
    });

    if (!!lastRetireTime) {
      this.keepCountingWhereItLeft(lastRetireTime);
    }

    this.changeDetectorRef.markForCheck();
  }

  private keepCountingWhereItLeft(lastRetireTime: string) {
    const modifiedEventDate = moment(lastRetireTime).set({
      h: moment().get('hour'),
      m: moment().get('minute')
    });

    this.deliberationTimerInMinutes += moment(modifiedEventDate).diff(lastRetireTime, 'minutes');

    this.zone.runOutsideAngular(() => {
      timer(0, 1000)
        .pipe(takeUntil(this.destroy$))
        .pipe(
          map(() => new Date()),
          distinctUntilChanged((a: Date, b: Date) => a.getMinutes() === b.getMinutes()),
          skip(1),
          tap(() => (this.deliberationTimerInMinutes += 1))
        )
        .subscribe();
    });
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
