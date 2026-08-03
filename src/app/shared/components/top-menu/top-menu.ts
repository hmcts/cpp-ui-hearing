export interface TopMenu extends Array<TopMenuItem[]> {}

export interface TopMenuItem {
  text: string;
  active?: boolean;
}

export interface ClickedMenuItemEvent {
  item: TopMenuItem;
  menu: TopMenu;
}
