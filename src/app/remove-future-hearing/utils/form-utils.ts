import { RecordIndex } from '../model/record-index';

export function isFirstRowForHearing(
  caseIndex: number,
  defendantIndex: number,
  offenceIndex: number
) {
  return !(caseIndex > 0 || defendantIndex > 0 || offenceIndex > 0);
}

export function hasRowDisplayed(
  kaseIndex: number,
  defendantIndex: number,
  offenceIndex: number,
  name: string,
  hearingIndex: number,
  displayedRecordList: RecordIndex[]
) {
  if (
    !displayedRecordList.find(
      kase =>
        kase.hIndex === hearingIndex &&
        kase.kaseIndex === kaseIndex &&
        kase.defIndex === defendantIndex &&
        kase.name === name
    )
  ) {
    displayedRecordList.push({
      hIndex: hearingIndex,
      kaseIndex,
      defIndex: defendantIndex,
      offIndex: offenceIndex,
      name
    });
    return true;
  }
  return false;
}

export function hasOffenceDisplayed(
  kaseIndex: number,
  defendantIndex: number,
  offenceIndex: number,
  hearingIndex: number,
  displayedRecordList: RecordIndex[] = []
) {
  return displayedRecordList.find(
    kase =>
      kase.hIndex === hearingIndex &&
      kase.kaseIndex === kaseIndex &&
      kase.defIndex === defendantIndex &&
      kase.offIndex === offenceIndex
  );
}

export function isFirstRowForOffence(oIndex: number) {
  return !(oIndex > 0);
}
