import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { Address } from '../../../core';

@Component({
  selector: 'one-line-address',
  template: ` <span>{{ oneLineAddress }}</span> `
})
export class OneLineAddressComponent implements OnInit, OnChanges {
  @Input() address: Address;

  oneLineAddress: string;

  addressKeys: string[] = ['address1', 'address2', 'address3', 'address4', 'address5', 'postcode'];

  ngOnInit() {
    this.formatOneLineAddress(this.address);
  }

  ngOnChanges(changes: SimpleChanges) {
    this.formatOneLineAddress(changes.address.currentValue);
  }

  private formatOneLineAddress(address: Address) {
    const arr: string[] = [];

    if (address) {
      this.addressKeys.forEach(key => {
        if (address[key as keyof Address]) {
          arr.push(address[key as keyof Address]);
        }
      });
      this.oneLineAddress = arr.join(', ') || '';
    } else {
      this.oneLineAddress = '';
    }
  }
}
