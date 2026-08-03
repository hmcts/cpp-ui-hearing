import { Address } from './address';
import { ContactNumber } from './contact-number';

export interface Person {
  additionalNationalityCode: string;
  additionalNationalityDescription: string;
  additionalNationalityId: string;
  address: Address;
  contact: ContactNumber;
  dateOfBirth: string;
  disabilityStatus: string;
  documentationLanguageNeeds: string;
  ethnicityCode: string;
  ethnicityDescription: string;
  ethnicityId: string;
  firstName: string;
  gender: string;
  interpreterLanguageNeeds: string;
  lastName: string;
  middleName: string;
  nationalInsuranceNumber: string;
  nationalityCode: string;
  nationalityDescription: string;
  nationalityId: string;
  occupation: string;
  occupationCode: string;
  specificRequirements: string;
  title: string;
}
