import { Injectable } from '@angular/core';
import { CppHttp } from '@cpp/core';
import { Observable } from 'rxjs';
import { CourtApplication } from '../../model';
import { DefendantBreachApplication } from '../../model/breach-application';

@Injectable({ providedIn: 'root' })
export class ProgressionService {
  constructor(private api: CppHttp) {}

  addBreachApplication(
    body: DefendantBreachApplication
  ): Observable<{ courtApplications: CourtApplication[] }> {
    return this.api.commandSync({
      url: `/progression-command-api/command/api/rest/progression/add-breach-application`,
      requestType: 'application/vnd.progression.add-breach-application+json',
      successEvent: 'public.hearing.hearing-breach-applications-added',
      body
    });
  }
}
