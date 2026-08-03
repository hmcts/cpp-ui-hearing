export const extractApplicantRespondentOrAppellantFromCourtApplication: any = [
  {
    id: '3eae93a4-9764-4a31-86fc-90ec64b73b26',
    personDefendant: {
      arrestSummonsNumber: 'TFL',
      bailStatus: {
        code: 'A',
        description: 'Not applicable',
        id: '86009c70-759d-3308-8de4-194886ff9a77'
      },
      personDetails: {
        address: {
          address1: '493 MALLERTON WAY',
          address2: 'DUNSTABLE',
          postcode: 'LN5 5TT'
        },
        contact: {
          home: '015324443756'
        },
        dateOfBirth: '1972-01-04',
        documentationLanguageNeeds: 'ENGLISH',
        ethnicity: {
          observedEthnicityCode: '1',
          observedEthnicityDescription: 'White - North European',
          observedEthnicityId: 'c4ca4238-a0b9-3382-8dcc-509a6f75849b',
          selfDefinedEthnicityCode: 'W1',
          selfDefinedEthnicityDescription: 'British',
          selfDefinedEthnicityId: 'c4ca4238-a0b9-3382-8dcc-509a6f75849b'
        },
        firstName: 'John',
        gender: 'MALE',
        hearingLanguageNeeds: 'ENGLISH',
        lastName: 'Smith',
        occupation: 'Accountant',
        occupationCode: '2201',
        title: 'MR'
      },
      policeBailStatus: {
        code: 'C',
        description: 'Custody or remanded into custody',
        id: '12e69486-4d01-3403-a50a-7419ca040635'
      }
    },
    masterDefendantId: 'f07a4bcd-08f7-4ab5-bf4d-948892a95cb2',
    type: {
      appealFlag: false,
      applicantAppellantFlag: false,
      boxworkNotifTemplate: 'NOT_APPLICABLE',
      breachType: 'NOT_APPLICABLE',
      categoryCode: 'CO',
      code: 'AP00501',
      commrOfOathFlag: false,
      courtExtractAvlFlag: true,
      courtOfAppealFlag: false,
      hearingCode: 'APN',
      id: '4e281610-96aa-3711-aecf-59df86b6c6bb',
      jurisdiction: 'EITHER',
      legislation: 'Refer to nature of application.',
      legislationWelsh: 'Cyfeiriwch at natur y cais.',
      linkType: 'LINKED',
      listingNotifTemplate: 'POSTAL_NOTIFICATION',
      offenceActiveOrder: 'OFFENCE',
      pleaApplicableFlag: false,
      prosecutorThirdPartyFlag: false,
      spiOutApplicableFlag: true,
      summonsTemplateType: 'NOT_APPLICABLE',
      type: 'Application within criminal proceedings',
      typeWelsh: 'Cais o fewn achos troseddol'
    },
    prosecutionCases: [
      {
        caseStatus: 'INACTIVE',
        isSJP: false,
        offences: [
          {
            arrestDate: '2019-09-12',
            chargeDate: '2019-09-12',
            count: 0,
            endorsableFlag: false,
            id: '171cb0dd-4457-4372-b30e-1f37eba3c67f',
            isDisposed: true,
            listingNumber: 1,
            maxPenalty: 'S:Ultd Fine',
            modeOfTrial: 'Summary',
            offenceCode: 'CA03014',
            offenceDateCode: 1,
            offenceDefinitionId: 'b86778e9-bf52-3b40-9549-a8710c2e77cb',
            offenceLegislation:
              'Contrary to section 366(8)(b) and (9) of the Communications Act 2003.',
            offenceLegislationWelsh: 'Yn groes i adran 366(8)(b) a (9) Deddf Cyfathrebu 2003.',
            offenceTitle:
              'Fail / refuse give assistance to person executing Communications Act search warrant',
            offenceTitleWelsh:
              "Methu / gwrthod rhoi cymorth i unigolyn sy'n gweithredu gwarant chwilio dan y Ddeddf Cyfathrebu",
            orderIndex: 1,
            proceedingsConcluded: true,
            startDate: '2019-09-12',
            wording:
              'On TEST  at  TEST  used or threatened unlawful violence towards another and your conduct was such as would cause a person of reasonable firmness present at the scene to fear for his personal safety. Contrary to section 3(1) and (7) of the Public Order Act 1986.',
            plea: {
              offenceId: '171cb0dd-4457-4372-b30e-1f37eba3c67f',
              originatingHearingId: '5ca62b9f-5f7c-4295-9ae8-35c7745dbf89',
              pleaDate: null,
              pleaValue: null
            },
            allocationDecision: {
              offenceId: '171cb0dd-4457-4372-b30e-1f37eba3c67f',
              originatingHearingId: '5ca62b9f-5f7c-4295-9ae8-35c7745dbf89',
              motReasonCode: null,
              motReasonDescription: null,
              motReasonId: null,
              courtIndicatedSentence: {}
            },
            verdict: {
              offenceId: '171cb0dd-4457-4372-b30e-1f37eba3c67f',
              verdictDate: null,
              verdictType: {
                id: null,
                code: '',
                description: '',
                category: '',
                categoryType: '',
                jurisdiction: ''
              },
              originatingHearingId: '5ca62b9f-5f7c-4295-9ae8-35c7745dbf89',
              lesserOrAlternativeOffence: null,
              jurors: {
                numberOfJurors: 12,
                numberOfSplitJurors: 0,
                unanimous: true
              }
            }
          }
        ],
        prosecutionCaseId: '68324ee9-3c88-4292-9824-2efd7ba7e46f',
        prosecutionCaseIdentifier: {
          address: {
            address1: 'Police HQ',
            address2: 'No 1 Waterwells Drive',
            address3: 'Quedgeley',
            address4: 'Gloucester',
            postcode: 'GL2 2AN'
          },
          contact: {
            primaryEmail: 'Resultingteam@gloucestershire.pnn.POLICE.UK'
          },
          majorCreditorCode: 'PO53',
          prosecutionAuthorityCode: 'GLOSPF',
          prosecutionAuthorityId: '9d38428b-7f9d-3aab-8269-f1427dd15c57',
          prosecutionAuthorityName: 'Gloucestershire Police',
          prosecutionAuthorityOUCode: '0530000',
          caseURN: '53NP7906824'
        }
      }
    ],
    label: 'applicant'
  }
];

