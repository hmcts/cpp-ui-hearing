import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CourtApplicationParty } from '../../core';
import { ApplicationSubjectComponent } from './application-subject.component';

const fakeSubject = {
  id: '74ace379-6e21-4f9f-8471-b53ed5e8d53a',
  masterDefendant: {
    masterDefendantId: '36bc4994-1d37-4f8e-8148-a862b38d2277',
    personDefendant: {
      personDetails: {
        firstName: 'Catharine',
        lastName: 'Hudson',
        title: 'MR'
      }
    }
  }
} as CourtApplicationParty;

describe('ApplicationSubjectComponent', () => {
  let fixture: ComponentFixture<ApplicationSubjectComponent>;
  let component: ApplicationSubjectComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ApplicationSubjectComponent],
      teardown: { destroyAfterEach: false }
    });
    fixture = TestBed.createComponent(ApplicationSubjectComponent);
    component = fixture.componentInstance;
  });

  it('should render the component', () => {
    component.subject = fakeSubject;
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });
});
