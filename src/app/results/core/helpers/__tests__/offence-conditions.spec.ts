import { OffenceConditionStatus } from '../../../../core/model/offence-condition-status';
import { Offence } from '../../../../magistrates/interfaces/magistrates-hearing.interface';
import { getOffenceConditions } from '../offence-conditions';
import { OffenceItem } from '../target';

describe('offence conditions', () => {
  describe('getOffenceConditions', () => {
    it('should return true value for displayElectronicMonitoringWarning and displayWarranArrestWarning', () => {
      const expectedOffenceConditionStatus: OffenceConditionStatus = {
        displayElectronicMonitoringWarning: true,
        displayWarranArrestWarning: true
      };
      const offenceItem: OffenceItem = {
        offenceId: '123'
      } as OffenceItem;
      const electronicMonitoringOffences: Offence[] = [
        {
          id: '123'
        } as Offence
      ];
      const warrantOfArrestOffences: Offence[] = [
        {
          id: '123'
        } as Offence
      ];

      expect(
        getOffenceConditions(offenceItem, electronicMonitoringOffences, warrantOfArrestOffences)
      ).toEqual(expectedOffenceConditionStatus);
    });

    it('should return false value for displayElectronicMonitoringWarning and displayWarranArrestWarning', () => {
      const expectedOffenceConditionStatus: OffenceConditionStatus = {
        displayElectronicMonitoringWarning: false,
        displayWarranArrestWarning: false
      };
      const offenceItem: OffenceItem = {
        offenceId: 'XYZ'
      } as OffenceItem;
      const electronicMonitoringOffences: Offence[] = [
        {
          id: '123'
        } as Offence
      ];
      const warrantOfArrestOffences: Offence[] = [
        {
          id: '123'
        } as Offence
      ];

      expect(
        getOffenceConditions(offenceItem, electronicMonitoringOffences, warrantOfArrestOffences)
      ).toEqual(expectedOffenceConditionStatus);
    });

    it('should return false value for displayElectronicMonitoringWarning and true for displayWarranArrestWarning', () => {
      const expectedOffenceConditionStatus: OffenceConditionStatus = {
        displayElectronicMonitoringWarning: false,
        displayWarranArrestWarning: true
      };
      const offenceItem: OffenceItem = {
        offenceId: '123'
      } as OffenceItem;
      const electronicMonitoringOffences: Offence[] = [
        {
          id: 'XYZ'
        } as Offence
      ];
      const warrantOfArrestOffences: Offence[] = [
        {
          id: '123'
        } as Offence
      ];

      expect(
        getOffenceConditions(offenceItem, electronicMonitoringOffences, warrantOfArrestOffences)
      ).toEqual(expectedOffenceConditionStatus);
    });

    it('should return true value for displayElectronicMonitoringWarning and false for displayWarranArrestWarning', () => {
      const expectedOffenceConditionStatus: OffenceConditionStatus = {
        displayElectronicMonitoringWarning: true,
        displayWarranArrestWarning: false
      };
      const offenceItem: OffenceItem = {
        offenceId: '123'
      } as OffenceItem;
      const electronicMonitoringOffences: Offence[] = [
        {
          id: '123'
        } as Offence
      ];
      const warrantOfArrestOffences: Offence[] = [
        {
          id: 'XYZ'
        } as Offence
      ];

      expect(
        getOffenceConditions(offenceItem, electronicMonitoringOffences, warrantOfArrestOffences)
      ).toEqual(expectedOffenceConditionStatus);
    });
  });
});
