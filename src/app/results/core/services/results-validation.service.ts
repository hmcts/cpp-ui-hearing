import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { CppHttp } from '@cpp/core';
import { ResultsValidation, ResultsValidationResponse } from '../../results-validation.interfaces';

@Injectable({ providedIn: 'root' })
export class ResultsValidationService {
  constructor(private http: CppHttp) {}

  validate(request: ResultsValidation): Observable<ResultsValidationResponse> {
    const url = '/results-validator/api/validation/validate';
    return this.http
      .command({ url, body: request, requestType: 'application/json' })
      .pipe(map(response => JSON.parse(response.body) as ResultsValidationResponse));
  }
}
