import { AgePipe } from './age.pipe';
import moment from 'moment';

describe('Pipe: AgePipe', () => {
  // TODO: Have to mock moment to make it works every year
  it('should return the expected string with the date', () => {
    const pipe = new AgePipe();
    const dob = moment().subtract('32', 'years').format('YYYY-MM-DD');

    expect(pipe.transform(dob)).toEqual(32);
  });

  it('should return null if the date does not exist', () => {
    const pipe = new AgePipe();
    expect(pipe.transform()).toBeNull();
  });
});
