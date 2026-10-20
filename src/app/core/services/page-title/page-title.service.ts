import { inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import {
  buildPageTitle,
  formatDefendantNamesForTitle,
  PageTitleName
} from '../../utils/page-title';

/**
 * Owns the browser tab title. The page title comes from the router (PageTitleStrategy) and the
 * defendant names come from the hearing header, so the tab always matches what the header shows.
 */
@Injectable({ providedIn: 'root' })
export class PageTitleService {
  private readonly title = inject(Title);

  private pageTitle = '';
  private defendantNames: PageTitleName[] = [];

  setPageTitle(pageTitle: string): void {
    this.pageTitle = pageTitle || '';
    this.render();
  }

  setDefendantNames(names: PageTitleName[] | null | undefined): void {
    this.defendantNames = names || [];
    this.render();
  }

  clearDefendantNames(): void {
    this.setDefendantNames([]);
  }

  private render(): void {
    this.title.setTitle(
      buildPageTitle(this.pageTitle, formatDefendantNamesForTitle(this.defendantNames))
    );
  }
}
