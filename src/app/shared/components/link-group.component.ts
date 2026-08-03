import { Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'pdk-link-group',
  template: ` <ng-content></ng-content> `,
  encapsulation: ViewEncapsulation.None,
  styles: [
    `
      pdk-link-group [pdk-link] {
        display: inline-block;
        margin: 0 5px;
      }
    `
  ]
})
export class LinkGroupComponent {}
