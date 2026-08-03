import { CourtApplication, Defendant, HearingDetail } from '../model';
import {
  deriveApplicationCaseSummaries,
  getSubjectsFromCurrentHearing,
  isConcludedLinkedApplication,
  isStandAloneApplication
} from './application';

describe('Application selectors', () => {
  it('should not select application subjects if defendant is the subject', () => {
    const hearing = {
      prosecutionCases: [
        {
          defendants: [
            {
              masterDefendantId: 'm1'
            }
          ]
        }
      ],
      courtApplications: [
        {
          applicationId: 'applicationId',
          subject: {
            masterDefendant: {
              masterDefendantId: 'm1'
            }
          }
        }
      ]
    };
    const defendants = [
      {
        masterDefendantId: 'm1'
      }
    ];

    expect(getSubjectsFromCurrentHearing.projector(hearing as any, defendants as any)).toEqual([]);
  });

  it('should select the subjects', () => {
    const hearing = {
      prosecutionCases: [],
      courtApplications: [
        {
          id: 'applicationId',
          subject: {
            masterDefendant: {
              masterDefendantId: 'm1'
            }
          }
        }
      ] as CourtApplication[]
    } as HearingDetail;

    const defendants = [] as Defendant[];
    expect(getSubjectsFromCurrentHearing.projector(hearing, defendants)).toMatchSnapshot();
  });

  describe('deriveApplicationCaseSummaries', () => {
    it('should derive case summaries from court application cases', () => {
      const applications = [
        {
          id: 'app-1',
          isGroupCaseApplication: true,
          courtApplicationCases: [
            { prosecutionCaseId: 'pc-1', prosecutionCaseIdentifier: { caseURN: 'URN-1' } }
          ]
        }
      ] as CourtApplication[];

      expect(deriveApplicationCaseSummaries(applications)).toEqual([
        {
          id: 'pc-1',
          prosecutionCaseIdentifier: { caseURN: 'URN-1' },
          defendants: [],
          isGroupMaster: true
        }
      ]);
    });

    it('should fall back to the application id when the case has no prosecutionCaseId', () => {
      const applications = [
        {
          id: 'app-1',
          courtApplicationCases: [{ prosecutionCaseIdentifier: { caseURN: 'URN-1' } }]
        }
      ] as CourtApplication[];

      expect(deriveApplicationCaseSummaries(applications).map(summary => summary.id)).toEqual([
        'app-1'
      ]);
    });

    it('should return [] for an application with no court application cases', () => {
      const applications = [{ id: 'app-1', courtOrder: {} }] as CourtApplication[];

      expect(deriveApplicationCaseSummaries(applications)).toEqual([]);
    });
  });

  describe('isStandAloneApplication', () => {
    it('should be true for an unlinked application when prosecutionCases is omitted', () => {
      const hearing = {
        courtApplications: [{ id: 'app-1' }] as CourtApplication[]
      } as HearingDetail;

      expect(isStandAloneApplication(hearing)).toBe(true);
    });

    it('should be true for an unlinked application when prosecutionCases is present but empty', () => {
      const hearing = {
        courtApplications: [{ id: 'app-1' }] as CourtApplication[],
        prosecutionCases: []
      } as HearingDetail;

      expect(isStandAloneApplication(hearing)).toBe(true);
    });

    it('should be false when there is at least one prosecution case', () => {
      const hearing = {
        courtApplications: [{ id: 'app-1' }] as CourtApplication[],
        prosecutionCases: [{}]
      } as HearingDetail;

      expect(isStandAloneApplication(hearing)).toBe(false);
    });

    it('should be false when the application is linked to a case (has court application cases)', () => {
      const hearing = {
        courtApplications: [
          { id: 'app-1', courtApplicationCases: [{ offences: [] }] }
        ] as CourtApplication[]
      } as HearingDetail;

      expect(isStandAloneApplication(hearing)).toBe(false);
    });

    it('should be false when there are no court applications', () => {
      const hearing = { prosecutionCases: [] } as HearingDetail;

      expect(isStandAloneApplication(hearing)).toBe(false);
    });
  });

  describe('isConcludedLinkedApplication', () => {
    it('should be true when prosecutionCases is omitted and every application-case offence has proceedings concluded', () => {
      const hearing = {
        courtApplications: [
          {
            id: 'app-1',
            courtApplicationCases: [
              { offences: [{ proceedingsConcluded: true }, { proceedingsConcluded: true }] }
            ]
          }
        ] as CourtApplication[]
      } as HearingDetail;

      expect(isConcludedLinkedApplication(hearing)).toBe(true);
    });

    it('should be true when prosecutionCases is present but empty and every application-case offence has proceedings concluded', () => {
      const hearing = {
        courtApplications: [
          { id: 'app-1', courtApplicationCases: [{ offences: [{ proceedingsConcluded: true }] }] }
        ] as CourtApplication[],
        prosecutionCases: []
      } as HearingDetail;

      expect(isConcludedLinkedApplication(hearing)).toBe(true);
    });

    it('should be false when at least one application-case offence has proceedings not concluded', () => {
      const hearing = {
        courtApplications: [
          {
            id: 'app-1',
            courtApplicationCases: [
              { offences: [{ proceedingsConcluded: true }, { proceedingsConcluded: false }] }
            ]
          }
        ] as CourtApplication[]
      } as HearingDetail;

      expect(isConcludedLinkedApplication(hearing)).toBe(false);
    });

    it('should be false when an application-case offence is missing the proceedings concluded flag', () => {
      const hearing = {
        courtApplications: [
          { id: 'app-1', courtApplicationCases: [{ offences: [{}] }] }
        ] as CourtApplication[]
      } as HearingDetail;

      expect(isConcludedLinkedApplication(hearing)).toBe(false);
    });

    it('should be false when there is at least one prosecution case', () => {
      const hearing = {
        courtApplications: [
          { id: 'app-1', courtApplicationCases: [{ offences: [{ proceedingsConcluded: true }] }] }
        ] as CourtApplication[],
        prosecutionCases: [{}]
      } as HearingDetail;

      expect(isConcludedLinkedApplication(hearing)).toBe(false);
    });

    it('should be false for an unlinked (standalone) application with no court application cases', () => {
      const hearing = {
        courtApplications: [{ id: 'app-1' }] as CourtApplication[]
      } as HearingDetail;

      expect(isConcludedLinkedApplication(hearing)).toBe(false);
    });

    it('should be false when there are no court applications', () => {
      const hearing = {} as HearingDetail;

      expect(isConcludedLinkedApplication(hearing)).toBe(false);
    });
  });
});
