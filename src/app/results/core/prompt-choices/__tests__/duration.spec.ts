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
      const validValue = getDurationValueFromMinutes(60 * 6);

      expect(validValue).toMatchInlineSnapshot(`
        [
          {
            "label": "DAYS",
            "value": 1,
          },
        ]
      `);

      const invalidValue = getDurationValueFromMinutes(60 * 6 + 1);

      expect(invalidValue).toMatchInlineSnapshot(`
        [
          {
            "label": "MINUTES",
            "value": 361,
          },
        ]
      `);
    });

    it('should create a duration value from an exact week', () => {
      const validValue = getDurationValueFromMinutes(60 * 6 * 5);

      expect(validValue).toMatchInlineSnapshot(`
        [
          {
            "label": "WEEKS",
            "value": 1,
          },
        ]
      `);

      const invalidValue = getDurationValueFromMinutes(60 * 6 * 5 + 1);

      expect(invalidValue).toMatchInlineSnapshot(`
        [
          {
            "label": "MINUTES",
            "value": 1801,
          },
        ]
      `);
    });
  });
});
