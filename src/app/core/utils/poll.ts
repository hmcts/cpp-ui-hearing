import { concat, map, retryWhen, switchMap, take } from 'rxjs/operators';
import { Observable, of, throwError } from 'rxjs';

export function poll<T>(
  fn: () => Observable<T> | Promise<T>,
  conditionFn?: (result: T) => boolean
): Observable<T> {
  const hasCriteria = conditionFn || (() => true);

  return of(null).pipe(
    switchMap(fn),
    map(result => {
      if (hasCriteria(result)) {
        return result;
      }

      throw new Error('Criteria did not match');
    }),
    retryWhen(errors$ =>
      errors$.pipe(take(50), concat(throwError('Fetch expired after 50 attempts.')))
    )
  );
}
