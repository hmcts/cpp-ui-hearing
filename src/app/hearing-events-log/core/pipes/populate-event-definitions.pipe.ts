import { Pipe, PipeTransform } from '@angular/core';
import { HearingPersonDetails, EventDefinition } from '../../../core';

const SUGGESTED_EVENTS = ['Start', 'End', 'Resume', 'Pause'];

@Pipe({ name: 'populateEventDefinitions' })
export class PopulateEventDefinitionsPipe implements PipeTransform {
  transform(
    eventDefinitions: EventDefinition[],
    hearingDefendants: HearingPersonDetails[],
    hearingDefenceCounsels: HearingPersonDetails[],
    witnessNames: string[]
  ) {
    let result: EventDefinition[] = [];
    eventDefinitions.forEach(ed => {
      if (ed.actionLabel.includes('defendant.name')) {
        result = result.concat(
          this.getEventDefinitionsForPersons(
            ed,
            'defendant.name',
            hearingDefendants,
            'counsel.name',
            hearingDefenceCounsels
          )
        );
      } else if (
        ed.actionLabel.includes('counsel.name') &&
        ed.actionLabel.includes('witness.name') &&
        !witnessNames
      ) {
        return;
      } else if (
        ed.actionLabel.includes('counsel.name') &&
        ed.actionLabel.includes('witness.name') &&
        witnessNames
      ) {
        result = result.concat(
          this.getEventDefinitionsForPersons(
            ed,
            'counsel.name',
            hearingDefenceCounsels,
            'witness.name',
            witnessNames.map(name => ({ firstName: name, lastName: '' }))
          )
        );
      } else if (ed.actionLabel.includes('counsel.name')) {
        result = result.concat(
          this.getEventDefinitionsForPersons(ed, 'counsel.name', hearingDefenceCounsels)
        );
      } else if (ed.actionLabel.includes('witness.name') && witnessNames) {
        result = result.concat(
          this.getEventDefinitionsForPersons(
            ed,
            'witness.name',
            witnessNames.map(name => ({ firstName: name, lastName: '' }))
          )
        );
      } else if (ed.actionLabel.includes('witness.name') && !witnessNames) {
        return;
      } else if (SUGGESTED_EVENTS.indexOf(ed.actionLabel) > -1) {
        return;
      } else {
        result.push(ed);
      }
    });

    return this.mapEventsForTypeahead(result);
  }

  private getEventDefinitionsForPersons(
    eventDefinition: EventDefinition,
    replaceStr: string,
    persons: HearingPersonDetails[],
    extraReplaceStr: string = null,
    extraPersons: HearingPersonDetails[] = null
  ): EventDefinition[] {
    if (!persons) {
      return [eventDefinition];
    }
    const generateExtra = eventDefinition.actionLabel.includes(extraReplaceStr);
    const firstStrReplacedED = persons.map(d =>
      Object.assign({}, eventDefinition, {
        actionLabel: eventDefinition.actionLabel
          .replace(replaceStr, `${d.firstName} ${d.lastName}`)
          .trim(),
        recordedLabel: eventDefinition.recordedLabel
          .replace(replaceStr, `${d.firstName} ${d.lastName}`)
          .trim()
      })
    );
    if (!generateExtra) {
      return firstStrReplacedED;
    } else {
      const result: EventDefinition[] = [];
      extraPersons.forEach(p => {
        firstStrReplacedED.forEach(ed => {
          result.push({
            ...eventDefinition,
            actionLabel: ed.actionLabel
              .replace(extraReplaceStr, `${p.firstName} ${p.lastName}`)
              .trim(),
            recordedLabel: ed.recordedLabel
              .replace(extraReplaceStr, `${p.firstName} ${p.lastName}`)
              .trim()
          });
        });
      });
      return result;
    }
  }

  // Needed in order to be able to set a default value for the PDK typeahead.
  // See writeValue function from the PDK.
  private mapEventsForTypeahead(eventDefinitions: EventDefinition[]): EventDefinition[] {
    const eventsForTypeahead = eventDefinitions.map(ed => {
      return {
        ...ed,
        value: ed.actionLabel,
        label: ed.actionLabel
      };
    });

    eventsForTypeahead.push({
      id: '',
      actionLabel: '',
      groupLabel: '',
      alterable: false,
      recordedLabel: '',
      caseAttributes: [],
      actionSequence: 0,
      groupSequence: 0,
      value: '',
      label: ''
    });

    return eventsForTypeahead;
  }
}
