import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { TopMenuComponent } from './top-menu.component';
import { TopMenu } from './top-menu';

describe('top-menu', () => {
  let fixture: ComponentFixture<TopMenuDemo>;
  let topMenu: DebugElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TopMenuDemo],
      teardown: { destroyAfterEach: false }
    });

    fixture = TestBed.createComponent(TopMenuDemo);
    topMenu = fixture.debugElement.query(By.css('.global-nav'));
  });

  it('renders menu with first link active', () => {
    fixture.componentInstance.topMenu = [
      [{ text: 'page 1', active: true }, { text: 'page 2' }],
      [{ text: 'page 3' }]
    ];
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });

  it('renders menu with second link active', () => {
    fixture.componentInstance.topMenu = [
      [{ text: 'page 1' }, { text: 'page 2', active: true }],
      [{ text: 'page 3' }]
    ];
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });

  it('emits an event when a menu item is clicked', () => {
    const click = jest.fn();
    const expectedResult = {
      item: { text: 'page 1', active: true },
      menu: [[{ text: 'page 1', active: true }, { text: 'page 2' }]]
    };

    fixture.componentInstance.onMenuItemClick = click;
    fixture.componentInstance.topMenu = [[{ text: 'page 1', active: true }, { text: 'page 2' }]];

    fixture.detectChanges();

    const links = topMenu.queryAll(By.css('[pdk-service-nav-list-item] button'));
    links[0].nativeElement.dispatchEvent(new Event('click'));

    expect(click).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledWith(expectedResult);
  });

  it('should toggle menu state', () => {
    const component = fixture.debugElement.query(By.directive(TopMenuComponent)).componentInstance;
    expect(component.open).toBe(false);

    component.toggle();
    expect(component.open).toBe(true);

    component.toggle();
    expect(component.open).toBe(false);
  });
});

@Component({
  selector: 'test-top-menu',
  template: `
    <top-menu [topMenu]="topMenu" (onMenuItemClick)="onMenuItemClick($event)"></top-menu>
  `,
  imports: [TopMenuComponent]
})
class TopMenuDemo {
  topMenu: TopMenu;
  onMenuItemClick: Function;
}
