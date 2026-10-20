import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { PageTitleService } from './page-title.service';

/**
 * Picks the page title on navigation: a route `title` if one is set, otherwise the `data.title`
 * of the deepest route, which is how titles are declared throughout the app.
 */
@Injectable({ providedIn: 'root' })
export class PageTitleStrategy extends TitleStrategy {
  private readonly pageTitleService = inject(PageTitleService);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const pageTitle = this.buildTitle(snapshot) ?? getDeepestDataTitle(snapshot.root);
    this.pageTitleService.setPageTitle(pageTitle ?? '');
  }
}

const getDeepestDataTitle = (route: ActivatedRouteSnapshot): string | undefined => {
  let deepest = route;
  while (deepest.firstChild) {
    deepest = deepest.firstChild;
  }
  return deepest.data?.['title'];
};