export const hearingCourtApplication = {
  applicantCounsels: [],
  courtApplications: [
    {
      applicant: {
        defendant: {
          id: '1',
          legalEntityDefendant: {
            organisation: {
              name: 'Applicant Legal Entity'
            }
          }
        },
        id: '3adf7c90-7fc4-4c42-a79c-748c1e64f982',
        synonym: 'Attendees'
      },
      applicationDecisionSoughtByDate: '',
      applicationOutcome: null,
      applicationParticulars: '',
      applicationReceivedDate: '2019-06-05',
      applicationReference: '48CU888909',
      applicationStatus: 'DRAFT',
      id: '9fc0a60e-44d0-45bd-a71b-dfc0953a6635',
      courtApplicationPayment: null,
      judicialResults: [],
      linkedApplicationId: '',
      linkedCaseId: '3',
      outOfTimeReasons: '',
      respondents: [
        {
          partyDetails: {
            id: '421b0a0a-a7f1-46f9-b142-f85d5d3e95a2',
            defendant: {
              id: '1',
              legalEntityDefendant: {
                organisation: {
                  name: 'Respondent Legal Entity'
                }
              }
            },
            synonym: 'Respondent'
          }
        }
      ],
      respondentsNA: false,
      type: {
        applicationCategory: 'CO',
        applicationCode: 'MC80527',
        applicationJurisdictionType: 'EITHER',
        applicationLegislation: `In accordance with section 14 of the Magistrates' Courts Act 1980`,
        applicationType: 'Appearance to make statutory declaration',
        id: 'a1d421a1-4f0f-4c9f-8a20-a960e25a0894',
        linkType: 'EITHER',
        respondentSynonym: 'Prosecutor'
      }
    }
  ],
  courtCentre: {
    id: 'f8254db1-1683-483e-afb3-b87fde5a0a26',
    name: `Lavender Hill Magistrates' Court`,
    roomId: '9e4932f7-97b2-3010-b942-ddd2624e4dd8',
    roomName: 'Courtroom 01',
    welshName: 'Llys Ynadon Lavender Hill',
    welshRoomName: 'Ystafell 01'
  },
  defenceCounsels: [],
  companyRepresentatives: [
    {
      id: '1',
      firstName: 'David',
      lastName: 'Hills',
      title: '',
      position: 'DIRECTOR',
      attendanceDays: ['2019-07-30'],
      defendants: ['']
    },
    {
      id: '2',
      firstName: 'Darren',
      lastName: 'Clark',
      title: '',
      position: 'SECRETARY',
      attendanceDays: ['2019-07-30'],
      defendants: ['']
    }
  ],
  defendantAttendance: [],
  defendantReferralReasons: [
    {
      defendantId: '337fb790-adfd-11e9-9ea8-73f777213b3e',
      description: 'defendantReferralReasons',
      id: '337fb792-adfd-11e9-9ea8-73f777213b3e'
    }
  ],
  hasSharedResults: true,
  hearingCaseNotes: [],
  hearingDays: [
    {
      listedDurationMinutes: 40,
      listingSequence: 1,
      sittingDay: '2019-07-24T10:24:21.386Z'
    },
    {
      listedDurationMinutes: 40,
      listingSequence: 1,
      sittingDay: '2019-07-25T10:24:21.385Z'
    }
  ],
  hearingLanguage: 'ENGLISH',
  id: '337fb791-adfd-11e9-9ea8-73f777213b3e',
  judiciary: [
    {
      firstName: 'Cole',
      isBenchChairman: true,
      isDeputy: false,
      judicialId: '337fdea0-adfd-11e9-9ea8-73f777213b3e',
      judicialRoleType: {
        judiciaryType: 'MAGISTRATE'
      },
      lastName: 'Misuri',
      middleName: 'Leon',
      title: 'Mr'
    },
    {
      firstName: 'Christian',
      isBenchChairman: true,
      isDeputy: false,
      judicialId: '337fdea1-adfd-11e9-9ea8-73f777213b3e',
      judicialRoleType: {
        judiciaryType: 'MAGISTRATE'
      },
      lastName: 'Hall',
      middleName: 'Ethan',
      title: 'Mr'
    }
  ],
  jurisdictionType: 'CROWN',
  prosecutionCases: [
    {
      caseStatus: 'SJP Referral',
      defendants: [
        {
          associatedPersons: [
            {
              person: {
                additionalNationalityCode: 'GBP',
                additionalNationalityId: '25f26487-6065-4680-9706-9398fa0ea030',
                address: {
                  address1: '233',
                  address2: 'Fuse Road',
                  address3: 'Croydon',
                  address4: 'SouthLondon ',
                  address5: 'London',
                  postcode: 'U5K 9LX'
                },
                contact: {
                  fax: '765997700',
                  home: '759019681',
                  mobile: '1444010616',
                  primaryEmail: 'zdivwdsblf@gxvm7kqbh4.duzrohmbtt',
                  secondaryEmail: 'dusl1j0oxw@0rzelb2mln.rvjnuth3ar',
                  work: '584591171'
                },
                dateOfBirth: '2017-03-26',
                disabilityStatus: 'No',
                ethnicity: {
                  observedEthnicityCode: 'British',
                  observedEthnicityDescription: 'observedEthnicityDescription',
                  observedEthnicityId: '95be16c7-91c2-4b09-9639-535c54f03a0e',
                  selfDefinedEthnicityCode: 'British',
                  selfDefinedEthnicityDescription: 'selfDefinedEthnicityDescription',
                  selfDefinedEthnicityId: '95be16c7-91c2-4b09-9639-535c54f03a0e'
                },
                firstName: 'FirstName',
                gender: 'MALE',
                interpreterLanguageNeeds: 'No',
                lastName: 'LastName',
                middleName: 'MiddleName',
                nationalInsuranceNumber: 'EZ814857C',
                nationalityCode: 'GBP',
                nationalityId: '47688578-d9a6-497b-8a73-340043448df6',
                occupation: 'Service',
                occupationCode: 'SER',
                specificRequirements: 'No',
                title: 'MR'
              },
              role: 'ABC'
            }
          ],
          defenceOrganisation: {
            address: {
              address1: 'defenceOrganisation',
              address2: '225',
              address3: 'FuseRoad',
              address4: 'East Croydon',
              address5: 'SouthLondon',
              postcode: 'LN72 9NG'
            },
            contact: {
              fax: '765997700',
              home: '759019681',
              mobile: '1444010616',
              primaryEmail: 'zdivwdsblf@gxvm7kqbh4.duzrohmbtt',
              secondaryEmail: 'dusl1j0oxw@0rzelb2mln.rvjnuth3ar',
              work: '584591171'
            },
            incorporationNumber: 'cegH7rIgdX',
            name: 'Test',
            registeredCharityNumber: 'TestCharity'
          },
          id: '337fb790-adfd-11e9-9ea8-73f777213b3e',
          legalEntityDefendant: {
            organisation: {
              address: {
                address1: 'Some Building',
                address2: '444 Fuse Road',
                address3: 'Esst Croydon',
                address4: 'South London',
                address5: 'London',
                postcode: 'N08 9JD'
              },
              contact: {
                fax: '765997700',
                home: '759019681',
                mobile: '1444010616',
                primaryEmail: 'zdivwdsblf@gxvm7kqbh4.duzrohmbtt',
                secondaryEmail: 'dusl1j0oxw@0rzelb2mln.rvjnuth3ar',
                work: '584591171'
              },
              incorporationNumber: 'Jwo9KG3JWW',
              name: 'TestNameLei',
              registeredCharityNumber: 'TestCharityLEi'
            }
          },
          numberOfPreviousConvictionsCited: 1950828793,
          offences: [
            {
              arrestDate: '2018-01-01',
              chargeDate: '2018-01-31',
              count: 2,
              endDate: '2018-08-30',
              id: '337fdea3-adfd-11e9-9ea8-73f777213b3e',
              indicatedPlea: {
                allocationDecision: {
                  courtDecision: 'CONSENT_SUMMARY_TRIAL',
                  defendantRepresentation: 'ELECT_TRIAL_ON_INDICTMENT',
                  indicationOfSentence: 'jSce28pitA',
                  prosecutionRepresentation: 'ELECT_TRIAL_ON_INDICTMENT'
                },
                indicatedPleaDate: '2018-02-14',
                indicatedPleaValue: 'INDICATED_GUILTY',
                offenceId: '337fdea3-adfd-11e9-9ea8-73f777213b3e',
                source: 'ONLINE'
              },
              modeOfTrial: 'modeOfTrial',
              notifiedPlea: {
                notifiedPleaDate: '2018-06-24',
                notifiedPleaValue: 'NO_NOTIFICATION',
                offenceId: '337fdea3-adfd-11e9-9ea8-73f777213b3e'
              },
              offenceCode: 'OFF123',
              offenceDefinitionId: 'ec09757a-bf2a-4f30-9887-94e0eee26206',
              offenceFacts: {
                alcoholReadingAmount: 100,
                alcoholReadingMethodCode: 'pipe',
                vehicleRegistration: 'ABC bbc'
              },
              offenceLegislation: 'Contrary to section 1(1)    of the Criminal Attempts Act 1981.',
              offenceLegislationWelsh: 'Yn groes i Adran 1(1) Deddf Ymgeisiau i Droseddu 1981.',
              offenceTitle: 'Section 18 - attempt wounding with intent',
              offenceTitleWelsh: 'Adran 18 - ymgais i glwyfo gan fwriadu',
              orderIndex: 634464054,
              plea: {
                offenceId: '337fdea3-adfd-11e9-9ea8-73f777213b3e',
                originatingHearingId: '337fb791-adfd-11e9-9ea8-73f777213b3e',
                pleaDate: '2019-07-24',
                pleaValue: 'NOT_GUILTY'
              },
              startDate: '2018-11-20',
              verdict: {
                jurors: {
                  numberOfJurors: 12,
                  numberOfSplitJurors: 0,
                  unanimous: true
                },
                lesserOrAlternativeOffence: {
                  offenceCode: 'OFF123',
                  offenceDefinitionId: 'ec09757a-bf2a-4f30-9887-94e0eee26206',
                  offenceLegislation:
                    'Contrary to section 1(1)    of the Criminal Attempts Act 1981.',
                  offenceTitle: 'Section 18 - attempt wounding with intent'
                },
                offenceId: '337fdea3-adfd-11e9-9ea8-73f777213b3e',
                originatingHearingId: '337fb791-adfd-11e9-9ea8-73f777213b3e',
                verdictDate: '2019-07-24',
                verdictType: {
                  category: 'Not Guilty',
                  categoryType: 'NOT_GUILTY',
                  id: 'c81e728d-9d4c-3f63-af06-7f89cc14862c'
                }
              },
              wording: 'Offence wording',
              wordingWelsh: 'Offence wording in Welsh'
            }
          ],
          prosecutionAuthorityReference: 'prosecutionAuthorityReference',
          prosecutionCaseId: '337fdea2-adfd-11e9-9ea8-73f777213b3e',
          witnessStatement: 'he did not do it',
          witnessStatementWelsh: 'he did not do it in Welsh',
          mitigation: 'I was not there',
          mitigationWelsh: 'I was not there in Welsh'
        }
      ],
      id: '337fdea2-adfd-11e9-9ea8-73f777213b3e',
      initiationCode: 'J',
      originatingOrganisation: 'G01FT01AB',
      prosecutionCaseIdentifier: {
        prosecutionAuthorityCode: 'TFL',
        prosecutionAuthorityId: '33802cc0-adfd-11e9-9ea8-73f777213b3e',
        caseURN: '20XG265184'
      }
    }
  ],
  prosecutionCounsels: [],
  reportingRestrictionReason: 'Automatic anonymity under the Sexual Offences (Amendment) Act 1992',
  respondentCounsels: [],
  type: {
    description: '20XG265184',
    id: 'bf8155e1-90b9-4080-b133-bfbad895d6e4'
  }
} as any;
