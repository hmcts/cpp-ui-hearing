import { TestBed, inject } from '@angular/core/testing';
import { CPPDatePipe } from './cpp-date.pipe';
import * as timeZoneMock from 'timezone-mock';

describe('Pipe: CPP Date Pipe', () => {
  let pipe: CPPDatePipe;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CPPDatePipe],
      teardown: { destroyAfterEach: false }
    });
    timeZoneMock.register('UTC');
  });

  beforeEach(inject([CPPDatePipe], (p: CPPDatePipe) => {
    pipe = p;
  }));

  afterEach(() => {
    timeZoneMock.unregister();
  });

  it('Should convert utc date to correct date format', () => {
    const currentYear = new Date().getFullYear();
    const month = 8;
    const day = 20;
    const hour = 14;
    const minutes = 30;

    const utcDate = `${currentYear}-0${month}-${day}T${hour}:${minutes}:00.000Z`;
    const expectedDate = `${day} August ${currentYear}`;

    expect(pipe.transform(utcDate)).toEqual(expectedDate);
  });

  it('Should convert utc date to correct time format', () => {
    const currentYear = new Date().getFullYear();
    const month = 8;
    const day = 20;
    const hour = 14;
    const minutes = 30;

    const utcDate = `${currentYear}-0${month}-${day}T${hour}:${minutes}:00.000Z`;
    const expectedDate = `${hour}:${minutes}`;

    expect(pipe.transform(utcDate, 'HH:mm')).toEqual(expectedDate);
  });

  it('Should convert string date to correct time format', () => {
    expect(pipe.transform('2020-10-20')).toEqual('20 October 2020');
  });
});
