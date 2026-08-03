export interface HearingCaseLink {
  caseId?: string;
  applicationId?: string;
  type: HearingCaseLinkType;
}

export enum HearingCaseLinkType {
  CASE_AT_A_GLANCE = 'CASE_AT_A_GLANCE',
  APPLICATION_AT_A_GLANCE = 'APPLICATION_AT_A_GLANCE',
  CASE_MATERIAL = 'CASE_MATERIAL',
  APPLICATION_MATERIAL = 'APPLICATION_MATERIAL',
  ADD_APPLICATION = 'ADD_APPLICATION',
  ADD_CHILD_APPLICATION = 'ADD_CHILD_APPLICATION'
}
