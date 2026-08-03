export interface DefenceCounsel {
  id: string;
  title: string;
  firstName: string;
  middleName: string;
  lastName: string;
  status: string;
  defendants: string[];
  attendanceDays: string[];
  caseUrn?: string;
}
