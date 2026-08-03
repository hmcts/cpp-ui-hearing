export interface CompanyRepresentative {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  position: string;
  defendants: string[];
  attendanceDays: string[];
  caseUrn?: string;
}
