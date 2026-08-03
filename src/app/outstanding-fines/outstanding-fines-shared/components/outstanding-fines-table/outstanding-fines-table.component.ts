import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { OutstandingFine } from '../../../outstanding-fines.interfaces';
import { DefendantAnswerPipe } from '../../defendant-answer.pipe';

@Component({
  selector: 'outstanding-fines-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './outstanding-fines-table.component.html',
  styleUrls: ['./outstanding-fines-table.component.scss'],
  imports: [CommonModule, TranslatePipe, DefendantAnswerPipe]
})
export class OutstandingFinesTableComponent {
  @Input() outstandingFines: OutstandingFine[];
}
