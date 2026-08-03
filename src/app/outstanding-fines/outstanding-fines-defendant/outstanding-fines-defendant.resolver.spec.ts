import { CommonModule } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { OutstandingFinesDefendantResolver } from './outstanding-fines-defendant.resolver';
import { OutstandingFinesService } from '../outstanding-fines-shared/services';
import { of } from 'rxjs';
import { OutstandingFine } from '../outstanding-fines.interfaces';

describe('OutstandingFinesDefendantResolver', () => {
  let outstandingFinesDefendantResolver: OutstandingFinesDefendantResolver;
  let route: ActivatedRoute;

  const outstandingFines = { outstandingFines: [] } as { outstandingFines: OutstandingFine[] };
  const defendantId = 'test-defendant-id';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CommonModule],
      providers: [
        provideRouter([]),
        OutstandingFinesDefendantResolver,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {
                defendantId
              },
              queryParams: {
                isSJPCase: false
              }
            }
          }
        },
        {
          provide: OutstandingFinesService,
          useValue: {
            getDefendantOutstandingFines: jest.fn().mockReturnValue(of(outstandingFines))
          }
        }
      ],
      teardown: { destroyAfterEach: false }
    });

    outstandingFinesDefendantResolver = TestBed.inject(OutstandingFinesDefendantResolver);
    route = TestBed.inject(ActivatedRoute);
  });

  it('should resolve the outstanding fines', () => {
    outstandingFinesDefendantResolver.resolve(route.snapshot).subscribe(resolvedData => {
      expect(resolvedData).toStrictEqual([]);
    });
  });
});
