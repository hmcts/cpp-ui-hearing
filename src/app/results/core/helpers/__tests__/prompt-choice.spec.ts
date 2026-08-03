import { omit } from 'lodash-es';
import { FixedListOtherPromptChoice, OneOfPromptChoice } from 'src/app/results/results.interfaces';
import { getParsedResultDefinitionByShortCode, getPromptChoiceForType } from '../../testing';
import { validateValueForPromptChoice } from '../prompt-choice';

describe('prompt choice helpers', () => {
  describe('validateValueForPromptChoice', () => {
    describe('ADDRESS', () => {
      const promptChoice = getPromptChoiceForType('ADDRESS');

      describe('value map', () => {
        const validValue = {
          protectedpersonsaddressAddress1: 'A',
          protectedpersonsaddressPostCode: 'CR0 1AX'
        };

        it('should validate a valid address', () => {
          expect(validateValueForPromptChoice(promptChoice, validValue)).toBeNull();
        });

        it('should validate a required address', () => {
          expect(validateValueForPromptChoice({ ...promptChoice, required: false })).toBeNull();
          expect(validateValueForPromptChoice({ ...promptChoice, required: true })).toEqual({
            protectedpersonsaddressAddress1: { required: true },
            protectedpersonsaddressPostCode: { required: true }
          });
        });

        it('should validate an optional address when unrelated values belong to the value map', () => {
          expect(
            validateValueForPromptChoice({ ...promptChoice, required: false }, { foo: '*' })
          ).toBeNull();
        });

        it('should validate the first address line with the `addressLine` rule', () => {
          const errors = validateValueForPromptChoice(
            { ...promptChoice, required: false },
            {
              ...validValue,
              protectedpersonsaddressAddress1: '*',
              protectedpersonsaddressAddress2: '*',
              protectedpersonsaddressAddress3: '*',
              protectedpersonsaddressAddress4: '*',
              protectedpersonsaddressAddress5: '*'
            }
          );

          expect(errors).toEqual({
            protectedpersonsaddressAddress1: { addressLine: true }
          });
        });

        it('should validate the postcode with the `postcode` rule', () => {
          const errors = validateValueForPromptChoice(
            { ...promptChoice, required: false },
            {
              ...validValue,
              protectedpersonsaddressPostCode: 'CR01AX'
            }
          );

          expect(errors).toEqual({
            protectedpersonsaddressPostCode: { postcode: true }
          });
        });

        it('should validate the email addresses with the `email` rule', () => {
          const errors = validateValueForPromptChoice(
            { ...promptChoice, required: false },
            {
              ...validValue,
              protectedpersonsaddressEmailAddress1: 'foo@',
              protectedpersonsaddressEmailAddress2: 'foo@'
            }
          );

          expect(errors).toEqual({
            protectedpersonsaddressEmailAddress1: { email: true },
            protectedpersonsaddressEmailAddress2: { email: true }
          });
        });

        it('should validate multiple email addresses within the same value', () => {
          const errors = validateValueForPromptChoice(
            { ...promptChoice, required: false },
            {
              ...validValue,
              protectedpersonsaddressEmailAddress1: 'foo1@bar.com; foo2@',
              protectedpersonsaddressEmailAddress2: 'foo1@bar.com; foo2@bar.com'
            }
          );

          expect(errors).toEqual({
            protectedpersonsaddressEmailAddress1: { email: true }
          });
        });

        it('should apply the usual validation when any child value exists for an optional address', () => {
          const errors = validateValueForPromptChoice(
            { ...promptChoice, required: false },
            { protectedpersonsaddressAddress2: 'a' }
          );

          expect(errors).toEqual({
            protectedpersonsaddressAddress1: { required: true },
            protectedpersonsaddressPostCode: { required: true }
          });
        });
      });

      describe('result prompts', () => {
        const validResultPrompts = [
          { promptRef: 'protectedpersonsaddressAddress1', value: 'A' },
          { promptRef: 'protectedpersonsaddressPostCode', value: 'CR0 1AX' }
        ];

        it('should validate a valid address', () => {
          expect(validateValueForPromptChoice(promptChoice, validResultPrompts)).toBeNull();
        });

        it('should validate a required address', () => {
          expect(validateValueForPromptChoice({ ...promptChoice, required: false }, [])).toBeNull();
          expect(validateValueForPromptChoice({ ...promptChoice, required: true }, [])).toEqual({
            protectedpersonsaddressAddress1: { required: true },
            protectedpersonsaddressPostCode: { required: true }
          });
        });

        it('should validate the first address lines with the `addressLine` rule', () => {
          const errors = validateValueForPromptChoice({ ...promptChoice, required: false }, [
            validResultPrompts[1],
            { promptRef: 'protectedpersonsaddressAddress1', value: '*' },
            { promptRef: 'protectedpersonsaddressAddress2', value: '*' },
            { promptRef: 'protectedpersonsaddressAddress3', value: '*' },
            { promptRef: 'protectedpersonsaddressAddress4', value: '*' },
            { promptRef: 'protectedpersonsaddressAddress5', value: '*' }
          ]);

          expect(errors).toEqual({
            protectedpersonsaddressAddress1: { addressLine: true }
          });
        });

        it('should validate the postcode with the `postcode` rule', () => {
          const errors = validateValueForPromptChoice({ ...promptChoice, required: false }, [
            validResultPrompts[0],
            { promptRef: 'protectedpersonsaddressPostCode', value: 'CR01AX' }
          ]);

          expect(errors).toEqual({
            protectedpersonsaddressPostCode: { postcode: true }
          });
        });

        it('should validate the email addresses with the `email` rule', () => {
          const errors = validateValueForPromptChoice({ ...promptChoice, required: false }, [
            ...validResultPrompts,
            { promptRef: 'protectedpersonsaddressEmailAddress1', value: 'foo@' },
            { promptRef: 'protectedpersonsaddressEmailAddress2', value: 'foo@' }
          ]);

          expect(errors).toEqual({
            protectedpersonsaddressEmailAddress1: { email: true },
            protectedpersonsaddressEmailAddress2: { email: true }
          });
        });

        it('should validate multiple email addresses within the same value', () => {
          const errors = validateValueForPromptChoice({ ...promptChoice, required: false }, [
            ...validResultPrompts,
            { promptRef: 'protectedpersonsaddressEmailAddress1', value: 'foo1@bar.com; foo2@' },
            {
              promptRef: 'protectedpersonsaddressEmailAddress2',
              value: 'foo1@bar.com; foo2@bar.com'
            }
          ]);

          expect(errors).toEqual({
            protectedpersonsaddressEmailAddress1: { email: true }
          });
        });

        it('should apply the usual validation when any child value exists for an optional address', () => {
          const errors = validateValueForPromptChoice({ ...promptChoice, required: false }, [
            { promptRef: 'protectedpersonsaddressAddress2', value: 'a' }
          ]);

          expect(errors).toEqual({
            protectedpersonsaddressAddress1: { required: true },
            protectedpersonsaddressPostCode: { required: true }
          });
        });
      });
    });

    describe('BOOLEAN', () => {
      const promptChoice = getPromptChoiceForType('BOOLEAN');

      it('should validate a required value', () => {
        expect(validateValueForPromptChoice({ ...promptChoice, required: false })).toBeNull();
        expect(validateValueForPromptChoice({ ...promptChoice, required: true })).toEqual({
          required: true
        });
      });

      it('should validate a boolean value', () => {
        expect(validateValueForPromptChoice(promptChoice, true)).toBeNull();
        expect(validateValueForPromptChoice(promptChoice, false)).toBeNull();
        expect(validateValueForPromptChoice(promptChoice, 'true')).toEqual({ boolean: true });
      });
    });

    describe('CURR', () => {
      const promptChoice = getPromptChoiceForType('CURR');

      it('should validate a required value', () => {
        expect(validateValueForPromptChoice({ ...promptChoice, required: false })).toBeNull();
        expect(validateValueForPromptChoice({ ...promptChoice, required: true })).toEqual({
          required: true
        });
      });

      it('should validate a currency value', () => {
        expect(validateValueForPromptChoice(promptChoice, 1)).toBeNull();
        expect(validateValueForPromptChoice(promptChoice, '1')).toBeNull();
        expect(validateValueForPromptChoice(promptChoice, 'a')).toEqual({ currency: true });
      });

      it('should require a number greater than zero', () => {
        expect(validateValueForPromptChoice(promptChoice, 1)).toBeNull();
        expect(validateValueForPromptChoice(promptChoice, '0')).toEqual({ currency: true });
        expect(validateValueForPromptChoice(promptChoice, 0)).toEqual({ currency: true });
      });
    });

    describe('DATE', () => {
      const promptChoice = getPromptChoiceForType('DATE');

      it('should validate a required value', () => {
        expect(validateValueForPromptChoice({ ...promptChoice, required: false })).toBeNull();
        expect(validateValueForPromptChoice({ ...promptChoice, required: true })).toEqual({
          required: true
        });
      });

      it('should validate a date value', () => {
        expect(validateValueForPromptChoice(promptChoice, '202-01-01')).toEqual({
          dateFormat: true
        });
        expect(validateValueForPromptChoice(promptChoice, '2020-1-01')).toEqual({
          dateFormat: true
        });
        expect(validateValueForPromptChoice(promptChoice, '2020-01-1')).toEqual({
          dateFormat: true
        });
        expect(validateValueForPromptChoice(promptChoice, '2020-01-01')).toBeNull();
      });
    });

    describe('DURATION', () => {
      const promptChoice = getPromptChoiceForType('DURATION');

      it('should validate a required value', () => {
        expect(validateValueForPromptChoice({ ...promptChoice, required: false })).toBeNull();
        expect(validateValueForPromptChoice({ ...promptChoice, required: true })).toEqual({
          required: true
        });
      });
    });

    describe('FIXL', () => {
      const promptChoice = getPromptChoiceForType('FIXL');

      it('should validate a required value', () => {
        expect(validateValueForPromptChoice({ ...promptChoice, required: false })).toBeNull();
        expect(validateValueForPromptChoice({ ...promptChoice, required: true })).toEqual({
          required: true
        });
      });

      it('should validate a fixed list value', () => {
        expect(validateValueForPromptChoice(promptChoice, promptChoice.fixedList[0])).toBeNull();
        expect(validateValueForPromptChoice(promptChoice, '*')).toEqual({
          fixedList: true
        });
      });
    });

    describe('FIXLM', () => {
      const promptChoice = getPromptChoiceForType('FIXLM');

      it('should validate a required value', () => {
        expect(validateValueForPromptChoice({ ...promptChoice, required: false })).toBeNull();
        expect(validateValueForPromptChoice({ ...promptChoice, required: true })).toEqual({
          required: true
        });
      });

      it('should validate a fixed list value', () => {
        expect(validateValueForPromptChoice(promptChoice, [promptChoice.fixedList[0]])).toBeNull();
        expect(validateValueForPromptChoice(promptChoice, promptChoice.fixedList[0])).toEqual({
          fixedList: true
        });
        expect(validateValueForPromptChoice(promptChoice, [])).toEqual({
          fixedList: true
        });
      });
    });

    describe('FIXLO', () => {
      const promptChoice = { type: 'FIXLO', fixedList: ['A'] } as FixedListOtherPromptChoice;

      it('should validate a required value', () => {
        expect(validateValueForPromptChoice({ ...promptChoice, required: false })).toBeNull();
        expect(validateValueForPromptChoice({ ...promptChoice, required: true })).toEqual({
          required: true
        });
      });

      it('should validate a fixed list value', () => {
        expect(validateValueForPromptChoice(promptChoice, '*')).toBeNull();
        expect(validateValueForPromptChoice(promptChoice, 2)).toEqual({
          fixedList: true
        });
      });
    });

    describe('FIXLOM', () => {
      const promptChoice = getPromptChoiceForType('FIXLOM');

      it('should validate a required value', () => {
        expect(validateValueForPromptChoice({ ...promptChoice, required: false })).toBeNull();
        expect(validateValueForPromptChoice({ ...promptChoice, required: true })).toEqual({
          required: true
        });
      });

      it('should validate a fixed list value', () => {
        expect(validateValueForPromptChoice(promptChoice, ['*'])).toBeNull();
        expect(validateValueForPromptChoice(promptChoice, [])).toEqual({
          fixedList: true
        });
        expect(validateValueForPromptChoice(promptChoice, '*')).toEqual({
          fixedList: true
        });
      });
    });

    describe('INT', () => {
      const promptChoice = getPromptChoiceForType('INT');

      it('should validate a required value', () => {
        expect(validateValueForPromptChoice({ ...promptChoice, required: false })).toBeNull();
        expect(validateValueForPromptChoice({ ...promptChoice, required: true })).toEqual({
          required: true
        });
      });

      it('should validate an integer value', () => {
        expect(validateValueForPromptChoice(promptChoice, 1)).toBeNull();
        expect(validateValueForPromptChoice(promptChoice, '1')).toBeNull();
        expect(validateValueForPromptChoice(promptChoice, '1.0')).toEqual({ number: true });
        expect(validateValueForPromptChoice(promptChoice, 1.1)).toEqual({ number: true });
      });
    });

    describe('NAMEADDRESS', () => {
      const FCOST = getParsedResultDefinitionByShortCode('FCOST');
      const promptChoice = (FCOST.promptChoices[1] as OneOfPromptChoice).children[1];

      describe('value map', () => {
        const validValue = {
          minorcreditornameandaddressFirstName: '*',
          minorcreditornameandaddressLastName: '*',
          minorcreditornameandaddressOrganisationName: '*',
          minorcreditornameandaddressAddress1: 'A',
          minorcreditornameandaddressPostCode: 'CR0 1AX'
        };

        it('should validate a valid person name/address', () => {
          expect(
            validateValueForPromptChoice(promptChoice, omit(validValue, 'OrganisationName'))
          ).toBeNull();
        });

        it('should validate a valid organisation name/address', () => {
          expect(
            validateValueForPromptChoice(promptChoice, omit(validValue, ['FirstName', 'LastName']))
          ).toBeNull();
        });

        it('should validate a required address', () => {
          expect(validateValueForPromptChoice({ ...promptChoice, required: false })).toBeNull();
          expect(validateValueForPromptChoice({ ...promptChoice, required: true })).toEqual({
            minorcreditornameandaddressOrganisationName: { required: true },
            minorcreditornameandaddressFirstName: { required: true },
            minorcreditornameandaddressLastName: { required: true },
            minorcreditornameandaddressAddress1: { required: true },
            minorcreditornameandaddressPostCode: { required: true }
          });
        });

        it('should validate an optional address when unrelated values belong to the value map', () => {
          expect(
            validateValueForPromptChoice({ ...promptChoice, required: false }, { foo: '*' })
          ).toBeNull();
        });

        it('should validate the first address line with the `addressLine` rule', () => {
          const errors = validateValueForPromptChoice(
            { ...promptChoice, required: false },
            {
              ...validValue,
              minorcreditornameandaddressAddress1: '*',
              minorcreditornameandaddressAddress2: '*',
              minorcreditornameandaddressAddress3: '*',
              minorcreditornameandaddressAddress4: '*',
              minorcreditornameandaddressAddress5: '*'
            }
          );

          expect(errors).toEqual({
            minorcreditornameandaddressAddress1: { addressLine: true }
          });
        });

        it('should validate the postcode with the `postcode` rule', () => {
          const errors = validateValueForPromptChoice(
            { ...promptChoice, required: false },
            {
              ...validValue,
              minorcreditornameandaddressPostCode: 'CR01AX'
            }
          );

          expect(errors).toEqual({
            minorcreditornameandaddressPostCode: { postcode: true }
          });
        });

        it('should validate the email addresses with the `email` rule', () => {
          const errors = validateValueForPromptChoice(
            { ...promptChoice, required: false },
            {
              ...validValue,
              minorcreditornameandaddressEmailAddress1: 'foo@',
              minorcreditornameandaddressEmailAddress2: 'foo@'
            }
          );

          expect(errors).toEqual({
            minorcreditornameandaddressEmailAddress1: { email: true },
            minorcreditornameandaddressEmailAddress2: { email: true }
          });
        });

        it('should validate multiple email addresses within the same value', () => {
          const errors = validateValueForPromptChoice(
            { ...promptChoice, required: false },
            {
              ...validValue,
              minorcreditornameandaddressEmailAddress1: 'foo1@bar.com; foo2@',
              minorcreditornameandaddressEmailAddress2: 'foo1@bar.com; foo2@bar.com'
            }
          );

          expect(errors).toEqual({
            minorcreditornameandaddressEmailAddress1: { email: true }
          });
        });

        it('should apply the usual validation when any child value exists for an optional address', () => {
          const errors = validateValueForPromptChoice(
            { ...promptChoice, required: false },
            { minorcreditornameandaddressEmailAddress2: 'a' }
          );

          expect(errors).toEqual({
            minorcreditornameandaddressOrganisationName: { required: true },
            minorcreditornameandaddressFirstName: { required: true },
            minorcreditornameandaddressLastName: { required: true },
            minorcreditornameandaddressAddress1: { required: true },
            minorcreditornameandaddressPostCode: { required: true },
            minorcreditornameandaddressEmailAddress2: { email: true }
          });
        });
      });

      describe('result prompts', () => {
        const validResultPrompts = [
          { promptRef: 'minorcreditornameandaddressFirstName', value: '*' },
          { promptRef: 'minorcreditornameandaddressLastName', value: '*' },
          { promptRef: 'minorcreditornameandaddressOrganisationName', value: '*' },
          { promptRef: 'minorcreditornameandaddressAddress1', value: 'A' },
          { promptRef: 'minorcreditornameandaddressPostCode', value: 'CR0 1AX' }
        ];

        it('should validate a valid address', () => {
          expect(validateValueForPromptChoice(promptChoice, validResultPrompts)).toBeNull();
        });

        it('should validate a required address', () => {
          expect(validateValueForPromptChoice({ ...promptChoice, required: false }, [])).toBeNull();
          expect(validateValueForPromptChoice({ ...promptChoice, required: true }, [])).toEqual({
            minorcreditornameandaddressOrganisationName: { required: true },
            minorcreditornameandaddressFirstName: { required: true },
            minorcreditornameandaddressLastName: { required: true },
            minorcreditornameandaddressAddress1: { required: true },
            minorcreditornameandaddressPostCode: { required: true }
          });
        });

        it('should validate the first address line with the `addressLine` rule', () => {
          const errors = validateValueForPromptChoice({ ...promptChoice, required: false }, [
            validResultPrompts[0],
            validResultPrompts[1],
            validResultPrompts[2],
            validResultPrompts[4],
            { promptRef: 'minorcreditornameandaddressAddress1', value: '*' },
            { promptRef: 'minorcreditornameandaddressAddress2', value: '*' },
            { promptRef: 'minorcreditornameandaddressAddress3', value: '*' },
            { promptRef: 'minorcreditornameandaddressAddress4', value: '*' },
            { promptRef: 'minorcreditornameandaddressAddress5', value: '*' }
          ]);

          expect(errors).toEqual({
            minorcreditornameandaddressAddress1: { addressLine: true }
          });
        });

        it('should validate the postcode with the `postcode` rule', () => {
          const errors = validateValueForPromptChoice({ ...promptChoice, required: false }, [
            validResultPrompts[0],
            validResultPrompts[1],
            validResultPrompts[2],
            validResultPrompts[3],
            { promptRef: 'minorcreditornameandaddressPostCode', value: 'CR01AX' }
          ]);

          expect(errors).toEqual({
            minorcreditornameandaddressPostCode: { postcode: true }
          });
        });

        it('should validate the email addresses with the `email` rule', () => {
          const errors = validateValueForPromptChoice({ ...promptChoice, required: false }, [
            ...validResultPrompts,
            { promptRef: 'minorcreditornameandaddressEmailAddress1', value: 'foo@' },
            { promptRef: 'minorcreditornameandaddressEmailAddress2', value: 'foo@' }
          ]);

          expect(errors).toEqual({
            minorcreditornameandaddressEmailAddress1: { email: true },
            minorcreditornameandaddressEmailAddress2: { email: true }
          });
        });

        it('should validate multiple email addresses within the same value', () => {
          const errors = validateValueForPromptChoice({ ...promptChoice, required: false }, [
            ...validResultPrompts,
            { promptRef: 'minorcreditornameandaddressEmailAddress1', value: 'foo1@bar.com; foo2@' },
            {
              promptRef: 'minorcreditornameandaddressEmailAddress2',
              value: 'foo1@bar.com; foo2@bar.com'
            }
          ]);

          expect(errors).toEqual({
            minorcreditornameandaddressEmailAddress1: { email: true }
          });
        });

        it('should apply the usual validation when any child value exists for an optional address', () => {
          const errors = validateValueForPromptChoice({ ...promptChoice, required: false }, [
            { promptRef: 'minorcreditornameandaddressEmailAddress2', value: 'a' }
          ]);

          expect(errors).toEqual({
            minorcreditornameandaddressOrganisationName: { required: true },
            minorcreditornameandaddressFirstName: { required: true },
            minorcreditornameandaddressLastName: { required: true },
            minorcreditornameandaddressAddress1: { required: true },
            minorcreditornameandaddressPostCode: { required: true },
            minorcreditornameandaddressEmailAddress2: { email: true }
          });
        });
      });
    });

    describe('ONEOF', () => {
      const promptChoice = getPromptChoiceForType('ONEOF');

      it('should validate a required value', () => {
        expect(validateValueForPromptChoice({ ...promptChoice, required: false })).toBeNull();
        expect(validateValueForPromptChoice({ ...promptChoice, required: true })).toEqual({
          required: true
        });
      });

      it('should validate a ONEOF value', () => {
        expect(
          validateValueForPromptChoice(promptChoice, {
            promptRef: promptChoice.children[0].promptRef
          })
        ).toBeNull();
        expect(validateValueForPromptChoice(promptChoice, { promptRef: '*' })).toEqual({
          oneOf: true
        });
      });
    });

    describe('TIME', () => {
      const promptChoice = getPromptChoiceForType('TIME');

      it('should validate a required value', () => {
        expect(validateValueForPromptChoice({ ...promptChoice, required: false })).toBeNull();
        expect(validateValueForPromptChoice({ ...promptChoice, required: true })).toEqual({
          required: true
        });
      });

      it('should validate a time value', () => {
        expect(validateValueForPromptChoice(promptChoice, '10:')).toEqual({ timeFormat: true });
        expect(validateValueForPromptChoice(promptChoice, ':00')).toEqual({ timeFormat: true });
        expect(validateValueForPromptChoice(promptChoice, '1:0')).toEqual({ timeFormat: true });
        expect(validateValueForPromptChoice(promptChoice, '10:00')).toBeNull();
      });
    });

    describe('TXT', () => {
      const promptChoice = getPromptChoiceForType('TXT');

      it('should validate a required value', () => {
        expect(validateValueForPromptChoice({ ...promptChoice, required: false })).toBeNull();
        expect(validateValueForPromptChoice({ ...promptChoice, required: true })).toEqual({
          required: true
        });
      });

      it('should validate a `minLength` attribute', () => {
        const choice = { ...promptChoice, minLength: '3' };

        expect(validateValueForPromptChoice(choice, '**')).toEqual({
          minimumLength: {
            actual: 2,
            expected: 3
          }
        });
        expect(validateValueForPromptChoice(choice, '***')).toBeNull();
      });

      it('should validate a `maxLength` attribute', () => {
        const choice = { ...promptChoice, maxLength: '3' };

        expect(validateValueForPromptChoice(choice, '***')).toBeNull();
        expect(validateValueForPromptChoice(choice, '****')).toEqual({
          maximumLength: {
            actual: 4,
            expected: 3
          }
        });
      });
    });
  });
});
