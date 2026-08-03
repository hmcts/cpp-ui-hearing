import { HearingListFeedbackPanelComponent } from './hearing-list-feedback-panel.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';

describe('HearingListFeedbackPanelComponent', () => {
  let component: HearingListFeedbackPanelComponent;
  let fixture: ComponentFixture<HearingListFeedbackPanelComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HearingListFeedbackPanelComponent);
    component = fixture.componentInstance;
    component.title = 'Feedback and Guaidance';
    component.feedbackText = 'Feedback';
    component.guidanceText = 'Guidance';
    component.configFeedbackUrl = `https://forms.office.com/pages/responsepage.aspx?id=KEeHxuZx_kGp4S6MNndq2CzEj
    _HFSxpKoqBZAvjaEIRUMTRCRFpORVlPUlRHRDhDRTBTMzRWUjlFViQlQCN0PWcu`;
    component.configGuidanceUrl = `https://justiceuk.sharepoint.com/sites/HMCTSLandDHub/SitePages/Common-Platform.aspx`;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture).toMatchSnapshot();
  });
});
