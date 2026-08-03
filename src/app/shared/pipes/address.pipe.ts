import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'address' })
export class AddressPipe implements PipeTransform {
  private readonly propertyNames = [
    'address1',
    'address2',
    'address3',
    'address4',
    'address5',
    'addressLine1',
    'addressLine2',
    'addressLine3',
    'addressLine4',
    'addressLine5',
    'postcode',
    'postCode',
    'addressPostcode',
    'addressPostCode'
  ];

  transform(
    address?: {
      address1?: string;
      address2?: string;
      address3?: string;
      address4?: string;
      address5?: string;
      addressLine1?: string;
      addressLine2?: string;
      addressLine3?: string;
      addressLine4?: string;
      addressLine5?: string;
      postcode?: string;
      postCode?: string;
      addressPostcode?: string;
      addressPostCode?: string;
    },
    multiLine = false
  ): string {
    if (!address) {
      return '';
    }
    return this.propertyNames
      .filter(propName => !!(address as any)[propName])
      .map(existingProperty => (address as any)[existingProperty])
      .map(a => a.trim())
      .join(multiLine ? '<br>' : ', ');
  }
}
