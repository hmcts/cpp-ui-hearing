import { ChangeDetectorRef } from '@angular/core';
import { CourtApplication } from '../../../../core';
import { AmendmentService } from '../../../common/services/amendment.service';
import { DraftStatus } from '../../../results.interfaces';
import { DraftResultApplicationComponent } from '../draft-result-application.component';

describe('DraftResultApplicationComponent', () => {
  const finalisedApplication = {
    id: 'applicationId',
    applicationStatus: 'FINALISED'
  } as CourtApplication;

  const finalisedApplicationWithAmendmentAllowed = {
    id: 'applicationId',
    applicationStatus: 'FINALISED',
    amendmentAllowed: true
  } as CourtApplication;

  const finalisedApplicationWithAmendmentBlocked = {
    id: 'applicationId',
    applicationStatus: 'FINALISED',
    amendmentAllowed: false
  } as CourtApplication;

  const listedApplication = {
    id: 'applicationId',
    applicationStatus: 'LISTED'
  } as CourtApplication;

  const createComponent = ({
    application,
    draftStatus = 'DRAFT',
    amendApplicationPermission = false,
    caseStatus
  }: {
    application: CourtApplication;
    draftStatus?: DraftStatus;
    amendApplicationPermission?: boolean;
    caseStatus?: string;
  }): DraftResultApplicationComponent => {
    const changeDetectorRefMock: Partial<ChangeDetectorRef> = {
      detectChanges: jest.fn()
    };
    const amendmentServiceMock: Partial<AmendmentService> = {
      requestAmendmentReason: jest.fn()
    };
    const component = new DraftResultApplicationComponent(
      changeDetectorRefMock as ChangeDetectorRef,
      amendmentServiceMock as AmendmentService
    );

    component.application = application;
    component.draftStatus = draftStatus;
    component.amendApplicationPermission = amendApplicationPermission;
    if (caseStatus) {
      component.caseStatus = caseStatus;
    }
    component.ngOnChanges({});

    return component;
  };

  describe('hasAmendApplication gate with the amend application permission', () => {
    it('should block amending a finalised application without amendment allowed when no case status is set', () => {
      const component = createComponent({
        application: finalisedApplication,
        amendApplicationPermission: true
      });

      expect(component.hasAmendApplication).toBeFalsy();
    });

    it.each(['ACTIVE', 'INACTIVE'])(
      'should block amending a finalised application without amendment allowed when the case status is %s',
      (caseStatus: string) => {
        const component = createComponent({
          application: finalisedApplication,
          amendApplicationPermission: true,
          caseStatus
        });

        expect(component.hasAmendApplication).toBeFalsy();
      }
    );

    it.each(['ACTIVE', 'INACTIVE'])(
      'should block amending a finalised application when amendment allowed is false and the case status is %s',
      (caseStatus: string) => {
        const component = createComponent({
          application: finalisedApplicationWithAmendmentBlocked,
          amendApplicationPermission: true,
          caseStatus
        });

        expect(component.hasAmendApplication).toBe(false);
      }
    );

    it.each(['ACTIVE', 'INACTIVE'])(
      'should allow amending a finalised application when amendment is allowed and the case status is %s',
      (caseStatus: string) => {
        const component = createComponent({
          application: finalisedApplicationWithAmendmentAllowed,
          amendApplicationPermission: true,
          caseStatus
        });

        expect(component.hasAmendApplication).toBe(true);
      }
    );

    it('should allow amending a finalised application when amendment is allowed and no case status is set', () => {
      const component = createComponent({
        application: finalisedApplicationWithAmendmentAllowed,
        amendApplicationPermission: true
      });

      expect(component.hasAmendApplication).toBe(true);
    });

    it('should allow amending a non-finalised application', () => {
      const component = createComponent({
        application: listedApplication,
        amendApplicationPermission: true
      });

      expect(component.hasAmendApplication).toBe(true);
    });

    it('should block amending a non-finalised application when the draft status is READONLY', () => {
      const component = createComponent({
        application: listedApplication,
        amendApplicationPermission: true,
        draftStatus: 'READONLY'
      });

      expect(component.hasAmendApplication).toBe(false);
    });

    it('should block amending a finalised application with amendment allowed when the draft status is READONLY', () => {
      const component = createComponent({
        application: finalisedApplicationWithAmendmentAllowed,
        amendApplicationPermission: true,
        draftStatus: 'READONLY'
      });

      expect(component.hasAmendApplication).toBe(false);
    });
  });

  describe('hasAmendApplication gate without the amend application permission', () => {
    it('should allow amending a finalised application without amendment allowed when no case status is set', () => {
      const component = createComponent({
        application: finalisedApplication
      });

      expect(component.hasAmendApplication).toBe(true);
    });

    it.each(['ACTIVE', 'INACTIVE'])(
      'should allow amending a finalised application without amendment allowed when the case status is %s',
      (caseStatus: string) => {
        const component = createComponent({
          application: finalisedApplication,
          caseStatus
        });

        expect(component.hasAmendApplication).toBe(true);
      }
    );

    it('should allow amending a non-finalised application', () => {
      const component = createComponent({
        application: listedApplication
      });

      expect(component.hasAmendApplication).toBe(true);
    });

    it.each(['ACTIVE', 'INACTIVE'])(
      'should block amending when the draft status is READONLY and the case status is %s',
      (caseStatus: string) => {
        const component = createComponent({
          application: finalisedApplication,
          draftStatus: 'READONLY',
          caseStatus
        });

        expect(component.hasAmendApplication).toBe(false);
      }
    );
  });
});
