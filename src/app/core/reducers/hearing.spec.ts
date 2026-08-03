/**/
import {
  AmendmentReason,
  ApplicantCounsel,
  HearingDetailResponse,
  hearingLegacyReducer,
  hearingReducer,
  HearingState,
  IntermediaryCounsel,
  IntermediaryType,
  RespondentCounsel,
  setSelectedOptions
} from '../../core';
import {
  hearingCaseNoteMock,
  mockCompanyRepresentatives,
  mockDefenceCounsels,
  mockHearingState,
  mockProsecutionCounsels,
  mockSelectedOptions
} from '../../mock-data/test-mock-data';
import * as HearingActions from '../actions/hearing';
import {
  clearCurrentHearing,
  getSelectedHearingIsRestrictedSuccess,
  clearCurrentAmendmentReason,
  setCurrentAmendmentReason,
  toggleSittingYouthCourtSuccess,
  setDefendantOffence
} from '../actions/hearing';
import { AttendanceTypeEnum } from '../model/defendants-attendance';
import { ElectronicMonitoringDefendant } from '../model/hearing-detail';
import { CrackedIneffectiveSubReason } from '../model/shared/cracked-ineffective-sub-reason';
import { ValidationError } from '@cpp/pdk';

describe('HearingReducer', () => {
  let state: HearingState;

  beforeEach(() => {
    state = mockHearingState as HearingState;
  });
  it('should add the hearing summaries to the store', () => {
    state = mockHearingState;
    const actual = hearingLegacyReducer(
      state,
      new HearingActions.LoadHearingListSuccessAction(mockHearingState.summaries)
    );
    expect(actual.summaries).toEqual(mockHearingState.summaries);
  });
  it('should add the hearing details of the selected summary to the store', () => {
    state = mockHearingState;
    const actual = hearingLegacyReducer(
      state,
      new HearingActions.LoadHearingDetailSuccessAction(
        mockHearingState.current as HearingDetailResponse
      )
    );
    expect(actual.current).toMatchSnapshot();
  });
  it('should add trialType to crackedIneffectiveTrial', () => {
    state = mockHearingState;
    const newHearingState = {
      hearing: {
        ...mockHearingState.current.hearing,
        crackedIneffectiveTrial: {
          type: 'mock type'
        }
      }
    } as HearingDetailResponse;
    const actual = hearingLegacyReducer(
      state,
      new HearingActions.LoadHearingDetailSuccessAction(newHearingState)
    );
    expect(actual.current.hearing.crackedIneffectiveTrial.trialType).toBe('mock type');
  });
  it('should add the date to the selected Hearing date', () => {
    state = mockHearingState;
    const actual = hearingLegacyReducer(
      state,
      new HearingActions.SetSelectedHearingDateAction('test')
    );
    expect(actual.selectedHearingDate).toEqual('test');
  });
  it('should add the amendedByUser details', () => {
    const mockUserDetails = {
      userId: '123',
      firstName: 'Test',
      lastName: 'Testy',
      email: 'email',
      prosecutingAuthorityAccess: 'asd'
    };

    state = mockHearingState;

    const actual = hearingLegacyReducer(
      state,
      new HearingActions.LoadAmendingUserDetailsSuccessAction(mockUserDetails)
    );
    expect(actual.current.amendedByUser).toEqual(mockUserDetails);
  });
  it('should load the defendants tracking status', () => {
    const trackingStatus: ElectronicMonitoringDefendant[] = [
      {
        defendantId: 'defendantId',
        trackingStatus: [
          {
            offenceId: 'offenceId',
            emStatus: false,
            emLastModifiedTime: '2019-05-01',
            woaLastModifiedTime: '2019-05-01',
            woaStatus: false
          }
        ]
      }
    ];

    state = mockHearingState;
    const actual = hearingLegacyReducer(
      state,
      new HearingActions.LoadDefendantsTrackingStatusSuccessAction(trackingStatus)
    );
    expect(actual.current.electronicMonitoring).toEqual(trackingStatus);
  });
  it('should add hearing note into the current selected hearing', () => {
    state = mockHearingState;
    const actual = hearingLegacyReducer(
      state,
      new HearingActions.SaveHearingCaseNoteActionSuccess(hearingCaseNoteMock)
    );
    expect(actual.current.hearing.hearingCaseNotes[0].id).toEqual(hearingCaseNoteMock.id);
  });
  it('should save prosecution counsels the current selected hearing', () => {
    const counsel1 = mockProsecutionCounsels[0];
    const counsel2 = mockProsecutionCounsels[1];
    state = mockHearingState;
    const actual = hearingLegacyReducer(
      state,
      new HearingActions.SaveProsecutionCounselsSuccessAction({
        prosecutionCounselsToAdd: [counsel1],
        prosecutionCounselsToUpdate: [counsel2]
      })
    );
    expect(actual.current.hearing.prosecutionCounsels.length).toEqual(2);
    expect(actual.current.hearing.prosecutionCounsels[0]).toEqual(counsel2);
    expect(actual.counselsCache.firstNameOpts[0].value).toEqual(counsel2);
    expect(actual.counselsCache.firstNameOpts[0].label).toEqual(counsel2.firstName);
    expect(actual.counselsCache.lastNameOpts[0].value).toEqual(counsel2);
    expect(actual.counselsCache.lastNameOpts[0].label).toEqual(counsel2.lastName);
  });
  it('should add defence counsels the current selected hearing', () => {
    state = mockHearingState;
    const actual = hearingLegacyReducer(
      state,
      new HearingActions.AddDefenceCounselsSuccessAction({
        defenceCounselsToAdd: mockDefenceCounsels
      })
    );
    expect(actual.current.hearing.defenceCounsels.length).toEqual(mockDefenceCounsels.length + 2);
    expect(actual.current.hearing.defenceCounsels[0]).toEqual(mockDefenceCounsels[0]);
    expect(actual.counselsCache.firstNameOpts[0].value).toEqual(mockDefenceCounsels[0]);
    expect(actual.counselsCache.firstNameOpts[0].label).toEqual(mockDefenceCounsels[0].firstName);
    expect(actual.counselsCache.lastNameOpts[0].value).toEqual(mockDefenceCounsels[0]);
    expect(actual.counselsCache.lastNameOpts[0].label).toEqual(mockDefenceCounsels[0].lastName);
  });
  it('should NOT be caching the added defence counsels the second time', () => {
    state = mockHearingState;
    let actual = hearingLegacyReducer(
      state,
      new HearingActions.AddDefenceCounselsSuccessAction({
        defenceCounselsToAdd: mockDefenceCounsels
      })
    );
    expect(actual.counselsCache.firstNameOpts.length).toEqual(2);
    actual = hearingLegacyReducer(
      actual,
      new HearingActions.AddDefenceCounselsSuccessAction({
        defenceCounselsToAdd: mockDefenceCounsels
      })
    );
    expect(actual.counselsCache.firstNameOpts.length).toEqual(2);
  });
  it('should edit defence counsels the current selected hearing', () => {
    state = mockHearingState;
    state.current.hearing.defenceCounsels = mockDefenceCounsels;
    const updatedCounsel = { ...mockDefenceCounsels[0], firstName: 'changedName' };
    const actual = hearingLegacyReducer(
      state,
      new HearingActions.EditDefenceCounselsSuccessAction({
        defenceCounselsToEdit: [updatedCounsel]
      })
    );
    expect(actual.current.hearing.defenceCounsels.length).toEqual(2);
    expect(actual.current.hearing.defenceCounsels[0].firstName).toEqual('changedName');
    expect(actual.counselsCache.firstNameOpts[0].value).toEqual(updatedCounsel);
    expect(actual.counselsCache.firstNameOpts[0].label).toEqual(updatedCounsel.firstName);
    expect(actual.counselsCache.lastNameOpts[0].value).toEqual(updatedCounsel);
    expect(actual.counselsCache.lastNameOpts[0].label).toEqual(updatedCounsel.lastName);
  });
  it('should remove defence counsels the current selected hearing', () => {
    state = mockHearingState;
    state.current.hearing.defenceCounsels = mockDefenceCounsels;
    const actual = hearingLegacyReducer(
      state,
      new HearingActions.RemoveDefenceCounselsSuccessAction({ defenceCounselsToRemove: ['1'] })
    );
    expect(actual.current.hearing.defenceCounsels.length).toEqual(1);
    expect(actual.current.hearing.defenceCounsels[0]).toEqual(mockDefenceCounsels[1]);
  });
  it('should add company representatives the current selected hearing', () => {
    state = mockHearingState;
    const actual = hearingLegacyReducer(
      state,
      new HearingActions.AddCompanyRepresentativesSuccessAction({
        companyRepresentativesToAdd: mockCompanyRepresentatives
      })
    );
    expect(actual.current.hearing.companyRepresentatives.length).toEqual(
      mockCompanyRepresentatives.length + 2
    );
    expect(actual.current.hearing.companyRepresentatives[0]).toEqual(mockCompanyRepresentatives[0]);
    expect(actual.counselsCache.firstNameOpts[0].value).toEqual(mockCompanyRepresentatives[0]);
    expect(actual.counselsCache.firstNameOpts[0].label).toEqual(
      mockCompanyRepresentatives[0].firstName
    );
    expect(actual.counselsCache.lastNameOpts[0].value).toEqual(mockCompanyRepresentatives[0]);
    expect(actual.counselsCache.lastNameOpts[0].label).toEqual(
      mockCompanyRepresentatives[0].lastName
    );
  });
  it('should NOT be caching the added company representatives the second time', () => {
    state = mockHearingState;
    let actual = hearingLegacyReducer(
      state,
      new HearingActions.AddCompanyRepresentativesSuccessAction({
        companyRepresentativesToAdd: mockCompanyRepresentatives
      })
    );
    expect(actual.counselsCache.firstNameOpts.length).toEqual(2);
    actual = hearingLegacyReducer(
      actual,
      new HearingActions.AddCompanyRepresentativesSuccessAction({
        companyRepresentativesToAdd: mockCompanyRepresentatives
      })
    );
    expect(actual.counselsCache.firstNameOpts.length).toEqual(2);
  });
  it('should edit company representatives the current selected hearing', () => {
    state = mockHearingState;
    state.current.hearing.companyRepresentatives = mockCompanyRepresentatives;
    const updatedCounsel = { ...mockCompanyRepresentatives[0], firstName: 'changedName' };
    const actual = hearingLegacyReducer(
      state,
      new HearingActions.EditCompanyRepresentativesSuccessAction({
        companyRepresentativesToEdit: [updatedCounsel]
      })
    );
    expect(actual.current.hearing.companyRepresentatives.length).toEqual(2);
    expect(actual.current.hearing.companyRepresentatives[0].firstName).toEqual('changedName');
    expect(actual.counselsCache.firstNameOpts[0].value).toEqual(updatedCounsel);
    expect(actual.counselsCache.firstNameOpts[0].label).toEqual(updatedCounsel.firstName);
    expect(actual.counselsCache.lastNameOpts[0].value).toEqual(updatedCounsel);
    expect(actual.counselsCache.lastNameOpts[0].label).toEqual(updatedCounsel.lastName);
  });
  it('should remove company representatives the current selected hearing', () => {
    state = mockHearingState;
    state.current.hearing.companyRepresentatives = mockCompanyRepresentatives;
    const actual = hearingLegacyReducer(
      state,
      new HearingActions.RemoveCompanyRepresentativesSuccessAction({
        companyRepresentativesToRemove: ['1']
      })
    );
    expect(actual.current.hearing.companyRepresentatives.length).toEqual(1);
    expect(actual.current.hearing.companyRepresentatives[0]).toEqual(mockCompanyRepresentatives[1]);
  });

  it('should update the defendant presence in the current selected hearing', () => {
    state = mockHearingState;
    const actual = hearingLegacyReducer(
      state,
      new HearingActions.UpdatePresenceSuccessAction({
        hearingId: 'id-1',
        defendantId: 'def-1',
        attendanceDay: {
          day: '2010-10-10',
          attendanceType: AttendanceTypeEnum.IN_PERSON
        }
      })
    );
    expect(actual.current.hearing.defendantAttendance[0]).toEqual({
      defendantId: 'def-1',
      attendanceDays: [
        {
          day: '2010-10-10',
          attendanceType: 'IN_PERSON'
        }
      ]
    });
  });
  it('should update the applicant counsels', () => {
    const initialState = {
      current: {
        hearing: {
          applicantCounsels: [
            { id: 'applicantCounselId1', firstName: 'James', lastName: 'Gray' },
            { id: 'applicantCounselId2', firstName: 'Gordon', lastName: 'Cumming' },
            { id: 'applicantCounselId3', firstName: 'Panos', lastName: 'Paralakis' }
          ]
        }
      }
    } as HearingState;
    expect(
      hearingLegacyReducer(
        initialState,
        new HearingActions.SaveApplicantCounselsSuccessAction({
          hearingId: '*',
          added: [
            { id: 'applicantCounselId4', firstName: 'Olu', lastName: 'Alli' } as ApplicantCounsel
          ],
          updated: [
            {
              id: 'applicantCounselId1',
              firstName: 'James',
              lastName: 'Grayman'
            } as ApplicantCounsel
          ],
          removed: [
            {
              id: 'applicantCounselId2',
              firstName: 'Gordon',
              lastName: 'Cumming'
            } as ApplicantCounsel
          ]
        })
      )
    ).toEqual({
      current: {
        hearing: {
          applicantCounsels: [
            { id: 'applicantCounselId3', firstName: 'Panos', lastName: 'Paralakis' },
            { id: 'applicantCounselId1', firstName: 'James', lastName: 'Grayman' },
            { id: 'applicantCounselId4', firstName: 'Olu', lastName: 'Alli' }
          ]
        }
      }
    });
  });
  it('should update the respondent counsels', () => {
    const initialState = {
      current: {
        hearing: {
          respondentCounsels: [
            { id: 'respondentCounselId1', firstName: 'James', lastName: 'Gray' },
            { id: 'respondentCounselId2', firstName: 'Gordon', lastName: 'Cumming' },
            { id: 'respondentCounselId3', firstName: 'Panos', lastName: 'Paralakis' }
          ]
        }
      }
    } as HearingState;
    expect(
      hearingLegacyReducer(
        initialState,
        new HearingActions.SaveRespondentCounselsSuccessAction({
          hearingId: '*',
          added: [
            { id: 'respondentCounselId4', firstName: 'Olu', lastName: 'Alli' } as RespondentCounsel
          ],
          updated: [
            {
              id: 'respondentCounselId1',
              firstName: 'James',
              lastName: 'Grayman'
            } as RespondentCounsel
          ],
          removed: [
            {
              id: 'respondentCounselId2',
              firstName: 'Gordon',
              lastName: 'Cumming'
            } as RespondentCounsel
          ]
        })
      )
    ).toEqual({
      current: {
        hearing: {
          respondentCounsels: [
            { id: 'respondentCounselId3', firstName: 'Panos', lastName: 'Paralakis' },
            { id: 'respondentCounselId1', firstName: 'James', lastName: 'Grayman' },
            { id: 'respondentCounselId4', firstName: 'Olu', lastName: 'Alli' }
          ]
        }
      }
    });
  });
  it('should update the intermediary counsels', () => {
    const initialState = {
      current: {
        hearing: {
          intermediaries: [
            { id: 'intermediaryId1', firstName: 'James', lastName: 'Gray' },
            { id: 'intermediaryId2', firstName: 'Gordon', lastName: 'Cumming' },
            { id: 'intermediaryId3', firstName: 'Panos', lastName: 'Paralakis' }
          ]
        }
      }
    } as HearingState;
    expect(
      hearingLegacyReducer(
        initialState,
        new HearingActions.SaveIntermediaryCounselsSuccessAction({
          hearingId: '*',
          added: [
            { id: 'intermediaryId4', firstName: 'Olu', lastName: 'Alli' } as IntermediaryCounsel
          ],
          updated: [
            {
              id: 'intermediaryId1',
              firstName: 'James',
              lastName: 'Grayman'
            } as IntermediaryCounsel
          ],
          removed: ['intermediaryId2']
        })
      )
    ).toEqual({
      current: {
        hearing: {
          intermediaries: [
            { id: 'intermediaryId3', firstName: 'Panos', lastName: 'Paralakis' },
            { id: 'intermediaryId1', firstName: 'James', lastName: 'Grayman' },
            { id: 'intermediaryId4', firstName: 'Olu', lastName: 'Alli' }
          ]
        }
      }
    });
  });
  it('should add intermediary counsels when the hearing has none', () => {
    const initialState = {
      current: {
        hearing: {}
      }
    } as HearingState;
    expect(
      hearingLegacyReducer(
        initialState,
        new HearingActions.SaveIntermediaryCounselsSuccessAction({
          hearingId: '*',
          added: [
            {
              id: 'intermediaryId1',
              firstName: 'Ana',
              lastName: 'Silva',
              role: IntermediaryType.INTERPRETER
            } as IntermediaryCounsel
          ],
          updated: [],
          removed: []
        })
      )
    ).toEqual({
      current: {
        hearing: {
          intermediaries: [
            {
              id: 'intermediaryId1',
              firstName: 'Ana',
              lastName: 'Silva',
              role: IntermediaryType.INTERPRETER
            }
          ]
        }
      }
    });
  });
  it('should update the stored pleas', () => {
    state = mockHearingState;
    expect(
      hearingLegacyReducer(
        mockHearingState as HearingState,
        new HearingActions.StoreDefendantsPleaAction(
          [
            {
              offenceId: ':offenceId',
              prosecutionCaseId: ':id',
              defendantId: ':defendantId',
              allocationDecision: {
                motReasonCode: '02',
                motReasonId: ':motReasonId',
                offenceId: ':id1',
                originatingHearingId: 'bed2d8e5-9fe2-4003-a40b-cee8d1f235d8',
                sequenceNumber: 20,
                motReasonDescription: ':motReasonDescription',
                courtIndicatedSentence: {
                  courtIndicatedSentenceTypeId: 'sentencingDecisionId',
                  courtIndicatedSentenceDescription: 'Sentencing indication requested'
                }
              }
            }
          ],
          ['GUILTY']
        )
      )
    ).toMatchSnapshot();
  });

  it('should reset the draft hearings', () => {
    state = mockHearingState;
    expect(
      hearingLegacyReducer(mockHearingState as HearingState, new HearingActions.ResetPleasAction())
    ).toMatchSnapshot();
  });
  it('should update convictionDate correctly when selecting guilty to not guilty', () => {
    state = mockHearingState;
    state.current.hearing.prosecutionCases[0].defendants[0].offences[0].id = ':offenceId';
    state.current.hearing.prosecutionCases[0].defendants[0].offences[0].plea = {
      offenceId: ':offenceId',
      originatingHearingId: '9ea85de7-a8ad-4060-8971-8f14b822af6b',
      pleaDate: '2020-09-15',
      pleaValue: 'GUILTY'
    };
    const newState = hearingLegacyReducer(
      { ...state },
      new HearingActions.StoreDefendantsPleaAction(
        [
          {
            offenceId: ':offenceId',
            prosecutionCaseId: ':id',
            defendantId: ':defendantId',
            allocationDecision: {
              motReasonCode: '02',
              motReasonId: ':motReasonId',
              offenceId: ':id1',
              originatingHearingId: 'bed2d8e5-9fe2-4003-a40b-cee8d1f235d8',
              sequenceNumber: 20,
              motReasonDescription: ':motReasonDescription',
              courtIndicatedSentence: {
                courtIndicatedSentenceTypeId: 'sentencingDecisionId',
                courtIndicatedSentenceDescription: 'Sentencing indication requested'
              }
            },
            plea: {
              offenceId: ':offenceId',
              originatingHearingId: '9ea85de7-a8ad-4060-8971-8f14b822af6b',
              pleaDate: '2020-09-15',
              pleaValue: 'NOT_GUILTY'
            }
          }
        ],
        ['GUILTY']
      )
    );
    expect(
      newState.current.hearing.prosecutionCases[0].defendants[0].offences[0].convictionDate
    ).toBeFalsy();
  });
  it('should update convictionDate correctly when selecting not guilty to guilty', () => {
    state = mockHearingState;
    state.current.hearing.prosecutionCases[0].defendants[0].offences[0].id = ':offenceId';
    state.current.hearing.prosecutionCases[0].defendants[0].offences[0].plea = {
      offenceId: ':offenceId',
      originatingHearingId: '9ea85de7-a8ad-4060-8971-8f14b822af6b',
      pleaDate: '2020-09-15',
      pleaValue: 'NOT_GUILTY'
    };
    const newState = hearingLegacyReducer(
      { ...state },
      new HearingActions.StoreDefendantsPleaAction(
        [
          {
            offenceId: ':offenceId',
            prosecutionCaseId: ':id',
            defendantId: ':defendantId',
            allocationDecision: {
              motReasonCode: '02',
              motReasonId: ':motReasonId',
              offenceId: ':id1',
              originatingHearingId: 'bed2d8e5-9fe2-4003-a40b-cee8d1f235d8',
              sequenceNumber: 20,
              motReasonDescription: ':motReasonDescription',
              courtIndicatedSentence: {
                courtIndicatedSentenceTypeId: 'sentencingDecisionId',
                courtIndicatedSentenceDescription: 'Sentencing indication requested'
              }
            },
            plea: {
              offenceId: ':offenceId',
              originatingHearingId: '9ea85de7-a8ad-4060-8971-8f14b822af6b',
              pleaDate: '2020-09-15',
              pleaValue: 'GUILTY'
            }
          }
        ],
        ['GUILTY']
      )
    );
    expect(
      newState.current.hearing.prosecutionCases[0].defendants[0].offences[0].convictionDate
    ).toBe(newState.current.hearing.prosecutionCases[0].defendants[0].offences[0].plea.pleaDate);
  });
  it('should update the available hearings', () => {
    state = mockHearingState;
    const actual = hearingLegacyReducer(
      state,
      new HearingActions.SearchAvailableHearingsSuccessAction([])
    );
    expect(actual.available).toStrictEqual([]);
  });
  it('should reset the available hearings', () => {
    state = mockHearingState;
    state.available = [];
    const actual = hearingLegacyReducer(state, new HearingActions.ResetAvailableHearingsAction());
    expect(actual.available).toBeNull();
  });

  it('should clear current hearing', () => {
    state = {
      ...mockHearingState
    } as HearingState;

    const actualState = hearingReducer(state, clearCurrentHearing());

    expect(actualState.current.hearing).toEqual(null);
  });

  it('should getSelectedHearingIsRestrictedSuccess', () => {
    state = {
      ...mockHearingState
    } as HearingState;

    const actualState = hearingReducer(
      state,
      getSelectedHearingIsRestrictedSuccess({ isRestricted: true })
    );

    expect(actualState.isRestricted).toBe(true);
  });

  it('should toggle youth court defendants', () => {
    state = {
      ...mockHearingState
    } as HearingState;

    const actualState = hearingReducer(
      state,
      toggleSittingYouthCourtSuccess({ newYouthCourtDefendantIds: ['id1', 'id2'] })
    );

    expect(actualState.current.hearing.youthCourtDefendantIds).toEqual(['id1', 'id2']);
  });

  it('should set selected options', () => {
    state = {
      ...mockHearingState
    } as HearingState;
    const payload = { selectedOptions: mockSelectedOptions };

    const actualState = hearingReducer(state, setSelectedOptions(payload));

    expect(actualState.selectedOptions).toEqual(mockSelectedOptions);
  });

  it('should set current amendment reason', () => {
    state = {
      ...mockHearingState
    } as HearingState;
    const amendmentReason: AmendmentReason = {
      id: 'test1-id',
      seqNo: 1,
      reasonDescription: 'test-description'
    };
    const expectedState = {
      ...state,
      amendmentReason
    };
    const actualState = hearingReducer(state, setCurrentAmendmentReason({ amendmentReason }));

    expect(actualState).toEqual(expectedState);
  });

  it('should clear current amendment reason', () => {
    const amendmentReason: AmendmentReason = {
      id: 'test1-id',
      seqNo: 1,
      reasonDescription: 'test-description'
    };
    state = {
      ...mockHearingState,
      amendmentReason
    } as HearingState;
    const expectedState = {
      ...mockHearingState,
      amendmentReason: null
    } as HearingState;
    const actualState = hearingReducer(state, clearCurrentAmendmentReason());

    expect(actualState).toEqual(expectedState);
  });

  it('should reset the draft hearings when we click cancel on verdict page', () => {
    state = mockHearingState;
    expect(
      hearingLegacyReducer(mockHearingState as HearingState, HearingActions.resetVerdictAction)
    ).toMatchSnapshot();
  });

  it('should set lesserOrAlternativeOffence for the verdict in an offence', () => {
    state = mockHearingState;
    const offenceType = {
      offenceId: 'test-offenceId',
      cjsOffenceCode: 'test-cjsOffenceCode',
      title: 'test-offenceTitle',
      legislation: 'test-offenceLegislation'
    };
    const defendant = state.current.hearing.prosecutionCases[0].defendants[0];
    const offence = state.current.hearing.prosecutionCases[0].defendants[0].offences[0];

    const newState = hearingReducer(
      { ...state },
      setDefendantOffence({ offence, defendant, offenceType })
    );

    expect(
      newState.current.hearing.prosecutionCases[0].defendants[0].offences[0].verdict
        .lesserOrAlternativeOffence.offenceCode
    ).toBe(offenceType.cjsOffenceCode);
  });

  describe('Cracked Ineffective Sub Reasons Reducer', () => {
    const mockSubReasons: CrackedIneffectiveSubReason[] = [
      {
        id: '1',
        subReasonCode: 'SUB1',
        subReasonDesc: 'Sub Reason 1',
        primaryReasonCode: 'CRACKED',
        validFrom: '',
        validTo: ''
      },
      {
        id: '2',
        subReasonCode: 'SUB2',
        subReasonDesc: 'Sub Reason 2',
        primaryReasonCode: 'CRACKED',
        validFrom: '',
        validTo: ''
      },
      {
        id: '3',
        subReasonCode: 'SUB3',
        subReasonDesc: 'Sub Reason 3',
        primaryReasonCode: 'INEFFECTIVE',
        validFrom: '',
        validTo: ''
      }
    ];

    const mockSubReason: CrackedIneffectiveSubReason = {
      id: '1',
      subReasonCode: 'SUB1',
      subReasonDesc: 'Sub Reason 1',
      primaryReasonCode: 'CRACKED',
      validFrom: '',
      validTo: ''
    };

    it('should handle loadCrackedIneffectiveSubReasons', () => {
      const action = HearingActions.loadCrackedIneffectiveSubReasons();
      const newState = hearingReducer(state, action);
      expect(newState).toEqual(state);
    });

    it('should handle loadCrackedIneffectiveSubReasonsSuccess', () => {
      const action = HearingActions.loadCrackedIneffectiveSubReasonsSuccess({
        subReasons: mockSubReasons
      });

      const newState = hearingReducer(state, action);

      expect(newState.subReasons).toEqual(mockSubReasons);
    });

    it('should handle loadCrackedIneffectiveSubReasonsFailure', () => {
      const error: ValidationError = { id: 'test-id', message: 'Error loading sub reasons' };
      const action = HearingActions.loadCrackedIneffectiveSubReasonsFailure({ error });

      const newState = hearingReducer(state, action);

      expect(newState.subReasons).toEqual([]);
    });

    it('should handle clearCrackedIneffectiveSubReasons', () => {
      const loadAction = HearingActions.loadCrackedIneffectiveSubReasonsSuccess({
        subReasons: mockSubReasons
      });
      let newState = hearingReducer(state, loadAction);
      expect(newState.subReasons).toEqual(mockSubReasons);

      const clearAction = HearingActions.clearCrackedIneffectiveSubReasons();
      newState = hearingReducer(newState, clearAction);

      expect(newState.subReasons).toEqual([]);
    });

    it('should handle loadCrackedIneffectiveSubReasonById', () => {
      const action = HearingActions.loadCrackedIneffectiveSubReasonById({
        subReasonId: '1'
      });

      const newState = hearingReducer(state, action);

      expect(newState.currentSubReasonLoading).toBe(true);
      expect(newState.currentSubReason).toBeNull();
    });

    it('should handle loadCrackedIneffectiveSubReasonByIdSuccess', () => {
      const action = HearingActions.loadCrackedIneffectiveSubReasonByIdSuccess({
        subReason: mockSubReason
      });

      const newState = hearingReducer(state, action);

      expect(newState.currentSubReason).toEqual(mockSubReason);
    });

    it('should handle loadCrackedIneffectiveSubReasonByIdSuccess without duplicating existing sub reason', () => {
      const loadAllAction = HearingActions.loadCrackedIneffectiveSubReasonsSuccess({
        subReasons: mockSubReasons
      });
      let newState = hearingReducer(state, loadAllAction);

      const action = HearingActions.loadCrackedIneffectiveSubReasonByIdSuccess({
        subReason: mockSubReasons[0]
      });
      newState = hearingReducer(newState, action);

      expect(newState.currentSubReason).toEqual(mockSubReasons[0]);
      expect(newState.currentSubReasonLoading).toBe(false);
      expect(newState.subReasons.length).toBe(3);
    });

    it('should handle loadCrackedIneffectiveSubReasonByIdFailure', () => {
      const error: ValidationError = { id: 'test-id', message: 'Sub reason not found' };
      const action = HearingActions.loadCrackedIneffectiveSubReasonByIdFailure({ error });

      const newState = hearingReducer(state, action);

      expect(newState.currentSubReason).toBeNull();
    });

    it('should handle empty sub reasons array in success action', () => {
      const action = HearingActions.loadCrackedIneffectiveSubReasonsSuccess({
        subReasons: []
      });

      const newState = hearingReducer(state, action);

      expect(newState.subReasons).toEqual([]);
    });

    it('should set trial effectiveness error with a single error', () => {
      const error: ValidationError[] = [
        {
          id: 'trial-effectiveness',
          message: 'Trial effectiveness is required'
        }
      ];

      const action = HearingActions.setTrialEffectivenessError({ error });
      const newState = hearingReducer(state, action);

      expect(newState.trialEffectivenessError).toEqual(error);
    });

    it('should set trial effectiveness error to null', () => {
      const error: ValidationError[] = [
        {
          id: 'trial-effectiveness',
          message: 'Trial effectiveness is required'
        }
      ];
      const setAction = HearingActions.setTrialEffectivenessError({ error });
      let newState = hearingReducer(state, setAction);
      expect(newState.trialEffectivenessError).toEqual(error);

      const clearAction = HearingActions.setTrialEffectivenessError({ error: null });
      newState = hearingReducer(newState, clearAction);

      expect(newState.trialEffectivenessError).toBeNull();
    });
  });
});
