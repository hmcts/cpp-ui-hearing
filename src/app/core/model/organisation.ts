import { Address } from './address';
import { ContactNumber } from './contact-number';

export interface Organisation {
  id?: string;
  address: Address;
  contact: ContactNumber;
  incorporationNumber: string;
  name: string;
  registeredCharityNumber: string;
}
