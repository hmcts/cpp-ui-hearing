import produce from 'immer';
import { createServer } from 'miragejs';
import { RemoteUnresolvedPart } from '../../results.interfaces';
import { getParsedResultDefinitionByShortCode } from './resources';

const DATE_FORMAT = /^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}$/;

export function createMockServer({ environment = 'development' } = {}) {
  const server = createServer({
    environment,
    routes() {
      this.urlPrefix = '';
      this.namespace = '';
      this.timing = 0;

      // Handler function for reference data definition requests
      const handleReferenceDataRequest = (_: any, request: any) => {
        const { originalText, orderedDate } = request.queryParams;
        const [shortCode, ...params] = (originalText as string).split(' ');

        try {
          // Attempt to "parse" the shortcode
          const parsedResult = getParsedResultDefinitionByShortCode(shortCode);
          // Add any subsequent params from the originalText as unresolved parts
          return produce(parsedResult, nextParsedResult => {
            nextParsedResult.originalText = originalText as string;
            for (const value of params) {
              // infer a type based on the value
              const type = DATE_FORMAT.test(value) ? 'DATE' : !isNaN(Number(value)) ? 'INT' : 'TXT';

              nextParsedResult.parts.push({
                state: 'UNRESOLVED',
                type,
                value,
                originalText: value
              });
            }
          });
        } catch {
          return {
            childResultDefinitions: [] as any[],
            orderedDate,
            originalText,
            promptChoices: [] as any[],
            parts: [shortCode, ...params].map((value): RemoteUnresolvedPart => {
              // use 'UNKNOWN' as a synonym for returning a suggested result
              const timp = getParsedResultDefinitionByShortCode('TIMP');

              if (value === 'UNKNOWN') {
                return {
                  state: 'UNRESOLVED',
                  value,
                  resultChoices: [
                    {
                      code: timp.resultDefinitionId,
                      label: timp.label,
                      level: timp.resultLevel,
                      shortCode: timp.shortCode,
                      type: 'RESULT'
                    }
                  ]
                };
              }

              return {
                state: 'UNRESOLVED',
                type: 'TXT',
                originalText: value,
                value
              };
            })
          };
        }
      };

      // See miragejs types - pretender is typed as any
      const pretender = (this as any).pretender;

      // Add a custom handler that matches any URL containing our API path
      const originalGet = pretender.get.bind(pretender);
      pretender.get = function (path: any, handler: any, async: any) {
        // Call original get
        const result = originalGet(path, handler, async);
        return result;
      };

      // Try multiple route patterns
      this.get(
        '/referencedata-query-api/query/api/rest/referencedata/definition',
        handleReferenceDataRequest
      );
      this.get(
        'referencedata-query-api/query/api/rest/referencedata/definition',
        handleReferenceDataRequest
      );

      // Use Pretender's handleRequest to intercept all GET requests
      const originalHandleRequest = pretender.handleRequest.bind(pretender);
      pretender.handleRequest = function (request: any) {
        const path = request.url;
        if (
          request.method === 'GET' &&
          path.includes('referencedata-query-api/query/api/rest/referencedata/definition')
        ) {
          // Parse query params from URL
          const url = new URL(path, 'http://localhost'); // Need a base URL for parsing
          const queryParams: any = {};
          url.searchParams.forEach((value: string, key: string) => {
            queryParams[key] = value;
          });

          const response = handleReferenceDataRequest(null, { queryParams });
          request.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(response));
          return;
        }
        return originalHandleRequest(request);
      };
    }
  });

  server.logging = false;

  return server;
}
