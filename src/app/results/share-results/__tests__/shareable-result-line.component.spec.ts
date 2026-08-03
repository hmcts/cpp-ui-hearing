import { HearingLockState } from '../../../core';
import { createResolvedDraftResultLine } from '../../core/testing';
import { ResolvedDraftResultLine } from '../../results.interfaces';
import { ShareableResultLineComponent } from '../shareable-result-line.component';

const createResultLine = (
  overrides: Partial<ResolvedDraftResultLine> = {}
): ResolvedDraftResultLine => {
  const resultLine: ResolvedDraftResultLine = {
    ...createResolvedDraftResultLine({
      resultLineId: 'result-line-1',
      shortCode: 'AD',
      orderedDate: '2020-01-01',
      applicationId: 'application-1'
    }),
    ...overrides
  };
  return resultLine;
};

const createComponent = ({
  resultLine = createResultLine(),
  hearingLockState = HearingLockState.INITIALISED,
  amendApplicationPermission,
  isCourtApplicationFinalised = false,
  isAmendmentAllowed = false,
  caseStatus = ''
}: {
  resultLine?: ResolvedDraftResultLine;
  hearingLockState?: HearingLockState;
  amendApplicationPermission: boolean;
  isCourtApplicationFinalised?: boolean;
  isAmendmentAllowed?: boolean;
  caseStatus?: string;
}): ShareableResultLineComponent => {
  const component = new ShareableResultLineComponent();
  component.resultLine = resultLine;
  component.hearingLockState = hearingLockState;
  component.amendApplicationPermission = amendApplicationPermission;
  component.isCourtApplicationFinalised = isCourtApplicationFinalised;
  component.isAmendmentAllowed = isAmendmentAllowed;
  component.caseStatus = caseStatus;
  component.ngOnChanges({});
  return component;
};

describe('ShareableResultLineComponent', () => {
  describe('hasAmendApplication when the user has the amend application permission', () => {
    it.each(['ACTIVE', 'INACTIVE'])(
      'should not offer amending when the application is finalised and amendment is not allowed and the case status is %s',
      caseStatus => {
        const component = createComponent({
          amendApplicationPermission: true,
          isCourtApplicationFinalised: true,
          isAmendmentAllowed: false,
          caseStatus
        });

        expect(component.hasAmendApplication).toBe(false);
      }
    );

    it('should not offer amending when the application is finalised and amendment is not allowed and no case status is provided', () => {
      const component = new ShareableResultLineComponent();
      component.resultLine = createResultLine();
      component.hearingLockState = HearingLockState.INITIALISED;
      component.amendApplicationPermission = true;
      component.isCourtApplicationFinalised = true;
      component.isAmendmentAllowed = false;
      component.ngOnChanges({});

      expect(component.hasAmendApplication).toBe(false);
    });

    it.each(['ACTIVE', 'INACTIVE'])(
      'should offer amending when the application is finalised and amendment is allowed and the case status is %s',
      caseStatus => {
        const component = createComponent({
          amendApplicationPermission: true,
          isCourtApplicationFinalised: true,
          isAmendmentAllowed: true,
          caseStatus
        });

        expect(component.hasAmendApplication).toBe(true);
      }
    );

    it.each(['ACTIVE', 'INACTIVE'])(
      'should offer amending when the application is not finalised and the case status is %s',
      caseStatus => {
        const component = createComponent({
          amendApplicationPermission: true,
          isCourtApplicationFinalised: false,
          caseStatus
        });

        expect(component.hasAmendApplication).toBe(true);
      }
    );

    it('should not offer amending when the result line is deleted even though the application is not finalised', () => {
      const component = createComponent({
        resultLine: createResultLine({ deleted: true }),
        amendApplicationPermission: true,
        isCourtApplicationFinalised: false
      });

      expect(component.hasAmendApplication).toBe(false);
    });

    it('should not offer amending when the result line is deleted even though the application is finalised with amendment allowed', () => {
      const component = createComponent({
        resultLine: createResultLine({ deleted: true }),
        amendApplicationPermission: true,
        isCourtApplicationFinalised: true,
        isAmendmentAllowed: true
      });

      expect(component.hasAmendApplication).toBe(false);
    });

    it('should not offer amending when amendments are locked even though the application is not finalised', () => {
      const component = createComponent({
        hearingLockState: HearingLockState.VALIDATED,
        amendApplicationPermission: true,
        isCourtApplicationFinalised: false
      });

      expect(component.hasAmendApplication).toBe(false);
    });
  });

  describe('hasAmendApplication when the user does not have the amend application permission', () => {
    it.each(['ACTIVE', 'INACTIVE'])(
      'should offer amending for a finalised application without amendment allowed when the case status is %s',
      caseStatus => {
        const component = createComponent({
          amendApplicationPermission: false,
          isCourtApplicationFinalised: true,
          isAmendmentAllowed: false,
          caseStatus
        });

        expect(component.hasAmendApplication).toBe(true);
      }
    );

    it('should offer amending when the result line is active and the hearing is shared', () => {
      const component = createComponent({
        hearingLockState: HearingLockState.SHARED,
        amendApplicationPermission: false
      });

      expect(component.hasAmendApplication).toBe(true);
    });

    it('should not offer amending when the result line is deleted', () => {
      const component = createComponent({
        resultLine: createResultLine({ deleted: true }),
        amendApplicationPermission: false
      });

      expect(component.hasAmendApplication).toBe(false);
    });

    it('should not offer amending when amendments are locked', () => {
      const component = createComponent({
        hearingLockState: HearingLockState.APPROVAL_REQUESTED,
        amendApplicationPermission: false
      });

      expect(component.hasAmendApplication).toBe(false);
    });
  });
});
