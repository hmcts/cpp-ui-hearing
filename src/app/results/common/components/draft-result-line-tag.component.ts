import { Component } from '@angular/core';
import { PdkPaddingDirective, PdkMarginDirective, PdkTypographyDirective } from '@cpp/pdk';

@Component({
  selector: '[cpp-draft-result-line-tag]',
  template: `
    <div
      pdk-padding-horizontal="1"
      style="display: inline-block; background-color: #d5d7ed"
      pdk-margin="0"
      pdk-typography="body-small"
    >
      <ng-content></ng-content>
    </div>
  `,
  imports: [PdkPaddingDirective, PdkMarginDirective, PdkTypographyDirective]
})
export class DraftResultLineTagComponent {}
