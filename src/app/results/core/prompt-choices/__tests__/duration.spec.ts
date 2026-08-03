import { getDurationValueFromMinutes } from '../duration';

describe('DURATION prompt choice', () => {
  describe('getDurationValueFromMinutes', () => {
    it('should create a duration value from 0 minutes', () => {
      const value = getDurationValueFromMinutes(0);

      expect(value).toMatchInlineSnapshot(`
        [
          {
            "label": "MINUTES",
            "value": 0,
          },
        ]
      `);
    });

    it('should create a duration value from an exact hour', () => {
      const validValue = getDurationValueFromMinutes(60);

      expect(validValue).toMatchInlineSnapshot(`
        [
          {
            "label": "HOURS",
            "value": 1,
          },
        ]
      `);

      const invalidValue = getDurationValueFromMinutes(60 + 1);

      expect(invalidValue).toMatchInlineSnapshot(`
        [
          {
            "label": "MINUTES",
            "value": 61,
          },
        ]
      `);
    });

    it('should create a duration value from an exact day', () => {
      const validValue = getDurationValueFromMinutes(60 * 24);

      expect(validValue).toMatchInlineSnapshot(`
        [
          {
            "label": "DAYS",
            "value": 1,
          },
        ]
      `);

      const invalidValue = getDurationValueFromMinutes(60 * 24 + 1);

      expect(invalidValue).toMatchInlineSnapshot(`
        [
          {
            "label": "MINUTES",
            "value": 1441,
          },
        ]
      `);
    });

    it('should create a duration value from an exact week', () => {
      const validValue = getDurationValueFromMinutes(60 * 24 * 7);

      expect(validValue).toMatchInlineSnapshot(`
        [
          {
            "label": "WEEKS",
            "value": 1,
          },
        ]
      `);

      const invalidValue = getDurationValueFromMinutes(60 * 24 * 7 + 1);

      expect(invalidValue).toMatchInlineSnapshot(`
        [
          {
            "label": "MINUTES",
            "value": 10081,
          },
        ]
      `);
    });
  });
});
