import { RoleTypeaheadDirective } from './role-typeahead.directive';

describe('RoleTypeaheadDirective', () => {
  const setup = (autoSuggestRef: any) => {
    const autoSuggest = { autoSuggestRef } as any;
    const directive = new RoleTypeaheadDirective(autoSuggest);
    return { directive, autoSuggest };
  };

  it('should scroll the highlighted suggestion into view on ArrowDown', () => {
    const container = document.createElement('div');
    container.id = 'suggestions-container';

    const item = document.createElement('li');
    item.id = 'judicial-id-1';
    (item as any).scrollIntoView = jest.fn();
    container.appendChild(item);
    document.body.appendChild(container);

    const { directive } = setup({
      highlightedSuggestion: { id: 'judicial-id-1' },
      suggestionsContainerId: 'suggestions-container',
      mapSuggestionToKey: (suggestion: any) => suggestion.id
    });

    directive.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));

    expect((item as any).scrollIntoView).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'nearest',
      behavior: 'auto'
    });

    document.body.removeChild(container);
  });

  it('should scroll the highlighted suggestion into view on ArrowUp', () => {
    const container = document.createElement('div');
    container.id = 'suggestions-container';

    const item = document.createElement('li');
    item.id = 'judicial-id-1';
    (item as any).scrollIntoView = jest.fn();
    container.appendChild(item);
    document.body.appendChild(container);

    const { directive } = setup({
      highlightedSuggestion: { id: 'judicial-id-1' },
      suggestionsContainerId: 'suggestions-container',
      mapSuggestionToKey: (suggestion: any) => suggestion.id
    });

    directive.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));

    expect((item as any).scrollIntoView).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'nearest',
      behavior: 'auto'
    });

    document.body.removeChild(container);
  });

  it('should set didTargetSuggestion to suggestions container on scrollbar mousedown', () => {
    const container = document.createElement('div');
    container.id = 'suggestions-container';
    document.body.appendChild(container);

    const autoSuggestRef = {
      suggestionsContainerId: 'suggestions-container',
      didTargetSuggestion: null as any
    };
    const { directive, autoSuggest } = setup(autoSuggestRef);

    const event = new MouseEvent('mousedown', { bubbles: true });
    container.dispatchEvent(event);
    directive.onMousedown(event);

    expect(autoSuggest.autoSuggestRef.didTargetSuggestion).toBe(container);

    document.body.removeChild(container);
  });

  it('should not set didTargetSuggestion when a suggestion is mousedowned', () => {
    const container = document.createElement('div');
    container.id = 'suggestions-container';

    const option = document.createElement('pdk-autosuggest-option') as any;
    const span = document.createElement('span');
    option.appendChild(span);
    container.appendChild(option);
    document.body.appendChild(container);

    const autoSuggestRef = {
      suggestionsContainerId: 'suggestions-container',
      didTargetSuggestion: null as any
    };
    const { directive, autoSuggest } = setup(autoSuggestRef);

    const event = new MouseEvent('mousedown', { bubbles: true });
    span.dispatchEvent(event);
    directive.onMousedown(event);

    expect(autoSuggest.autoSuggestRef.didTargetSuggestion).toBeNull();

    document.body.removeChild(container);
  });

  it('should clear didTargetSuggestion on container mouseup', () => {
    const container = document.createElement('div');
    container.id = 'suggestions-container';
    document.body.appendChild(container);

    const autoSuggestRef = {
      suggestionsContainerId: 'suggestions-container',
      didTargetSuggestion: container
    };
    const { directive, autoSuggest } = setup(autoSuggestRef);

    const event = new MouseEvent('mouseup', { bubbles: true });
    container.dispatchEvent(event);
    directive.onMouseup(event);

    expect(autoSuggest.autoSuggestRef.didTargetSuggestion).toBeNull();

    document.body.removeChild(container);
  });
});
