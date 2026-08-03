import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  Input,
  Output,
  EventEmitter
} from '@angular/core';
import { TopMenu, TopMenuItem, ClickedMenuItemEvent } from './top-menu';
import {
  PdkTypographyDirective,
  PdkServiceNavigationComponent,
  PdkServiceNavigationListDirective,
  PdkServiceNavigationListItemDirective,
  PdkTextColorDirective,
  PdkMarginDirective,
  PdkVisuallyHiddenDirective
} from '@cpp/pdk';

@Component({
  selector: 'top-menu',
  styleUrls: ['top-menu.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './top-menu.html',
  imports: [
    PdkTypographyDirective,
    PdkServiceNavigationComponent,
    PdkServiceNavigationListDirective,
    PdkServiceNavigationListItemDirective,
    PdkTextColorDirective,
    PdkMarginDirective,
    PdkVisuallyHiddenDirective
  ]
})
export class TopMenuComponent {
  @Input() topMenu: TopMenu;
  @Input() menuTitle = 'Menu';
  @Input() globalNavigation = 'Global Navigation';
  @Output() onMenuItemClick: EventEmitter<ClickedMenuItemEvent> = new EventEmitter();

  open = false;

  menuItemClick(item: TopMenuItem) {
    this.onMenuItemClick.emit({
      item,
      menu: this.topMenu
    } as ClickedMenuItemEvent);
  }

  toggle(): void {
    this.open = !this.open;
  }
}
