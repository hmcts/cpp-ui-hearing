import { HearingDetail } from '../../../../core';
import { CourtApplication } from '../../../../core/model/court-application';
import { CourtApplicationCase } from '../../../../core/model/court-application-case';
import { Offence } from '../../../../core/model/offence';
import { isExParteCivilCase, ResultsState } from '..';

const buildOffence = (isExParte: boolean): Partial<Offence> => ({
  id: 'offence-1',
  civilOffence: { isExParte }
});

const buildOffenceWithoutCivilFlag = (): Partial<Offence> => ({
  id: 'offence-1'
});

const buildCourtApplicationCase = (offences: Partial<Offence>[]): CourtApplicationCase => ({
  prosecutionCaseIdentifier: { prosecutionCaseReference: 'T20210001' } as any,
  prosecutionCaseReference: 'T20210001',
  isSJP: false,
  prosecutionCaseId: 'case-1',
  offences: offences as Offence[]
});

const buildCourtApplication = (
  courtApplicationCases: CourtApplicationCase[]
): Partial<CourtApplication> =>
  ({
    id: 'app-1',
    applicationReference: 'ref-1',
    courtApplicationCases
  } as any);

const buildHearing = (courtApplications: Partial<CourtApplication>[]): Partial<HearingDetail> => ({
  id: 'hearing-1',
  courtApplications: courtApplications as CourtApplication[]
});

const buildState = (hearing: Partial<HearingDetail> | null): ResultsState =>
  ({
    hearings: { current: { hearing } },
    results: {}
  } as unknown as ResultsState);

describe('isExParteCivilCase selector', () => {
  describe('when hearing is null', () => {
    it('returns false', () => {
      expect(isExParteCivilCase(buildState(null))).toBe(false);
    });
  });

  describe('when hearing has no court applications', () => {
    it('returns false when courtApplications is undefined', () => {
      const hearing = buildHearing([]);
      delete (hearing as any).courtApplications;
      expect(isExParteCivilCase(buildState(hearing))).toBe(false);
    });

    it('returns false when courtApplications is an empty array', () => {
      expect(isExParteCivilCase(buildState(buildHearing([])))).toBe(false);
    });
  });

  describe('when court application has no courtApplicationCases', () => {
    it('returns false', () => {
      const app = { id: 'app-1', courtApplicationCases: undefined } as any;
      expect(isExParteCivilCase(buildState(buildHearing([app])))).toBe(false);
    });

    it('returns false when courtApplicationCases is an empty array', () => {
      const app = buildCourtApplication([]);
      expect(isExParteCivilCase(buildState(buildHearing([app])))).toBe(false);
    });
  });

  describe('when courtApplicationCase has no offences', () => {
    it('returns false when offences is undefined', () => {
      const cac = {
        ...buildCourtApplicationCase([]),
        offences: undefined as Offence[] | undefined
      };
      const app = buildCourtApplication([cac]);
      expect(isExParteCivilCase(buildState(buildHearing([app])))).toBe(false);
    });

    it('returns false when offences is an empty array', () => {
      const cac = buildCourtApplicationCase([]);
      const app = buildCourtApplication([cac]);
      expect(isExParteCivilCase(buildState(buildHearing([app])))).toBe(false);
    });
  });

  describe('when offences have no civilOffence flag', () => {
    it('returns false', () => {
      const cac = buildCourtApplicationCase([buildOffenceWithoutCivilFlag()]);
      const app = buildCourtApplication([cac]);
      expect(isExParteCivilCase(buildState(buildHearing([app])))).toBe(false);
    });
  });

  describe('when offences have civilOffence.isExParte = false', () => {
    it('returns false', () => {
      const cac = buildCourtApplicationCase([buildOffence(false)]);
      const app = buildCourtApplication([cac]);
      expect(isExParteCivilCase(buildState(buildHearing([app])))).toBe(false);
    });
  });

  describe('when at least one offence has civilOffence.isExParte = true', () => {
    it('returns true for a single ex-parte offence', () => {
      const cac = buildCourtApplicationCase([buildOffence(true)]);
      const app = buildCourtApplication([cac]);
      expect(isExParteCivilCase(buildState(buildHearing([app])))).toBe(true);
    });

    it('returns true when one offence is ex-parte among multiple offences', () => {
      const cac = buildCourtApplicationCase([
        buildOffence(false),
        buildOffenceWithoutCivilFlag(),
        buildOffence(true)
      ]);
      const app = buildCourtApplication([cac]);
      expect(isExParteCivilCase(buildState(buildHearing([app])))).toBe(true);
    });

    it('returns true when the ex-parte offence is in a second courtApplicationCase', () => {
      const nonExParteCac = buildCourtApplicationCase([buildOffence(false)]);
      const exParteCac = buildCourtApplicationCase([buildOffence(true)]);
      const app = buildCourtApplication([nonExParteCac, exParteCac]);
      expect(isExParteCivilCase(buildState(buildHearing([app])))).toBe(true);
    });

    it('returns true when the ex-parte offence is in a second court application', () => {
      const nonExParteApp = buildCourtApplication([
        buildCourtApplicationCase([buildOffence(false)])
      ]);
      const exParteApp = buildCourtApplication([buildCourtApplicationCase([buildOffence(true)])]);
      expect(isExParteCivilCase(buildState(buildHearing([nonExParteApp, exParteApp])))).toBe(true);
    });
  });

  describe('when all offences have civilOffence.isExParte = false', () => {
    it('returns false across multiple applications and cases', () => {
      const app1 = buildCourtApplication([
        buildCourtApplicationCase([buildOffence(false)]),
        buildCourtApplicationCase([buildOffenceWithoutCivilFlag()])
      ]);
      const app2 = buildCourtApplication([buildCourtApplicationCase([buildOffence(false)])]);
      expect(isExParteCivilCase(buildState(buildHearing([app1, app2])))).toBe(false);
    });
  });
});
