import { Address } from './address';
import { ContactNumber } from './contact-number';

export interface EmployerOrganisation {
  id: string;
  name: string;
  incorporationNumber: string;
  address: Address;
  contact: ContactNumber;
}
