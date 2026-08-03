import { AddressPipe } from './address.pipe';

describe('AddressPipe', () => {
  let pipe: AddressPipe;

  beforeAll(() => {
    pipe = new AddressPipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should format address', () => {
    expect(pipe.transform()).toEqual('');
    expect(pipe.transform(undefined, false)).toEqual('');
    expect(
      pipe.transform({
        address1: 'a1',
        address2: 'a2',
        address3: 'a3',
        address4: 'a4',
        address5: 'a5',
        postcode: 'pc'
      })
    ).toEqual('a1, a2, a3, a4, a5, pc');
    expect(
      pipe.transform({
        addressLine1: 'a1',
        addressLine2: 'a2',
        addressPostcode: 'pc'
      })
    ).toEqual('a1, a2, pc');
    expect(
      pipe.transform({
        addressLine1: 'a1',
        addressLine2: 'a2',
        addressPostCode: 'pc'
      })
    ).toEqual('a1, a2, pc');
    expect(pipe.transform({ address1: 'a1', address4: 'a4', postcode: 'pc' })).toEqual(
      'a1, a4, pc'
    );
    expect(
      pipe.transform({ address1: 'a1', address2: 'a2', address3: 'a3', postcode: 'pc' }, true)
    ).toEqual('a1<br>a2<br>a3<br>pc');
  });
});
