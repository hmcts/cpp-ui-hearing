import { Address } from './address';
import { ContactNumber } from './contact-number';

export interface ProsecutingAuthority {
  accountCode: string;
  address: Address;
  contact: ContactNumber;
  name: string;
  prosecutionAuthorityCode: string;
  prosecutionAuthorityId: string;
}
