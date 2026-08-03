const mock = {
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

export default mock;
