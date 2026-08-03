import {
  getCommissionOfNewOffenceBreachApplicationTypes,
  COMMISSION_OF_NEW_OFFENCE_BREACH
} from './application-type';

describe('ApplicationType selectors', () => {
  it('should select application types where `breachType` is `COMMISSION_OF_NEW_OFFENCE_BREACH`', () => {
    const applicationTypes = [
      { id: '1234', breachType: COMMISSION_OF_NEW_OFFENCE_BREACH },
      { id: '4321', breachType: 'breachType' }
    ] as any;

    expect(getCommissionOfNewOffenceBreachApplicationTypes.projector(applicationTypes)).toEqual([
      { id: '1234', breachType: COMMISSION_OF_NEW_OFFENCE_BREACH }
    ]);
  });
});
