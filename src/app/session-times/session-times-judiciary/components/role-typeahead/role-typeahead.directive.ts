import { Directive, Host, HostBinding, HostListener } from '@angular/core';
import { PdkAutosuggestLiteComponent } from '@cpp/pdk';

@Directive({
  selector: '[roleTypeahead]',
  standalone: true
})
export class RoleTypeaheadDirective {
  @HostBinding('class.role-typeahead') roleTypeaheadClass = true;

  constructor(@Host() private autoSuggest: PdkAutosuggestLiteComponent<any>) {}

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return;
    }

    const autoSuggest = this.autoSuggest?.autoSuggestRef;
    const container = document.getElementById(autoSuggest?.suggestionsContainerId);
    const highlightedIndex = autoSuggest?.highlightedSuggestionIndex;

    if (!container || highlightedIndex === undefined || highlightedIndex === null) {
      return;
    }

    const items = container.querySelectorAll<HTMLElement>('li[role="option"]');
    const item = items[highlightedIndex];

    if (!item) {
      return;
    }

    const itemRect = item.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const containerHeight = containerRect.height;
    const itemTop = itemRect.top - containerRect.top + container.scrollTop;
    const itemBottom = itemTop + itemRect.height;
    const containerTop = container.scrollTop;
    const containerBottom = containerTop + containerHeight;

    if (event.key === 'ArrowDown' && itemBottom > containerBottom) {
      container.scrollTop = itemBottom - containerHeight;
    } else if (event.key === 'ArrowUp' && itemTop < containerTop) {
      container.scrollTop = itemTop;
    }
  }

  private keepOpenForScrollbar(autoSuggest: any, event: Event) {
    const target = event.target as HTMLElement;

    if (!target) {
      return;
    }

    if (target.closest('pdk-autosuggest-option')) {
      return;
    }

    if (target.classList.contains('pdk-autosuggest__input')) {
      return;
    }

    const container = document.getElementById(autoSuggest.suggestionsContainerId);

    if (container) {
      autoSuggest.didTargetSuggestion = container;
    }

    if (event.type === 'mousedown') {
      event.preventDefault();
    }
    event.stopPropagation();
  }

  private clearKeepOpenForScrollbar(autoSuggest: any, event: Event) {
    const target = event.target as HTMLElement;

    if (!target) {
      return;
    }

    const container = document.getElementById(autoSuggest.suggestionsContainerId);

    if (container && autoSuggest.didTargetSuggestion === container) {
      autoSuggest.didTargetSuggestion = null as any;
    }
  }

  @HostListener('mousedown', ['$event'])
  onMousedown(event: MouseEvent) {
    const autoSuggest = this.autoSuggest?.autoSuggestRef;

    if (!autoSuggest) {
      return;
    }

    this.keepOpenForScrollbar(autoSuggest, event);
  }

  @HostListener('mouseup', ['$event'])
  onMouseup(event: MouseEvent) {
    const autoSuggest = this.autoSuggest?.autoSuggestRef;

    if (!autoSuggest) {
      return;
    }

    this.clearKeepOpenForScrollbar(autoSuggest, event);
  }

  @HostListener('touchstart', ['$event'])
  onTouchstart(event: TouchEvent) {
    const autoSuggest = this.autoSuggest?.autoSuggestRef;

    if (!autoSuggest) {
      return;
    }

    this.keepOpenForScrollbar(autoSuggest, event);
  }

  @HostListener('touchend', ['$event'])
  onTouchend(event: TouchEvent) {
    const autoSuggest = this.autoSuggest?.autoSuggestRef;

    if (!autoSuggest) {
      return;
    }

    this.clearKeepOpenForScrollbar(autoSuggest, event);
  }
}
