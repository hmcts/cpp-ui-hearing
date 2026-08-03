import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HearingSummary } from '../../../core';
import { mockHearingSummaries } from '../../mocks';
import { Router } from '@angular/router';
import { AppConfigService } from '../../../config';
import { ResultedHearingsComponent } from './resulted-hearings.component';
import { provideTranslateService } from '@ngx-translate/core';

describe('Resulted hearings component', () => {
  let fixture: ComponentFixture<ResultedHearingsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ResultedHearingsComponent],
      providers: [
        provideTranslateService(),
        {
          provide: Router,
          useValue: {
            navigate: jest.fn()
          }
        },
        {
          provide: AppConfigService,
          useValue: {
            appUrl: 'appUrl/'
          }
        }
      ],
      teardown: { destroyAfterEach: false }
    }).compileComponents();

    fixture = TestBed.createComponent(ResultedHearingsComponent);
  }));

  it('should not render with empty hearings ', () => {
    fixture.componentInstance.hearingSummaries = [];
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });

  it('should render with resulted hearings', () => {
    const resultedMockHearingSummaries: HearingSummary[] = [...mockHearingSummaries];

    resultedMockHearingSummaries[0].hasSharedResults = true;

    fixture.componentInstance.hearingSummaries = [...resultedMockHearingSummaries];
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });
});
