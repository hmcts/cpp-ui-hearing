import {
  getApplicationsByDefendant,
  getDefendantsContainsOffence,
  getHearingCaseUrl,
  groupApplicantRespondentOrAppellantFromCourtApplication,
  resolveProceedingsConcluded
} from '../utils';
import {
  HearingDetail,
  Defendant,
  CourtApplication,
  Offence,
  HearingCaseLink,
  HearingCaseLinkType
} from '../../model';

describe('Utils', () => {
  describe('getApplicationsByDefendant', () => {
    it('should return applications for the given defendant', () => {
      const defendant: Defendant = { masterDefendantId: 'def1', offences: [] } as Defendant;
      const hearing: HearingDetail = {
        courtApplications: [
          { subject: { masterDefendant: { masterDefendantId: 'def1' } } } as CourtApplication,
          { subject: { masterDefendant: { masterDefendantId: 'def2' } } } as CourtApplication
        ]
      } as HearingDetail;

      const result = getApplicationsByDefendant(defendant, hearing);
      expect(result.length).toBe(1);
      expect(result[0].subject.masterDefendant.masterDefendantId).toBe('def1');
    });
  });

  describe('getDefendantsContainsOffence', () => {
    it('should return defendants containing the given offence', () => {
      const offence: Offence = { offenceDefinitionId: 'off1', count: 1 } as Offence;
      const defendants: Defendant[] = [
        { offences: [{ offenceDefinitionId: 'off1', count: 1 }] } as Defendant,
        { offences: [{ offenceDefinitionId: 'off2', count: 1 }] } as Defendant
      ];

      const result = getDefendantsContainsOffence(offence, defendants);
      expect(result.length).toBe(1);
      expect(result[0].offences[0].offenceDefinitionId).toBe('off1');
    });
  });

  describe('groupApplicantRespondentOrAppellantFromCourtApplication', () => {
    it('should group applicants and respondents from court applications', () => {
      const hearing: HearingDetail = {
        courtApplications: [
          {
            applicant: { masterDefendant: { masterDefendantId: 'def1' } },
            subject: {
              masterDefendant: {
                masterDefendantId: 'def1',
                isYouth: true,
                associatedPersons: [],
                personDefendant: {}
              }
            },
            type: 'type1',
            courtApplicationCases: [{ prosecutionCaseId: 'case1', offences: [] }]
          } as any
        ]
      } as HearingDetail;

      const result: any = groupApplicantRespondentOrAppellantFromCourtApplication(hearing);
      expect(result['def1']).toBeDefined();
      expect(result['def1'].isYouth).toBe(true);
    });

    it('should group only master defendant from the parent application', () => {
      const hearing: HearingDetail = {
        courtApplications: [
          {
            id: 'parent1',
            applicant: { masterDefendant: { masterDefendantId: 'def1' } },
            subject: {
              masterDefendant: {
                masterDefendantId: 'def1',
                isYouth: true,
                associatedPersons: [],
                personDefendant: {}
              }
            },
            type: 'type1',
            courtApplicationCases: [{ prosecutionCaseId: 'case1', offences: [] }]
          } as any,
          {
            id: 'child1',
            applicant: { masterDefendant: { masterDefendantId: 'def1' } },
            parentApplicationId: 'parent1',
            subject: {
              masterDefendant: {
                masterDefendantId: 'def1',
                isYouth: true,
                associatedPersons: [],
                personDefendant: {}
              }
            },
            type: 'type2',
            courtApplicationCases: [{ prosecutionCaseId: 'case1', offences: [] }]
          } as any
        ]
      } as HearingDetail;

      const result: any = groupApplicantRespondentOrAppellantFromCourtApplication(
        hearing,
        'parent1'
      );
      expect(result['def1']).toBeDefined();
      expect(result['def1'].isYouth).toBe(true);
      expect(result['def1']['type']).toBe('type1');
      expect(Object.values(result).length).toBe(1);
    });

    it('should group by relative applicationId', () => {
      const hearing: HearingDetail = {
        courtApplications: [
          {
            id: 'parent1',
            applicant: { masterDefendant: { masterDefendantId: 'def1' } },
            subject: {
              masterDefendant: {
                masterDefendantId: 'def1',
                isYouth: true,
                associatedPersons: [],
                personDefendant: {}
              }
            },
            type: 'type1',
            courtApplicationCases: [{ prosecutionCaseId: 'case1', offences: [] }]
          } as any,
          {
            id: 'child1',
            applicant: {
              masterDefendant: { masterDefendantId: 'def1' }
            },
            parentApplicationId: 'parent1',
            subject: {
              masterDefendant: {
                masterDefendantId: 'def1',
                isYouth: true,
                associatedPersons: [],
                personDefendant: {}
              }
            },
            type: 'type2',
            courtApplicationCases: [{ prosecutionCaseId: 'case1', offences: [] }]
          } as any
        ]
      } as HearingDetail;

      const result: any = groupApplicantRespondentOrAppellantFromCourtApplication(
        hearing,
        'child1'
      );
      expect(result['def1']['type']).toBe('type2');
      expect(Object.values(result).length).toBe(1);
    });
  });

  describe('getHearingCaseUrl', () => {
    const hearingId = 'hearing123';

    it('should return application materials URL', () => {
      const hearingCaseLink: HearingCaseLink = {
        caseId: '',
        applicationId: 'app123',
        type: HearingCaseLinkType.APPLICATION_MATERIAL
      };
      const result = getHearingCaseUrl(hearingId, hearingCaseLink);
      expect(result).toBe('case-materials?applicationId=app123&hearingId=hearing123');
    });

    it('should return case materials URL', () => {
      const hearingCaseLink: HearingCaseLink = {
        caseId: 'case123',
        applicationId: '',
        type: HearingCaseLinkType.CASE_MATERIAL
      };
      const result = getHearingCaseUrl(hearingId, hearingCaseLink);
      expect(result).toBe('case-materials?caseId=case123&hearingId=hearing123');
    });

    it('should return application at a glance URL', () => {
      const hearingCaseLink: HearingCaseLink = {
        caseId: '',
        applicationId: 'app123',
        type: HearingCaseLinkType.APPLICATION_AT_A_GLANCE
      };
      const result = getHearingCaseUrl(hearingId, hearingCaseLink);
      expect(result).toBe('application-at-a-glance/app123');
    });

    it('should return case at a glance URL', () => {
      const hearingCaseLink: HearingCaseLink = {
        caseId: 'case123',
        applicationId: '',
        type: HearingCaseLinkType.CASE_AT_A_GLANCE
      };
      const result = getHearingCaseUrl(hearingId, hearingCaseLink);
      expect(result).toBe('case-at-a-glance/case123');
    });

    it('should return add application URL without caseId', () => {
      const hearingCaseLink: HearingCaseLink = {
        caseId: '',
        applicationId: 'app123',
        type: HearingCaseLinkType.ADD_APPLICATION
      };
      const result = getHearingCaseUrl(hearingId, hearingCaseLink);
      expect(result).toBe('application/select-type?hearingId=hearing123');
    });

    it('should return add application URL with caseId', () => {
      const hearingCaseLink: HearingCaseLink = {
        caseId: 'case123',
        applicationId: 'app123',
        type: HearingCaseLinkType.ADD_APPLICATION
      };
      const result = getHearingCaseUrl(hearingId, hearingCaseLink);
      expect(result).toBe('application/select-type?hearingId=hearing123&caseId=case123');
    });

    it('should return add child application URL', () => {
      const hearingCaseLink: HearingCaseLink = {
        caseId: 'case123',
        applicationId: 'app123',
        type: HearingCaseLinkType.ADD_CHILD_APPLICATION
      };
      const result = getHearingCaseUrl(hearingId, hearingCaseLink);
      expect(result).toBe(
        'application/select-type?caseId=case123&hearingId=hearing123&parentApplicationId=app123'
      );
    });

    it('should return empty string for unknown type', () => {
      const hearingCaseLink: HearingCaseLink = {
        caseId: 'case123',
        applicationId: 'app123',
        type: 'UNKNOWN_TYPE' as HearingCaseLinkType
      };
      const result = getHearingCaseUrl(hearingId, hearingCaseLink);
      expect(result).toBe('');
    });
  });

  describe('resolveProceedingsConcluded', () => {
    it('should return false when there is no hearing', () => {
      expect(resolveProceedingsConcluded(undefined)).toBe(false);
    });

    it('should return false when no offences, court orders or prosecution cases exist', () => {
      const hearing = { courtApplications: [], prosecutionCases: [] } as HearingDetail;
      expect(resolveProceedingsConcluded(hearing)).toBe(false);
    });

    describe('Offences under court applications', () => {
      it('should return true (inactive) when court application offences are concluded', () => {
        const hearing = {
          courtApplications: [
            {
              courtApplicationCases: [{ offences: [{ proceedingsConcluded: true } as Offence] }]
            } as CourtApplication
          ],
          prosecutionCases: []
        } as HearingDetail;

        expect(resolveProceedingsConcluded(hearing)).toBe(true);
      });

      it('should return false (active) when court application offences are not concluded', () => {
        const hearing = {
          courtApplications: [
            {
              courtApplicationCases: [{ offences: [{ proceedingsConcluded: false } as Offence] }]
            } as CourtApplication
          ],
          prosecutionCases: []
        } as HearingDetail;

        expect(resolveProceedingsConcluded(hearing)).toBe(false);
      });

      it('should treat a missing proceedingsConcluded flag as active', () => {
        const hearing = {
          courtApplications: [
            {
              courtApplicationCases: [{ offences: [{} as Offence] }]
            } as CourtApplication
          ],
          prosecutionCases: []
        } as HearingDetail;

        expect(resolveProceedingsConcluded(hearing)).toBe(false);
      });
    });

    describe('Court order with no offences', () => {
      it('should return false (active) when a court order exists and there are no application offences', () => {
        const hearing = {
          courtApplications: [
            {
              courtApplicationCases: [],
              courtOrder: { id: 'order-1' }
            } as Partial<CourtApplication>
          ],
          prosecutionCases: []
        } as HearingDetail;

        expect(resolveProceedingsConcluded(hearing)).toBe(false);
      });
    });

    describe('Offences under prosecution cases', () => {
      it('should return true (inactive) when prosecution case offences are concluded', () => {
        const hearing = {
          courtApplications: [],
          prosecutionCases: [
            {
              defendants: [{ offences: [{ proceedingsConcluded: true } as Offence] } as Defendant]
            }
          ]
        } as HearingDetail;

        expect(resolveProceedingsConcluded(hearing)).toBe(true);
      });

      it('should return false (active) when prosecution case offences are not concluded', () => {
        const hearing = {
          courtApplications: [],
          prosecutionCases: [
            {
              defendants: [{ offences: [{ proceedingsConcluded: false } as Offence] } as Defendant]
            }
          ]
        } as HearingDetail;

        expect(resolveProceedingsConcluded(hearing)).toBe(false);
      });

      it('should resolve case-level offences when defendants have none', () => {
        const hearing = {
          courtApplications: [],
          prosecutionCases: [
            {
              defendants: [],
              offences: [{ proceedingsConcluded: true } as Offence]
            }
          ]
        } as HearingDetail;

        expect(resolveProceedingsConcluded(hearing)).toBe(true);
      });
    });

    it('should prefer court application offences over prosecution case offences', () => {
      const hearing = {
        courtApplications: [
          {
            courtApplicationCases: [{ offences: [{ proceedingsConcluded: true } as Offence] }]
          } as CourtApplication
        ],
        prosecutionCases: [
          {
            defendants: [{ offences: [{ proceedingsConcluded: false } as Offence] } as Defendant]
          }
        ]
      } as HearingDetail;

      expect(resolveProceedingsConcluded(hearing)).toBe(true);
    });
  });
});
