import { DraftResultPrompt } from '../../../../results/results.interfaces';
import { ResultPromptValuePipe } from '../result-prompt-value.pipe';

describe('ResultPromptValuePipe', () => {
  const pipe = new ResultPromptValuePipe();

  const createResultPrompt = (
    type: DraftResultPrompt['type'],
    value: unknown
  ): DraftResultPrompt => {
    return {
      promptId: '*',
      type,
      promptRef: '*',
      label: '*',
      value
    };
  };

  it('should format the ADDRESS type', () => {
    const resultPrompt = createResultPrompt('ADDRESS', [
      createResultPrompt('TXT', 'Address line 1'),
      createResultPrompt('TXT', 'Address line 2'),
      createResultPrompt('TXT', 'Postcode')
    ]);
    const result = pipe.transform(resultPrompt);

    expect(result).toMatchInlineSnapshot(`"Address line 1, Address line 2, Postcode"`);
  });

  it('should format the BOOLEAN type', () => {
    const resultPrompt = createResultPrompt('BOOLEAN', true);
    const result = pipe.transform(resultPrompt);
    // note that boolean result prompts display their label under truthy
    // conditions, so this value is arbitrary
    expect(result).toMatchInlineSnapshot(`"true"`);
  });

  it('should format the CURR type', () => {
    const resultPrompt = createResultPrompt('CURR', '50');
    const result = pipe.transform(resultPrompt);

    expect(result).toMatchInlineSnapshot(`"£50.00"`);
  });

  it('should format the DATE type', () => {
    const resultPrompt = createResultPrompt('DATE', '2020-01-01');
    const result = pipe.transform(resultPrompt);

    expect(result).toMatchInlineSnapshot(`"01 Jan 2020"`);
  });

  it('should format the DURATION type', () => {
    const resultPrompt = createResultPrompt('DURATION', [
      { label: 'DAYS', type: 'INT', value: 5 },
      { label: 'HOURS', type: 'INT', value: 2 }
    ]);
    const result = pipe.transform(resultPrompt);

    expect(result).toMatchInlineSnapshot(`"5 days 2 hours"`);
  });

  it('should format the FIXL type', () => {
    const resultPrompt = createResultPrompt('FIXL', 'Choice');
    const result = pipe.transform(resultPrompt);

    expect(result).toMatchInlineSnapshot(`"Choice"`);
  });

  it('should format the FIXLM type', () => {
    const resultPrompt = createResultPrompt('FIXLM', ['Foo', 'Bar']);
    const result = pipe.transform(resultPrompt);

    expect(result).toMatchInlineSnapshot(`"Foo, Bar"`);
  });

  it('should format the FIXLO type', () => {
    const resultPrompt = createResultPrompt('FIXLO', 'Other');
    const result = pipe.transform(resultPrompt);

    expect(result).toMatchInlineSnapshot(`"Other"`);
  });

  it('should format the FIXLOM type', () => {
    const resultPrompt = createResultPrompt('FIXLOM', ['Foo', 'Bar']);
    const result = pipe.transform(resultPrompt);

    expect(result).toMatchInlineSnapshot(`"Foo, Bar"`);
  });

  it('should format the HCROOM type', () => {
    const resultPrompt = createResultPrompt('HCROOM', 'Courtroom 01');
    const result = pipe.transform(resultPrompt);

    expect(result).toMatchInlineSnapshot(`"Courtroom 01"`);
  });

  it('should format the INT type', () => {
    const resultPrompt = createResultPrompt('INT', 100);
    const result = pipe.transform(resultPrompt);

    expect(result).toMatchInlineSnapshot(`"100"`);
  });

  it('should format the NAMEADDRESS type', () => {
    const resultPrompt = createResultPrompt('NAMEADDRESS', [
      createResultPrompt('TXT', 'HMCTS'),
      createResultPrompt('TXT', 'Address line 1'),
      createResultPrompt('TXT', 'Address line 2'),
      createResultPrompt('TXT', 'Postcode')
    ]);
    const result = pipe.transform(resultPrompt);

    expect(result).toMatchInlineSnapshot(`"HMCTS, Address line 1, Address line 2, Postcode"`);
  });

  it('should format the TIME type', () => {
    const resultPrompt = createResultPrompt('TIME', '14:00');
    const result = pipe.transform(resultPrompt);

    expect(result).toMatchInlineSnapshot(`"14:00"`);
  });

  it('should format the TXT type', () => {
    const resultPrompt = createResultPrompt('TXT', 'Text!');
    const result = pipe.transform(resultPrompt);

    expect(result).toMatchInlineSnapshot(`"Text!"`);
  });

  it('should format the YESBOX type', () => {
    const resultPrompt = createResultPrompt('YESBOX', true);
    const result = pipe.transform(resultPrompt);
    expect(result).toMatchInlineSnapshot(`"true"`);
  });
});
