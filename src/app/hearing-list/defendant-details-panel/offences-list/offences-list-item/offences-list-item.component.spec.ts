import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { OffencesListItemComponent } from './offences-list-item.component';
import { Offence, Verdict, Plea, JurisdictionType } from '../../../../core';
import { provideTranslateService } from '@ngx-translate/core';
import { TranslateMockPipe } from './../../../../shared/pipes/mock-pipes/translate-mock.pipe';

describe('OffencesListItemComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService(), TranslateMockPipe],
      teardown: { destroyAfterEach: false }
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  }));

  it('should render the template with the values expected', () => {
    expect(fixture).toMatchSnapshot();
  });

  it('should hide legislation', () => {
    fixture.componentInstance.hideLegislation = true;
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });

  it('should bold title', () => {
    fixture.componentInstance.boldTitle = true;
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });

  it('should show offence count for Crown court', () => {
    fixture.componentInstance.boldTitle = true;
    fixture.componentInstance.jurisdictionType = 'CROWN';
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });
});

@Component({
  selector: 'test-host-component',
  template: `
    <offences-list-item
      [offence]="offence"
      [hideLegislation]="hideLegislation"
      [boldTitle]="boldTitle"
      [jurisdictionType]="jurisdictionType"
    >
    </offences-list-item>
  `,
  imports: [OffencesListItemComponent]
})
class TestHostComponent {
  offence: Offence = <Offence>{
    id: '4b1318e4-1517-4e4f-a89d-6af0eafa5058',
    wording:
      'on 01/08/2009 at the County public house, unlawfully and maliciously wounded, John Smith',
    count: 1,
    orderIndex: 1,
    offenceTitle: 'Wound / inflict grievous bodily harm without intent',
    offenceLegislation: 'Contrary to section 20 of the Offences Against the Person Act 1861.',
    plea: <Plea>{
      offenceId: '0161a828-cfd1-4608-8616-d92870baba3d',
      pleaDate: '2016-06-08',
      pleaValue: 'GUILTY'
    },
    verdict: <Verdict>{
      offenceId: '0161a828-cfd1-4608-8616-d92870bada3d',
      value: {
        id: '0161a828-cfd1-4608-8616-d92870bada3d',
        category: 'GUILTY',
        code: 'A1',
        description: 'Guilty By Jury On Judges Direction'
      },
      verdictDate: '2018-02-21',
      jurors: { numberOfJurors: 10, unanimous: false, numberOfSplitJurors: 2 }
    },
    custodyTimeLimit: {
      timeLimit: '2019-08-10',
      daysSpent: 100
    }
  };

  hideLegislation = false;
  boldTitle = false;
  jurisdictionType?: JurisdictionType;
}
