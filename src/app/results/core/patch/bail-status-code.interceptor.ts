import { HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { BailStatusCode, ResolvedParsedResult } from '../../results.interfaces';

const bailStatusMap: Record<string, BailStatusCode> = {
  'd0a369c9-5a28-40ec-99cb-da7943550b18': 'C', // RI
  '903b3e90-f185-40d3-92dd-6f81b73c4bb2': 'L', // RILA
  'f666fd58-36c5-493f-aa11-89714faee6e6': 'L', // RILAB
  'e26940b7-2534-42f2-9c44-c70072bf6ad2': 'P', // RIB
  '35430208-3705-44ce-b5d5-153c0337f6ab': 'P', // CCSIB
  'd271def7-14a1-4a92-a40b-b6ee5d4654ff': 'S', // CCIIYDA
  '404de620-d5ce-4eb4-87c4-f7e96271d240': 'S', // CCSIYDA
  '0536dbd2-b922-4899-9bc9-cad08429a889': 'B', // REMCBY
  '3a529001-2f43-45ba-a0a8-d3ced7e9e7ad': 'B', // RC
  '55639b76-055a-4557-97bb-f99f38fd5b2b': 'B', // RICD
  '90d8268d-cc6a-4a09-bdb3-ddf8ea8ef2f9': 'B', // RCBV
  'b0076de5-5769-472f-b97d-31f3b5688cbf': 'B', // CCSC
  'b318ca35-8b6a-41e5-a674-879ac9a05cc2': 'B', // CCIC
  'f917ba0c-1faf-4945-83a8-50be9049f9b4': 'B', // REMCB
  '705140dc-833a-4aa0-a872-839009fc4494': 'U', // CCIU
  'b0303006-5edf-402a-955f-94ce9d3916aa': 'U', // REMUBY
  'd1d31ca4-c9d6-43ac-ae6a-c591ab2d5d53': 'U', // REMUCB
  'd076bd4a-17d5-4720-899a-1c6f96e3b35f': 'U' // REMUB
};

@Injectable({ providedIn: 'root' })
export class BailStatusCodeForParsedResultDefinitionInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<unknown>, next: HttpHandler) {
    return next.handle(request).pipe(
      map(event => {
        const requestType = request.headers.get('Accept');

        if (
          event instanceof HttpResponse &&
          event.status === 200 &&
          requestType === 'application/vnd.referencedata.notepad.parse-result-definition+json'
        ) {
          const body = event.body as ResolvedParsedResult;

          if (bailStatusMap[body.resultDefinitionId]) {
            body.bailStatusCode = bailStatusMap[body.resultDefinitionId];

            return event.clone({ body });
          }
        }
        return event;
      })
    );
  }
}
