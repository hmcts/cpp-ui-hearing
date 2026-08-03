import { OverlayRef } from '@angular/cdk/overlay';
import { ModalService } from '@cpp/pdk';
import { ApplicationAggregate, CourtApplication } from '../../../core';
import { createResolvedDraftResultLine } from '../../core/testing';
import { ShareResultActionBarComponent } from '../share-result-action-bar.component';
import { ShareResultConfirmationData } from '../share-result-confirmation-form.component';

const createCourtApplication = (overrides: Partial<CourtApplication> = {}): CourtApplication => {
  const application: Partial<CourtApplication> = {
    id: 'application-1',
    applicationStatus: 'LISTED',
    ...overrides
  };
  return application as CourtApplication;
};

const createApplicationJourney = (applications: CourtApplication[]): ApplicationAggregate[] => {
  const aggregate: Partial<ApplicationAggregate> = { applications };
  return [aggregate as ApplicationAggregate];
};

describe('ShareResultActionBarComponent', () => {
  let component: ShareResultActionBarComponent;
  let openMock: jest.Mock;
  let disposeMock: jest.Mock;
  let shareDraftResultSpy: jest.Mock;
  let standaloneAncillaryResultsSpy: jest.Mock;

  const getConfirmationActions = (): ShareResultConfirmationData => openMock.mock.calls[0][1].data;

  beforeEach(() => {
    disposeMock = jest.fn();
    const overlayRef: Partial<OverlayRef> = { dispose: disposeMock };
    openMock = jest.fn().mockReturnValue(overlayRef as OverlayRef);
    const modalService: Partial<ModalService> = { open: openMock };

    component = new ShareResultActionBarComponent(modalService as ModalService);

    shareDraftResultSpy = jest.fn();
    standaloneAncillaryResultsSpy = jest.fn();
    component.shareDraftResult.subscribe(shareDraftResultSpy);
    component.standaloneAncillaryResults.subscribe(standaloneAncillaryResultsSpy);
  });

  const configureComponent = ({
    amendApplicationPermission,
    caseStatus = '',
    isApplicationJourney = [],
    targetIdsForHearing = ['target-1', 'target-2'],
    targetIdsWithActiveShareableResults = ['target-1']
  }: {
    amendApplicationPermission: boolean;
    caseStatus?: string;
    isApplicationJourney?: ApplicationAggregate[];
    targetIdsForHearing?: string[];
    targetIdsWithActiveShareableResults?: string[];
  }): void => {
    component.amendApplicationPermission = amendApplicationPermission;
    component.caseStatus = caseStatus;
    component.isApplicationJourney = isApplicationJourney;
    component['targetIdsForHearing'] = targetIdsForHearing;
    component['targetIdsWithActiveShareableResults'] = targetIdsWithActiveShareableResults;
  };

  describe('handleShareDraftResult when the user has the amend application permission', () => {
    it.each(['ACTIVE', 'INACTIVE'])(
      'should share immediately without the confirmation modal when the application is finalised without amendment allowed and targets are unresulted and the case status is %s',
      async caseStatus => {
        configureComponent({
          amendApplicationPermission: true,
          caseStatus,
          isApplicationJourney: createApplicationJourney([
            createCourtApplication({ applicationStatus: 'FINALISED' })
          ])
        });

        await component.handleShareDraftResult();

        expect(openMock).not.toHaveBeenCalled();
        expect(shareDraftResultSpy).toHaveBeenCalledTimes(1);
      }
    );

    it('should share immediately without the confirmation modal when the application is finalised without amendment allowed and no case status is provided', async () => {
      component.amendApplicationPermission = true;
      component.isApplicationJourney = createApplicationJourney([
        createCourtApplication({ applicationStatus: 'FINALISED' })
      ]);
      component['targetIdsForHearing'] = ['target-1', 'target-2'];
      component['targetIdsWithActiveShareableResults'] = ['target-1'];

      await component.handleShareDraftResult();

      expect(openMock).not.toHaveBeenCalled();
      expect(shareDraftResultSpy).toHaveBeenCalledTimes(1);
    });

    it('should open the confirmation modal when the application is finalised with amendment allowed and targets are unresulted', async () => {
      configureComponent({
        amendApplicationPermission: true,
        caseStatus: 'ACTIVE',
        isApplicationJourney: createApplicationJourney([
          createCourtApplication({ applicationStatus: 'FINALISED', amendmentAllowed: true })
        ])
      });

      const sharePromise = component.handleShareDraftResult();

      expect(openMock).toHaveBeenCalledTimes(1);
      expect(shareDraftResultSpy).not.toHaveBeenCalled();

      getConfirmationActions().onSubmit();
      await sharePromise;

      expect(disposeMock).toHaveBeenCalledTimes(1);
      expect(shareDraftResultSpy).toHaveBeenCalledTimes(1);
    });

    it('should open the confirmation modal when the application is not finalised and targets are unresulted', async () => {
      configureComponent({
        amendApplicationPermission: true,
        caseStatus: 'ACTIVE',
        isApplicationJourney: createApplicationJourney([createCourtApplication()])
      });

      const sharePromise = component.handleShareDraftResult();

      expect(openMock).toHaveBeenCalledTimes(1);
      expect(shareDraftResultSpy).not.toHaveBeenCalled();

      getConfirmationActions().onCancel();
      await sharePromise;

      expect(disposeMock).toHaveBeenCalledTimes(1);
      expect(shareDraftResultSpy).not.toHaveBeenCalled();
    });

    it('should ignore finalised child applications when determining whether to skip the confirmation modal', async () => {
      configureComponent({
        amendApplicationPermission: true,
        caseStatus: 'ACTIVE',
        isApplicationJourney: createApplicationJourney([
          createCourtApplication({
            applicationStatus: 'FINALISED',
            parentApplicationId: 'parent-application-1'
          })
        ])
      });

      const sharePromise = component.handleShareDraftResult();

      expect(openMock).toHaveBeenCalledTimes(1);

      getConfirmationActions().onCancel();
      await sharePromise;

      expect(shareDraftResultSpy).not.toHaveBeenCalled();
    });

    it('should share immediately without the confirmation modal when all targets have active shareable results', async () => {
      configureComponent({
        amendApplicationPermission: true,
        caseStatus: 'ACTIVE',
        isApplicationJourney: createApplicationJourney([createCourtApplication()]),
        targetIdsForHearing: ['target-1'],
        targetIdsWithActiveShareableResults: ['target-1']
      });

      await component.handleShareDraftResult();

      expect(openMock).not.toHaveBeenCalled();
      expect(shareDraftResultSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleShareDraftResult when the user does not have the amend application permission', () => {
    it.each(['ACTIVE', 'INACTIVE'])(
      'should open the confirmation modal when targets are unresulted even though the application is finalised and the case status is %s',
      async caseStatus => {
        configureComponent({
          amendApplicationPermission: false,
          caseStatus,
          isApplicationJourney: createApplicationJourney([
            createCourtApplication({ applicationStatus: 'FINALISED' })
          ])
        });

        const sharePromise = component.handleShareDraftResult();

        expect(openMock).toHaveBeenCalledTimes(1);
        expect(shareDraftResultSpy).not.toHaveBeenCalled();

        getConfirmationActions().onSubmit();
        await sharePromise;

        expect(disposeMock).toHaveBeenCalledTimes(1);
        expect(shareDraftResultSpy).toHaveBeenCalledTimes(1);
      }
    );

    it('should share immediately without the confirmation modal when all targets have active shareable results', async () => {
      configureComponent({
        amendApplicationPermission: false,
        targetIdsForHearing: ['target-1'],
        targetIdsWithActiveShareableResults: ['target-1']
      });

      await component.handleShareDraftResult();

      expect(openMock).not.toHaveBeenCalled();
      expect(shareDraftResultSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleShareDraftResult when there are non-valid ancillary results', () => {
    it('should emit the standalone ancillary results and not share or open the confirmation modal', async () => {
      configureComponent({ amendApplicationPermission: false });
      const nonValidAncillaryResult = createResolvedDraftResultLine({
        resultLineId: 'result-line-1',
        shortCode: 'AD',
        orderedDate: '2020-01-01',
        applicationId: 'application-1'
      });
      component['nonValidAncillaryResults'] = [nonValidAncillaryResult];

      await component.handleShareDraftResult();

      expect(standaloneAncillaryResultsSpy).toHaveBeenCalledWith([nonValidAncillaryResult]);
      expect(openMock).not.toHaveBeenCalled();
      expect(shareDraftResultSpy).not.toHaveBeenCalled();
    });
  });
});
