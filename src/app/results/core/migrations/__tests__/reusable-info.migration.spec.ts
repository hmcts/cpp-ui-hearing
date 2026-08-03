import {
  migrateLegacyReusableInfoResponse,
  migrateLegacyReusableInfoRequest
} from '../legacy/legacy-reusable-info.migration';

describe('Migration – Result entry', () => {
  it('should migrate a legacy request', () => {
    const migratedRequest = migrateLegacyReusableInfoRequest({
      reusablePrompts: [],
      reusableResults: [
        {
          shortCode: 'BAIC',
          masterDefendantId: 'masterDefendantId',
          offenceId: 'offenceId',
          promptValues: {
            shortcode: [
              {
                type: 'TXT',
                promptRef: 'promptRef',
                value: '*'
              }
            ]
          }
        }
      ]
    });

    expect(migratedRequest).toMatchInlineSnapshot(`
      {
        "reusablePrompts": [],
        "reusableResults": [
          {
            "masterDefendantId": "masterDefendantId",
            "offenceId": "offenceId",
            "shortCode": "BAIC",
            "value": "{"shortcode":[{"type":"TXT","promptRef":"promptRef","value":"*"}]}",
          },
        ],
      }
    `);
  });

  it('should migrate a legacy response', () => {
    const legacyResultEntry = require('./fixtures/legacy/result-entry/BAIC.json');
    const migratedResponse = migrateLegacyReusableInfoResponse(legacyResultEntry);

    expect(migratedResponse).toMatchInlineSnapshot(`
      {
        "reusablePrompts": [],
        "reusableResults": [
          {
            "masterDefendantId": "ecd429ee-9799-48e7-9fce-1f08093aef25",
            "offenceId": "ab58128a-de30-445d-8b57-0802c2618924",
            "promptValues": {
              "BAIC": [],
              "porcu3": [
                {
                  "promptRef": "excusedTimeFrom",
                  "type": "TIME",
                  "value": "10:30",
                },
                {
                  "promptRef": "and",
                  "type": "TIME",
                  "value": "12:30",
                },
                {
                  "promptRef": "frequency",
                  "type": "TXT",
                  "value": "Whenever",
                },
              ],
              "pore10": [],
            },
            "shortCode": "BAIC",
          },
        ],
      }
    `);
  });
});
