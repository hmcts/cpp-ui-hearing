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
    container.scrollTop = 0;
    jest
      .spyOn(container, 'getBoundingClientRect')
      .mockReturnValue({ top: 0, height: 100 } as DOMRect);

    const item1 = document.createElement('li');
    item1.setAttribute('role', 'option');
    jest.spyOn(item1, 'getBoundingClientRect').mockReturnValue({ top: 0, height: 40 } as DOMRect);
    container.appendChild(item1);

    const item2 = document.createElement('li');
    item2.setAttribute('role', 'option');
    jest.spyOn(item2, 'getBoundingClientRect').mockReturnValue({ top: 120, height: 40 } as DOMRect);
    container.appendChild(item2);

    document.body.appendChild(container);

    const { directive } = setup({
      highlightedSuggestionIndex: 1,
      suggestionsContainerId: 'suggestions-container'
    });

    directive.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));

    expect(container.scrollTop).toBe(60);

    document.body.removeChild(container);
  });

  it('should scroll the highlighted suggestion into view on ArrowUp', () => {
    const container = document.createElement('div');
    container.id = 'suggestions-container';
    container.scrollTop = 60;
    jest
      .spyOn(container, 'getBoundingClientRect')
      .mockReturnValue({ top: 0, height: 100 } as DOMRect);

    const item1 = document.createElement('li');
    item1.setAttribute('role', 'option');
    jest.spyOn(item1, 'getBoundingClientRect').mockReturnValue({ top: -20, height: 40 } as DOMRect);
    container.appendChild(item1);

    const item2 = document.createElement('li');
    item2.setAttribute('role', 'option');
    jest.spyOn(item2, 'getBoundingClientRect').mockReturnValue({ top: 100, height: 40 } as DOMRect);
    container.appendChild(item2);

    document.body.appendChild(container);

    const { directive } = setup({
      highlightedSuggestionIndex: 0,
      suggestionsContainerId: 'suggestions-container'
    });

    directive.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));

    expect(container.scrollTop).toBe(40);

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
