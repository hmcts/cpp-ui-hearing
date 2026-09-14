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
    const highlighted = autoSuggest?.highlightedSuggestion;

    if (!autoSuggest || !highlighted) {
      return;
    }

    const suggestionId = String(autoSuggest.mapSuggestionToKey(highlighted));
    const item = document.getElementById(suggestionId);

    if (item && typeof item.scrollIntoView === 'function') {
      item.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
    }
  }

  @HostListener('mousedown', ['$event'])
  onMousedown(event: MouseEvent) {
    const autoSuggest = this.autoSuggest?.autoSuggestRef;
    const target = event.target as HTMLElement;

    if (!autoSuggest || !target) {
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
  }

  @HostListener('mouseup', ['$event'])
  onMouseup(event: MouseEvent) {
    const autoSuggest = this.autoSuggest?.autoSuggestRef;
    const target = event.target as HTMLElement;

    if (!autoSuggest || !target) {
      return;
    }

    const container = document.getElementById(autoSuggest.suggestionsContainerId);

    if (container && autoSuggest.didTargetSuggestion === container) {
      autoSuggest.didTargetSuggestion = null as any;
    }
  }
}
