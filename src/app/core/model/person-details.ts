import { Address } from './address';
import { ContactNumber } from './contact-number';
export interface PersonDetails {
  title: string;
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  nationalityId: string;
  nationalityCode: string;
  nationalityDescription: string;
  additionalNationalityId: string;
  additionalNationalityCode: string;
  additionalNationalityDescription: string;
  disabilityStatus: string;
  ethnicityId: string;
  ethnicityCode: string;
  ethnicityDescription: string;
  gender: string;
  interpreterLanguageNeeds: string;
  documentationLanguageNeeds: string;
  nationalInsuranceNumber: string;
  occupation: string;
  occupationCode: string;
  specificRequirements: string;
  address: Address;
  contact: ContactNumber;
}

export type IndividualDefendant = PersonDetails & {
  defendantId: string;
  masterDefendantId: string;
};
