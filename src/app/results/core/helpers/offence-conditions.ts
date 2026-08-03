import { OffenceConditionStatus } from '../../../core/model/offence-condition-status';
import { Offence } from '../../../magistrates/interfaces/magistrates-hearing.interface';
import { OffenceItem } from './target';

export const getOffenceConditions = (
  offenceItem: OffenceItem,
  electronicMonitoringOffences: Offence[],
  warrantOfArrestOffences: Offence[]
): OffenceConditionStatus => {
  const offenceItemHasConditions = offenceOItemFunction(offenceItem);
  return {
    displayElectronicMonitoringWarning: offenceItemHasConditions(electronicMonitoringOffences),
    displayWarranArrestWarning: offenceItemHasConditions(warrantOfArrestOffences)
  };
};

const hasOffenceWithConditions = (
  conditionalOffences: Offence[] = [],
  offenceItemToCheck: OffenceItem
) => conditionalOffences.some(o => o.id === offenceItemToCheck.offenceId);

const offenceOItemFunction =
  (offenceItemToCheck: OffenceItem) =>
  (conditionalOffences: Offence[] = []) =>
    hasOffenceWithConditions(conditionalOffences, offenceItemToCheck);
