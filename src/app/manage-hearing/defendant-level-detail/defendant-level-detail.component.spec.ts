import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { DefendantLevelDetailComponent } from './defendant-level-detail.component';
import { provideTranslateService } from '@ngx-translate/core';
import { AppConfigService } from 'src/app/config';
import {
  extractApplicantRespondentOrAppellantFromCourtApplication,
  hearingCourtApplication
} from '../mock/application-defendant';

describe('DefendantLevelDetailComponent', () => {
  let component: DefendantLevelDetailComponent;
  let fixture: ComponentFixture<DefendantLevelDetailComponent>;
  let getBaseUrl: any;
  getBaseUrl = jest.fn();

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [DefendantLevelDetailComponent],
      providers: [
        provideTranslateService(),
        { provide: AppConfigService, useValue: { getBaseUrl } }
      ],
      teardown: { destroyAfterEach: false }
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DefendantLevelDetailComponent);
    component = fixture.componentInstance;
    component.defendant = extractApplicantRespondentOrAppellantFromCourtApplication[0];
    component.hearing = hearingCourtApplication;
    component.caseStatus = 'INACTIVE';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
