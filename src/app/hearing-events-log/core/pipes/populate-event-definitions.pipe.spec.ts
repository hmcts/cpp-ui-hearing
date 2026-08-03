import { PopulateEventDefinitionsPipe } from './populate-event-definitions.pipe';
import { EventDefinition } from '../../../core';

const eventDef1: EventDefinition = {
  id: '111111',
  actionLabel: 'Start hearing',
  alterable: false,
  recordedLabel: '',
  caseAttributes: [],
  actionSequence: 1,
  groupSequence: 1,
  groupLabel: 'start'
};

const eventDef2: EventDefinition = {
  id: '2222222',
  actionLabel: 'Event A for witness.name',
  alterable: false,
  recordedLabel: 'Event A for witness.name',
  caseAttributes: [],
  actionSequence: 1,
  groupSequence: 1,
  groupLabel: 'witness'
};

const eventDef3: EventDefinition = {
  id: '3333333',
  actionLabel: 'Event B for defendant.name',
  alterable: false,
  recordedLabel: 'Event B for defendant.name',
  caseAttributes: [],
  actionSequence: 1,
  groupSequence: 1,
  groupLabel: 'defendant'
};

const eventDef4: EventDefinition = {
  id: '4444444',
  actionLabel: 'Event C for counsel.name',
  alterable: false,
  recordedLabel: 'Event C for counsel.name',
  caseAttributes: [],
  actionSequence: 1,
  groupSequence: 1,
  groupLabel: 'counsel'
};

const eventsDefs = (): EventDefinition[] => {
  return [{ ...eventDef1 }, { ...eventDef2 }, { ...eventDef3 }, { ...eventDef4 }];
};

const defendants = [
  {
    firstName: 'Mark',
    lastName: 'Cavendish'
  }
];
const defenceCounsels = [
  {
    firstName: 'Peter',
    lastName: 'Sagan'
  }
];
const witnessNames = ['Gerain Thomas', 'Chris Froome'];

describe('PopulateEventDefinitionsPipe', () => {
  let pipe: PopulateEventDefinitionsPipe;
  let freshEventDefinitions: EventDefinition[];

  beforeEach(() => {
    pipe = new PopulateEventDefinitionsPipe();
    freshEventDefinitions = eventsDefs();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('does not populate when defendant, defenceCounsel and witness are empty', () => {
    const populatedEventDefs = pipe.transform(freshEventDefinitions, null, null, []);
    expect(populatedEventDefs.length).toBe(4);
  });

  it('populate EventDefinitions with defendant, defenceCounsel and witness', () => {
    const populatedEventDefs = pipe.transform(
      freshEventDefinitions,
      defendants,
      defenceCounsels,
      witnessNames
    );

    // Not modified EventDef
    expect(populatedEventDefs[0].actionLabel).toBe(eventDef1.actionLabel);
    expect(populatedEventDefs[0].recordedLabel).toBe(eventDef1.recordedLabel);

    // Witness
    expect(populatedEventDefs[1].actionLabel).toBe('Event A for Gerain Thomas');
    expect(populatedEventDefs[1].recordedLabel).toBe('Event A for Gerain Thomas');

    // Witness
    expect(populatedEventDefs[2].actionLabel).toBe('Event A for Chris Froome');
    expect(populatedEventDefs[2].recordedLabel).toBe('Event A for Chris Froome');

    // Defendant
    expect(populatedEventDefs[3].actionLabel).toBe('Event B for Mark Cavendish');
    expect(populatedEventDefs[3].recordedLabel).toBe('Event B for Mark Cavendish');

    // Defence counsel
    expect(populatedEventDefs[4].actionLabel).toBe('Event C for Peter Sagan');
    expect(populatedEventDefs[4].recordedLabel).toBe('Event C for Peter Sagan');
  });

  it('populate multiple defendant and defenceCounsel', () => {
    const twoDefendants = [defendants[0], defendants[0]];
    const twoDefenceCounsels = [defenceCounsels[0], defenceCounsels[0]];
    const populatedEventDefs = pipe.transform(
      freshEventDefinitions,
      twoDefendants,
      twoDefenceCounsels,
      []
    );
    expect(populatedEventDefs.length).toBe(6);
  });
});
