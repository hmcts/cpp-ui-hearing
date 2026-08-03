export interface Address {
  address1: string;
  address2: string;
  address3: string;
  address4: string;
  address5: string;
  postcode: string;
  formatedAddress?: string;
}

export interface NotepadAddress extends Address {
  name: string;
  email1?: string;
  email2?: string;
}
