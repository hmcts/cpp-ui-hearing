import { Component } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NgForm } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { Address, ADDRESS_LOOKUP_CONFIG } from '@cpp/application';
import { provideMockStore } from '@ngrx/store/testing';
import { last } from 'lodash-es';
import { of } from 'rxjs';
import { createDraftResultPrompt } from '../../../core/helpers';
import { ReusableInfoService } from '../../../core/services/reusable-info.service';
import {
  createDraftResultPrompt as createTestDraftResultPrompt,
  getParsedResultDefinitionByShortCode,
  getPromptChoiceForType
} from '../../../core/testing';
import {
  DraftResultPrompt,
  NameAddressPromptChoice,
  OneOfPromptChoice,
  PromptChoice,
  PromptEntry,
  TextPromptChoice
} from '../../../results.interfaces';
import { DraftResultLineComponent } from '../../draft-result-line/draft-result-line.component';
import { ResultPromptsFormComponent } from '../result-prompts-form.component';

describe('ResultPromptsForm', () => {
  let fixture: ComponentFixture<ResultPromptFormTestComponent>;

  beforeEach(() => {
    const route = new ActivatedRoute();
    route.snapshot = new ActivatedRouteSnapshot();
    route.snapshot.url = [];
    route.snapshot.params = { hearingId: 'hearingId' };

    TestBed.configureTestingModule({
      imports: [ResultPromptFormTestComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: route
        },
        {
          provide: DraftResultLineComponent,
          useValue: {
            resultLine: {
              applicationId: 'applicationId',
              orderedDate: '2021-01-01'
            }
          }
        },
        {
          provide: ReusableInfoService,
          useValue: {
            getValueForPromptChoice: jest.fn(() => of(undefined))
          }
        },
        provideMockStore({ initialState: { results: {} } }),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ADDRESS_LOOKUP_CONFIG,
          useValue: { baseUrl: 'https://example.test/places', dataset: 'DPA' }
        }
      ],
      teardown: { destroyAfterEach: false }
    });
    fixture = TestBed.createComponent(ResultPromptFormTestComponent);
  });

  const getFormValues = (): Record<string, unknown> => {
    return fixture.debugElement.query(By.directive(NgForm)).componentInstance.ngForm.value;
  };

  const getFormErrors = () => {
    return last(fixture.componentInstance.handleErrors.mock.calls)[0];
  };

  const setFormValue = (promptRef: string, value: unknown) => {
    const ngForm = fixture.debugElement.query(By.directive(NgForm)).componentInstance;

    Object.keys(ngForm.ngForm.controls).forEach((key, idx) => {
      if (key === promptRef) {
        const ngModels = fixture.debugElement.queryAll(By.css('*[ng-reflect-name]'));
        const elem = ngModels[idx].nativeElement;
        ngForm.ngForm.controls[key].setValue(value);
        elem.dispatchEvent(new Event('input'));
      }
    });
    fixture.detectChanges();
    tick();
  };

  const submitForm = () => {
    fixture.debugElement.query(By.css(`button[type=submit]`)).nativeElement.click();
  };

  const selectAutosuggestAddress = (address: Address) => {
    const autosuggest = fixture.debugElement.query(By.css('cpp-address-autosuggest'));

    autosuggest.componentInstance.selectAddress(address);
    fixture.detectChanges();
    tick();
  };

  // selectAddress() (above) is for picking a suggestion from the search dropdown, and
  // is gated by isPopulatedAddress (real OS Places results always have line1/town/postcode).
  // "No fixed abode" is set via the nested cpp-address's own checkbox, which writes
  // straight to addressControl and isn't subject to that gate - simulate that path directly.
  const editAutosuggestAddress = (address: Address) => {
    const autosuggest = fixture.debugElement.query(By.css('cpp-address-autosuggest'));

    autosuggest.componentInstance.addressControl.setValue(address);
    fixture.detectChanges();
    tick();
  };

  const getSubmittedResultPrompts = () => {
    return fixture.componentInstance.handleFormSubmit.mock.calls[0][0];
  };

  describe('ADDRESS prompt', () => {
    const ADDRESS = {
      ...getPromptChoiceForType('ADDRESS'),
      required: true
    };

    beforeEach(() => {
      fixture.componentInstance.promptChoices = [ADDRESS];
    });

    it('should render the address inputs', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(fixture).toMatchSnapshot();
    }));

    it('should prepopulate the address inputs using a result prompt', fakeAsync(() => {
      fixture.componentInstance.resultPrompts = [createTestDraftResultPrompt(ADDRESS)];
      fixture.detectChanges();
      tick();
      expect(getFormValues()).toMatchInlineSnapshot(`
        {
          "protectedpersonsaddressAddress1": "X",
          "protectedpersonsaddressAddress2": "X",
          "protectedpersonsaddressAddress3": "X",
          "protectedpersonsaddressAddress4": "X",
          "protectedpersonsaddressAddress5": "X",
          "protectedpersonsaddressEmailAddress1": "foo@bar.org",
          "protectedpersonsaddressEmailAddress2": "foo@bar.org",
          "protectedpersonsaddressPostCode": "CR0 1XN",
        }
      `);
    }));

    it('should raise an error when a required input is absent', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      submitForm();
      expect(getFormErrors()).toMatchInlineSnapshot(`
        [
          {
            "controlRef": ElementRef {
              "nativeElement": <input
                class="ng-untouched ng-pristine ng-valid govuk-input"
                id="pdk-form-control-undefined-GENERATED_ID"
                pdk-input=""
                type="text"
              />,
            },
            "id": "pdk-form-error-undefined-GENERATED_ID",
            "message": "Protected person's address address line 1 – Enter this information",
            "shouldFocus": true,
          },
          {
            "controlRef": ElementRef {
              "nativeElement": <input
                class="ng-untouched ng-pristine ng-valid govuk-input govuk-input--width-5"
                id="pdk-form-control-undefined-GENERATED_ID"
                pdk-input=""
                type="text"
              />,
            },
            "id": "pdk-form-error-undefined-GENERATED_ID",
            "message": "Protected person's address post code – Enter a postcode",
            "shouldFocus": true,
          },
        ]
      `);
    }));

    it('should validate the format of the inputs', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      tick();
      setFormValue('protectedpersonsaddressAddress1', '*');
      setFormValue('protectedpersonsaddressAddress2', '!');
      setFormValue('protectedpersonsaddressAddress3', '?');
      setFormValue('protectedpersonsaddressAddress4', '^');
      setFormValue('protectedpersonsaddressAddress5', '%');
      setFormValue('protectedpersonsaddressPostCode', 'CR01AX');
      setFormValue('protectedpersonsaddressEmailAddress1', 'foobar.com');
      setFormValue('protectedpersonsaddressEmailAddress2', 'barfoo.com');
      submitForm();

      expect(getFormErrors()).toMatchInlineSnapshot(`
        [
          {
            "controlRef": ElementRef {
              "nativeElement": <input
                class="ng-untouched ng-valid govuk-input ng-dirty"
                id="pdk-form-control-undefined-GENERATED_ID"
                pdk-input=""
                type="text"
              />,
            },
            "id": "pdk-form-error-undefined-GENERATED_ID",
            "message": "Protected person's address address line 1 – An address line can only start with letters or numbers",
            "shouldFocus": true,
          },
          {
            "controlRef": ElementRef {
              "nativeElement": <input
                class="ng-untouched ng-valid govuk-input govuk-input--width-5 ng-dirty"
                id="pdk-form-control-undefined-GENERATED_ID"
                pdk-input=""
                type="text"
              />,
            },
            "id": "pdk-form-error-undefined-GENERATED_ID",
            "message": "Protected person's address post code – Postcode must be in the right format with a space, for example AB1 2CD",
            "shouldFocus": true,
          },
          {
            "controlRef": ElementRef {
              "nativeElement": <input
                class="ng-untouched ng-valid govuk-input ng-dirty"
                id="pdk-form-control-undefined-GENERATED_ID"
                pdk-input=""
                type="text"
              />,
            },
            "id": "pdk-form-error-undefined-GENERATED_ID",
            "message": "Protected person's address email address 1 (optional) – Enter a valid email address",
            "shouldFocus": true,
          },
          {
            "controlRef": ElementRef {
              "nativeElement": <input
                class="ng-untouched ng-valid govuk-input ng-dirty"
                id="pdk-form-control-undefined-GENERATED_ID"
                pdk-input=""
                type="text"
              />,
            },
            "id": "pdk-form-error-undefined-GENERATED_ID",
            "message": "Protected person's address email address 2 (optional) – Enter a valid email address",
            "shouldFocus": true,
          },
        ]
      `);
    }));

    it('should not raise an error on an optional address until an input is populated', fakeAsync(() => {
      fixture.componentInstance.promptChoices = [{ ...ADDRESS, required: false }];
      fixture.detectChanges();
      tick();
      submitForm();
      expect(fixture.componentInstance.handleErrors).toHaveBeenCalledWith(null);

      setFormValue('protectedpersonsaddressAddress2', '29 Acacia Road');
      submitForm();
      expect(getFormErrors()).toMatchInlineSnapshot(`
        [
          {
            "controlRef": ElementRef {
              "nativeElement": <input
                class="ng-untouched ng-pristine ng-valid govuk-input"
                id="pdk-form-control-undefined-GENERATED_ID"
                pdk-input=""
                type="text"
              />,
            },
            "id": "pdk-form-error-undefined-GENERATED_ID",
            "message": "Protected person's address address line 1 – Enter this information",
            "shouldFocus": true,
          },
          {
            "controlRef": ElementRef {
              "nativeElement": <input
                class="ng-untouched ng-pristine ng-valid govuk-input govuk-input--width-5"
                id="pdk-form-control-undefined-GENERATED_ID"
                pdk-input=""
                type="text"
              />,
            },
            "id": "pdk-form-error-undefined-GENERATED_ID",
            "message": "Protected person's address post code – Enter a postcode",
            "shouldFocus": true,
          },
        ]
      `);
    }));

    it('should create a result prompt when valid', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      setFormValue('protectedpersonsaddressAddress1', '29 Acacia Road');
      setFormValue('protectedpersonsaddressPostCode', 'CR0 1AX');
      submitForm();
      expect(getSubmittedResultPrompts()).toMatchInlineSnapshot(`
        [
          {
            "label": "Protected person's address address line 1",
            "promptId": "abc9bb61-cb5b-4cf7-be24-8866bcd2fc69",
            "promptRef": "protectedpersonsaddress",
            "type": "ADDRESS",
            "value": [
              {
                "label": "Protected person's address address line 1",
                "promptId": "abc9bb61-cb5b-4cf7-be24-8866bcd2fc69",
                "promptRef": "protectedpersonsaddressAddress1",
                "type": "TXT",
                "value": "29 Acacia Road",
              },
              {
                "label": "Protected person's address post code",
                "promptId": "abc9bb61-cb5b-4cf7-be24-8866bcd2fc69",
                "promptRef": "protectedpersonsaddressPostCode",
                "type": "TXT",
                "value": "CR0 1AX",
              },
            ],
          },
        ]
      `);
    }));
  });

  describe('ADDRESS prompt with address lookup', () => {
    const ADDRESS_WITH_LOOKUP = {
      ...getPromptChoiceForType('ADDRESS'),
      required: true,
      isStructuredUnstructuredAddress: true
    };

    beforeEach(() => {
      fixture.componentInstance.promptChoices = [ADDRESS_WITH_LOOKUP];
    });

    it('should render the address lookup above the address fields', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(fixture.debugElement.query(By.css('cpp-address-autosuggest'))).not.toBeNull();
    }));

    it('should not render the address lookup when isStructuredUnstructuredAddress is not set', fakeAsync(() => {
      fixture.componentInstance.promptChoices = [
        { ...ADDRESS_WITH_LOOKUP, isStructuredUnstructuredAddress: false }
      ];
      fixture.detectChanges();
      tick();
      expect(fixture.debugElement.query(By.css('cpp-address-autosuggest'))).toBeNull();
    }));

    it('should populate the address fields when an address is selected', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      selectAutosuggestAddress({
        line1: '29 Acacia Road',
        town: 'Bristol',
        postcode: 'BS1 1AA'
      });
      expect(getFormValues()).toMatchObject({
        protectedpersonsaddressAddress1: '29 Acacia Road',
        protectedpersonsaddressAddress3: 'Bristol',
        protectedpersonsaddressPostCode: 'BS1 1AA'
      });
    }));

    it('should keep the same currentAddress object across repeated change detection cycles once a result is populated', fakeAsync(() => {
      // currentAddress feeds cpp-address-autosuggest's [ngModel]. A getter that
      // built a new object on every read would look "changed" to Angular on
      // every check once the result has real address data, re-triggering
      // cpp-address's real OS Places verification call in a tight loop.
      fixture.componentInstance.resultPrompts = [createTestDraftResultPrompt(ADDRESS_WITH_LOOKUP)];
      fixture.detectChanges();
      tick();
      const component = fixture.debugElement.query(By.css('cpp-address-prompt-choice'))
        .componentInstance as { currentAddress: unknown };
      const first = component.currentAddress;

      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      tick();

      expect(component.currentAddress).toBe(first);
    }));

    it('should overwrite the address fields when a different address is selected', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      selectAutosuggestAddress({
        line1: '29 Acacia Road',
        town: 'Bristol',
        postcode: 'BS1 1AA'
      });
      selectAutosuggestAddress({
        line1: '31 Acacia Road',
        town: 'Bristol',
        postcode: 'BS1 1AB'
      });
      submitForm();
      const [{ value: children }] = getSubmittedResultPrompts();
      const address1 = children.find(
        (child: DraftResultPrompt) => child.promptRef === 'protectedpersonsaddressAddress1'
      );
      const postCode = children.find(
        (child: DraftResultPrompt) => child.promptRef === 'protectedpersonsaddressPostCode'
      );
      expect(address1.value).toBe('31 Acacia Road');
      expect(postCode.value).toBe('BS1 1AB');
    }));

    it('should clear address lines that are absent from a subsequently selected address', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      selectAutosuggestAddress({
        line1: '29 Acacia Road',
        line2: 'Flat 2',
        town: 'Bristol',
        postcode: 'BS1 1AA'
      });
      selectAutosuggestAddress({
        line1: '31 Anchor Road',
        town: 'Bristol',
        postcode: 'BS1 1AB'
      });
      expect(getFormValues()).toMatchObject({
        protectedpersonsaddressAddress1: '31 Anchor Road',
        protectedpersonsaddressAddress2: null
      });
    }));

    it('should clear all other address fields except address line 1 when "No fixed abode" is selected', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      selectAutosuggestAddress({
        line1: '29 Acacia Road',
        line2: 'Flat 2',
        town: 'Bristol',
        postcode: 'BS1 1AA'
      });
      editAutosuggestAddress({
        line1: 'No fixed abode',
        town: '',
        postcode: '',
        noFixedAbode: true
      });
      expect(getFormValues()).toMatchObject({
        protectedpersonsaddressAddress1: 'No fixed abode',
        protectedpersonsaddressAddress2: null,
        protectedpersonsaddressAddress3: null
      });
      expect(getFormValues()).not.toHaveProperty('protectedpersonsaddressPostCode');
    }));

    it('should disable the postcode field when "No fixed abode" is selected, and re-enable it when a real address is selected afterwards', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      const ngForm = fixture.debugElement.query(By.directive(NgForm)).componentInstance.ngForm;

      editAutosuggestAddress({
        line1: 'No fixed abode',
        town: '',
        postcode: '',
        noFixedAbode: true
      });
      expect(ngForm.controls['protectedpersonsaddressPostCode'].disabled).toBe(true);

      selectAutosuggestAddress({
        line1: '29 Acacia Road',
        town: 'Bristol',
        postcode: 'BS1 1AA'
      });
      expect(ngForm.controls['protectedpersonsaddressPostCode'].disabled).toBe(false);
      expect(getFormValues()).toMatchObject({ protectedpersonsaddressPostCode: 'BS1 1AA' });
    }));
  });

  describe('BOOLEAN prompt', () => {
    const BOOLEAN = {
      ...getPromptChoiceForType('BOOLEAN'),
      required: true
    };

    beforeEach(() => {
      fixture.componentInstance.promptChoices = [BOOLEAN];
    });

    it('should render a boolean input', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(fixture).toMatchSnapshot();
    }));

    it('should prepopulate the input using a result prompt', fakeAsync(() => {
      fixture.componentInstance.resultPrompts = [createTestDraftResultPrompt(BOOLEAN)];
      fixture.detectChanges();
      tick();
      expect(getFormValues()).toMatchInlineSnapshot(`
        {
          "concurrent": true,
        }
      `);
    }));

    it('should raise an error when a required input is absent', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      submitForm();
      expect(getFormErrors()).toMatchInlineSnapshot(`
        [
          {
            "controlRef": {
              "nativeElement": {
                "focus": [Function],
              },
            },
            "id": "pdk-form-error-undefined-GENERATED_ID",
            "message": "Concurrent – Select an option",
            "shouldFocus": true,
          },
        ]
      `);
    }));

    it('should create a result prompt when valid', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      setFormValue('concurrent', true);
      fixture.detectChanges();
      tick();
      submitForm();
      expect(getSubmittedResultPrompts()).toMatchInlineSnapshot(`
        [
          {
            "label": "Concurrent",
            "promptId": "746c833a-7d33-4800-a40c-425dbacf7492",
            "promptRef": "concurrent",
            "type": "BOOLEAN",
            "value": true,
          },
        ]
      `);
    }));
  });

  describe('BOOLEAN prompt – ex-parte civil case (thisSummonsWillBeServedByAProsecutor)', () => {
    const SERVED_BY_PROSECUTOR = {
      ...getPromptChoiceForType('BOOLEAN'),
      promptRef: 'thisSummonsWillBeServedByAProsecutor',
      required: true
    };

    beforeEach(() => {
      fixture.componentInstance.promptChoices = [SERVED_BY_PROSECUTOR];
    });

    it('should render radio group when isExParteCase is false', fakeAsync(() => {
      fixture.componentInstance.isExParteCase = false;
      fixture.detectChanges();
      tick();
      expect(fixture.debugElement.query(By.css('pdk-radio-group'))).not.toBeNull();
      expect(fixture.debugElement.query(By.css('input[type=hidden]'))).toBeNull();
    }));

    it('should render radio group when isExParteCase is undefined', fakeAsync(() => {
      fixture.componentInstance.isExParteCase = undefined;
      fixture.detectChanges();
      tick();
      expect(fixture.debugElement.query(By.css('pdk-radio-group'))).not.toBeNull();
      expect(fixture.debugElement.query(By.css('input[type=hidden]'))).toBeNull();
    }));

    it('should hide radio group and render a hidden input when isExParteCase is true', fakeAsync(() => {
      fixture.componentInstance.isExParteCase = true;
      fixture.detectChanges();
      tick();
      expect(fixture.debugElement.query(By.css('pdk-radio-group'))).toBeNull();
      expect(fixture.debugElement.query(By.css('input[type=hidden]'))).not.toBeNull();
    }));

    it('should default the form value to true without user interaction when isExParteCase is true', fakeAsync(() => {
      fixture.componentInstance.isExParteCase = true;
      fixture.detectChanges();
      tick();
      expect(getFormValues()).toEqual({ thisSummonsWillBeServedByAProsecutor: true });
    }));

    it('should submit the prompt with value true when isExParteCase is true', fakeAsync(() => {
      fixture.componentInstance.isExParteCase = true;
      fixture.detectChanges();
      tick();
      submitForm();
      expect(fixture.componentInstance.handleFormSubmit).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            promptRef: 'thisSummonsWillBeServedByAProsecutor',
            type: 'BOOLEAN',
            value: true
          })
        ])
      );
    }));

    it('should still render radio group for a different boolean prompt when isExParteCase is true', fakeAsync(() => {
      fixture.componentInstance.promptChoices = [
        { ...getPromptChoiceForType('BOOLEAN'), required: true }
      ];
      fixture.componentInstance.isExParteCase = true;
      fixture.detectChanges();
      tick();
      expect(fixture.debugElement.query(By.css('pdk-radio-group'))).not.toBeNull();
      expect(fixture.debugElement.query(By.css('input[type=hidden]'))).toBeNull();
    }));
  });

  describe('CURR prompt', () => {
    const CURR = {
      ...getPromptChoiceForType('CURR'),
      minValue: '2',
      maxValue: '999',
      required: true
    };

    beforeEach(() => {
      fixture.componentInstance.promptChoices = [CURR];
    });

    it('should render a currency input', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(fixture).toMatchSnapshot();
    }));

    it('should prepopulate the input using a result prompt', fakeAsync(() => {
      fixture.componentInstance.resultPrompts = [createTestDraftResultPrompt(CURR)];
      fixture.detectChanges();
      tick();
      expect(getFormValues()).toMatchInlineSnapshot(`
        {
          "IAMT": "100",
        }
      `);
    }));

    it('should raise an error when a required input is absent', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      submitForm();
      expect(getFormErrors()).toMatchInlineSnapshot(`
        [
          {
            "controlRef": ElementRef {
              "nativeElement": <input
                autocomplete="off"
                class="ng-untouched ng-pristine ng-valid govuk-input govuk-input--width-10"
                id="pdk-currency-input-GENERATED_ID"
                name="IAMT"
                pattern="/^$|(?=.*?\\d)^\\$?(([1-9]\\d{0,2}(,\\d{3})*)|\\d+)?(\\.\\d{2})?$/"
                type="text"
              />,
            },
            "id": "pdk-form-error-undefined-GENERATED_ID",
            "message": "Instalment amount – Enter an amount, for example £250",
            "shouldFocus": true,
          },
        ]
      `);
    }));

    it('should raise an error when the input is greater than maxValue', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      setFormValue('IAMT', '1000');
      submitForm();
      expect(fixture.componentInstance.handleErrors).toHaveBeenCalledWith([
        {
          id: 'pdk-form-error-undefined-GENERATED_ID',
          controlRef: expect.objectContaining({
            nativeElement: expect.any(HTMLInputElement)
          }),
          message: 'Instalment amount – Enter a value that is not greater than £999',
          shouldFocus: true
        }
      ]);
    }));

    it('should raise an error when the input is lower than minValue', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      setFormValue('IAMT', '1');
      submitForm();
      expect(fixture.componentInstance.handleErrors).toHaveBeenCalledWith([
        {
          id: 'pdk-form-error-undefined-GENERATED_ID',
          controlRef: expect.objectContaining({
            nativeElement: expect.any(HTMLInputElement)
          }),
          message: 'Instalment amount – Enter an amount equal to or greater than £2',
          shouldFocus: true
        }
      ]);
    }));

    it('should raise an error when the input has just 1 decimal place', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      setFormValue('IAMT', '2.1');
      submitForm();
      expect(fixture.componentInstance.handleErrors).toHaveBeenCalled();
    }));

    it('should raise an error when the input has more that 2 decimal places', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      setFormValue('IAMT', '2.001');
      submitForm();
      expect(fixture.componentInstance.handleErrors).toHaveBeenCalled();
    }));

    it('should create a result prompt when valid', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      setFormValue('IAMT', '100.01');
      submitForm();
      expect(fixture.componentInstance.handleFormSubmit).toHaveBeenCalledWith([
        {
          label: 'Instalment amount',
          promptId: '1393acda-7a35-4d65-859d-6298e1470cf1',
          promptRef: 'IAMT',
          type: 'CURR',
          value: '100.01'
        }
      ]);
    }));
  });

  describe('DATE prompt', () => {
    const DATE = {
      ...getPromptChoiceForType('DATE'),
      required: true
    };

    beforeEach(() => {
      fixture.componentInstance.promptChoices = [DATE];
    });

    it('should render a date input', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(fixture).toMatchSnapshot();
    }));

    it('should prepopulate the input using a result prompt', fakeAsync(() => {
      fixture.componentInstance.resultPrompts = [createTestDraftResultPrompt(DATE)];
      fixture.detectChanges();
      tick();
      expect(getFormValues()).toMatchInlineSnapshot(`
        {
          "consecutiveToSentenceImposedOn": "2020-01-01",
        }
      `);
    }));

    it('should raise an error when a required input is absent', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      submitForm();
      expect(getFormErrors()).toMatchInlineSnapshot(`
        [
          {
            "controlRef": ElementRef {
              "nativeElement": <input
                autocomplete="off"
                class="govuk-date-input__input ng-untouched ng-pristine ng-invalid govuk-input govuk-input--width-2"
                formcontrolname="day"
                id="pdk-date-input-GENERATED_ID-day"
                name="dateDay"
                required=""
                type="number"
              />,
            },
            "id": "pdk-form-error-undefined-GENERATED_ID",
            "message": "Consecutive to sentence imposed on – Enter a date",
            "shouldFocus": true,
          },
        ]
      `);
    }));

    it('should create a result prompt when valid', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      setFormValue('consecutiveToSentenceImposedOn', '2020-01-01');
      submitForm();
      expect(getSubmittedResultPrompts()).toMatchInlineSnapshot(`
        [
          {
            "label": "Consecutive to sentence imposed on",
            "promptId": "83b92cfe-9160-4e46-baa1-b9a1e99b41cc",
            "promptRef": "consecutiveToSentenceImposedOn",
            "type": "DATE",
            "value": "2020-01-01",
          },
        ]
      `);
    }));
  });

  describe('DURATION prompt', () => {
    const DURATION = {
      ...getPromptChoiceForType('DURATION'),
      required: true
    };

    beforeEach(() => {
      fixture.componentInstance.promptChoices = [DURATION];
    });

    it('should render a duration input', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(fixture).toMatchSnapshot();
    }));

    it('should prepopulate the input using a result prompt', fakeAsync(() => {
      fixture.componentInstance.resultPrompts = [createTestDraftResultPrompt(DURATION)];
      fixture.detectChanges();
      tick();
      expect(getFormValues()).toMatchInlineSnapshot(`
        {
          "imprisonmentPeriod": [
            {
              "label": "Minutes",
              "type": "INT",
              "value": 60,
            },
          ],
        }
      `);
    }));

    it('should raise an error when a required input is absent', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      submitForm();
      expect(getFormErrors()).toMatchInlineSnapshot(`
        [
          {
            "controlRef": undefined,
            "id": "pdk-form-error-undefined-GENERATED_ID",
            "message": "Imprisonment Period – Enter a number under one unit of time, for example 22 days",
            "shouldFocus": true,
          },
        ]
      `);
    }));

    it('should raise an error when more than 1 duration unit is inserted and multipleAllowed is undefined or false', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      setFormValue('imprisonmentPeriod', [
        {
          type: 'INT',
          label: 'Years',
          value: 1
        },
        {
          type: 'INT',
          label: 'Days',
          value: 60
        }
      ]);
      submitForm();
      expect(fixture.componentInstance.handleErrors).toHaveBeenCalledWith([
        {
          id: 'pdk-form-error-undefined-GENERATED_ID',
          message: 'Imprisonment Period – Use only one duration unit',
          shouldFocus: true
        }
      ]);
    }));

    it('should create a result prompt when more than 1 duration unit is inserted and multipleAllowed is true', fakeAsync(() => {
      fixture.componentInstance.promptChoices = [{ ...DURATION, multipleAllowed: true }];
      fixture.detectChanges();
      tick();
      setFormValue('imprisonmentPeriod', [
        {
          type: 'INT',
          label: 'Years',
          value: 1
        },
        {
          type: 'INT',
          label: 'Months',
          value: 60
        }
      ]);
      submitForm();
      expect(fixture.componentInstance.handleFormSubmit).toHaveBeenCalledWith([
        {
          label: 'Imprisonment Period',
          promptId: '76f15753-1706-42fb-b922-0d56d01e5706',
          promptRef: 'imprisonmentPeriod',
          type: 'DURATION',
          value: [
            {
              label: 'Years',
              type: 'INT',
              value: 1
            },
            {
              label: 'Months',
              type: 'INT',
              value: 60
            }
          ]
        }
      ]);
    }));

    it('should create a result prompt when valid', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      setFormValue('imprisonmentPeriod', [{ label: 'HOURS', value: 1, type: 'INT' }]);
      submitForm();
      expect(getSubmittedResultPrompts()).toMatchInlineSnapshot(`
        [
          {
            "label": "Imprisonment Period",
            "promptId": "76f15753-1706-42fb-b922-0d56d01e5706",
            "promptRef": "imprisonmentPeriod",
            "type": "DURATION",
            "value": [
              {
                "label": "HOURS",
                "type": "INT",
                "value": 1,
              },
            ],
          },
        ]
      `);
    }));
  });

  describe('FIXL prompt', () => {
    const FIXL = {
      ...getPromptChoiceForType('FIXL'),
      required: true
    };

    beforeEach(() => {
      fixture.componentInstance.promptChoices = [FIXL];
    });

    it('should render a fixed list input', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(fixture).toMatchSnapshot();
    }));

    it('should prepopulate the input using a result prompt', fakeAsync(() => {
      fixture.componentInstance.resultPrompts = [createTestDraftResultPrompt(FIXL)];
      fixture.detectChanges();
      tick();
      expect(getFormValues()).toMatchInlineSnapshot(`
        {
          "imprisonmentReasons": "failure to comply with a pre-sentence drug testing order",
        }
      `);
    }));

    it('should raise an error when a required input is absent', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      submitForm();
      expect(getFormErrors()).toMatchInlineSnapshot(`
        [
          {
            "controlRef": undefined,
            "id": "pdk-form-error-undefined-GENERATED_ID",
            "message": "Imprisonment reasons – Select an option",
            "shouldFocus": true,
          },
        ]
      `);
    }));

    it('should create a result prompt when valid', fakeAsync(() => {
      const { value } = createTestDraftResultPrompt(FIXL);
      fixture.detectChanges();
      tick();
      setFormValue('imprisonmentReasons', value);
      submitForm();
      expect(getSubmittedResultPrompts()).toMatchInlineSnapshot(`
        [
          {
            "label": "Imprisonment reasons",
            "promptId": "ea957761-0813-4a92-9e7c-b536654325f0",
            "promptRef": "imprisonmentReasons",
            "type": "FIXL",
            "value": "failure to comply with a pre-sentence drug testing order",
          },
        ]
      `);
    }));
  });

  describe('FIXLM prompt', () => {
    const FIXLM = {
      ...getPromptChoiceForType('FIXLM'),
      required: true
    };

    beforeEach(() => {
      fixture.componentInstance.promptChoices = [FIXLM];
    });

    it('should render a fixed list input', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(fixture).toMatchSnapshot();
    }));

    it('should prepopulate the input using a result prompt', fakeAsync(() => {
      fixture.componentInstance.resultPrompts = [createTestDraftResultPrompt(FIXLM)];
      fixture.detectChanges();
      tick();
      expect(getFormValues()).toMatchInlineSnapshot(`
        {
          "days": [
            "Daily",
            "Fridays",
          ],
        }
      `);
    }));

    it('should raise an error when a required input is absent', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      submitForm();
      expect(getFormErrors()).toMatchInlineSnapshot(`
        [
          {
            "controlRef": undefined,
            "id": "pdk-form-error-undefined-GENERATED_ID",
            "message": "Days – Select an option",
            "shouldFocus": true,
          },
        ]
      `);
    }));

    it('should create a result prompt when valid', fakeAsync(() => {
      const { value } = createTestDraftResultPrompt(FIXLM);
      fixture.detectChanges();
      tick();
      setFormValue('days', value);
      submitForm();
      expect(getSubmittedResultPrompts()).toMatchInlineSnapshot(`
        [
          {
            "label": "Days",
            "promptId": "53f817cd-0070-455e-9826-a103bd4a4a26",
            "promptRef": "days",
            "type": "FIXLM",
            "value": [
              "Daily",
              "Fridays",
            ],
          },
        ]
      `);
    }));
  });

  describe('FIXLOM prompt', () => {
    const FIXLOM = {
      ...getPromptChoiceForType('FIXLOM'),
      required: true
    };

    beforeEach(() => {
      fixture.componentInstance.promptChoices = [FIXLOM];
    });

    it('should render a fixed list input', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(fixture).toMatchSnapshot();
    }));

    it('should render custom text not part of the fixed list', fakeAsync(() => {
      fixture.componentInstance.resultPrompts = [createTestDraftResultPrompt(FIXLOM)];
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      tick();

      expect(fixture).toMatchSnapshot();
    }));

    it('should prepopulate the input using a result prompt', fakeAsync(() => {
      fixture.componentInstance.resultPrompts = [createTestDraftResultPrompt(FIXLOM)];
      fixture.detectChanges();
      tick();
      expect(getFormValues()).toMatchInlineSnapshot(`
        {
          "theReasonsForThis": [
            "an unprovoked attack of a serious nature",
            "X",
          ],
        }
      `);
    }));

    it('should raise an error when a required input is absent', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      submitForm();
      expect(getFormErrors()).toMatchInlineSnapshot(`
        [
          {
            "controlRef": undefined,
            "id": "pdk-form-error-undefined-GENERATED_ID",
            "message": "Reason for custody – Select an option",
            "shouldFocus": true,
          },
        ]
      `);
    }));

    it('should create a result prompt when valid', fakeAsync(() => {
      const { value } = createTestDraftResultPrompt(FIXLOM);
      fixture.detectChanges();
      tick();
      setFormValue('theReasonsForThis', value);
      submitForm();
      expect(getSubmittedResultPrompts()).toMatchInlineSnapshot(`
        [
          {
            "label": "Reason for custody",
            "promptId": "622aa563-a3db-4102-ba7e-21c21cee0110",
            "promptRef": "theReasonsForThis",
            "type": "FIXLOM",
            "value": [
              "an unprovoked attack of a serious nature",
              "X",
            ],
          },
        ]
      `);
    }));
  });

  describe('HCROOM prompt', () => {
    // Use NHCCS definition, which includes a courtroom (HCROOM) prompt choice
    const NHCCS = getParsedResultDefinitionByShortCode('NHCCS');
    const HCROOM = NHCCS.promptChoices.find(
      promptChoice => (promptChoice as any).componentType === 'HCROOM'
    ) as PromptChoice;

    beforeEach(() => {
      fixture.componentInstance.promptChoices = [HCROOM];
    });

    it('should register the courtroom prompt in the form', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(Object.keys(getFormValues())).toContain('HCROOM');
    }));
  });

  describe('NAMEADDRESS prompt', () => {
    describe('Both / Person', () => {
      // Use 'Minor creditor' in FCOST
      const FCOST = getParsedResultDefinitionByShortCode('FCOST');
      const NAMEADDRESS = (FCOST.promptChoices[1] as OneOfPromptChoice).children[1];

      beforeEach(() => {
        fixture.componentInstance.promptChoices = [NAMEADDRESS];
      });

      it('should render the name/address inputs', fakeAsync(() => {
        fixture.detectChanges();
        tick();
        expect(fixture).toMatchSnapshot();
      }));

      it('should prepopulate the input using a result prompt', fakeAsync(() => {
        fixture.componentInstance.resultPrompts = [createTestDraftResultPrompt(NAMEADDRESS)];
        fixture.detectChanges();
        tick();
        expect(getFormValues()).toMatchInlineSnapshot(`
          {
            "minorcreditornameandaddressAddress1": "X",
            "minorcreditornameandaddressAddress2": "X",
            "minorcreditornameandaddressAddress3": "X",
            "minorcreditornameandaddressAddress4": "X",
            "minorcreditornameandaddressAddress5": "X",
            "minorcreditornameandaddressAddressType": "Person",
            "minorcreditornameandaddressEmailAddress1": "foo@bar.org",
            "minorcreditornameandaddressEmailAddress2": "foo@bar.org",
            "minorcreditornameandaddressFirstName": "*",
            "minorcreditornameandaddressLastName": "*",
            "minorcreditornameandaddressMiddleName": "*",
            "minorcreditornameandaddressPostCode": "CR0 1XN",
          }
        `);
      }));

      it('should not raise an error on an optional nameaddress until an input is populated', fakeAsync(() => {
        fixture.componentInstance.promptChoices = [{ ...NAMEADDRESS, required: false }];
        fixture.detectChanges();
        tick();
        submitForm();
        expect(fixture.componentInstance.handleErrors).toHaveBeenCalledWith(null);

        setFormValue('minorcreditornameandaddressAddress2', '29 Acacia Road');
        submitForm();
        expect(getFormErrors()).toMatchInlineSnapshot(`
          [
            {
              "controlRef": ElementRef {
                "nativeElement": <input
                  class="ng-untouched ng-pristine ng-valid govuk-input"
                  id="pdk-form-control-undefined-GENERATED_ID"
                  pdk-input=""
                  type="text"
                />,
              },
              "id": "pdk-form-error-undefined-GENERATED_ID",
              "message": "Minor creditor address line 1 – Enter this information",
              "shouldFocus": true,
            },
            {
              "controlRef": ElementRef {
                "nativeElement": <input
                  class="ng-untouched ng-pristine ng-valid govuk-input govuk-input--width-5"
                  id="pdk-form-control-undefined-GENERATED_ID"
                  pdk-input=""
                  type="text"
                />,
              },
              "id": "pdk-form-error-undefined-GENERATED_ID",
              "message": "Minor creditor post code – Enter a postcode",
              "shouldFocus": true,
            },
          ]
        `);
      }));

      it('should raise an error when a required input is absent', fakeAsync(() => {
        fixture.detectChanges();
        tick();
        submitForm();
        expect(getFormErrors()).toMatchInlineSnapshot(`
          [
            {
              "controlRef": {
                "nativeElement": {
                  "focus": [Function],
                },
              },
              "id": "pdk-form-error-undefined-GENERATED_ID",
              "message": "Is this an individual or an organisation? – Select an option",
              "shouldFocus": true,
            },
            {
              "controlRef": ElementRef {
                "nativeElement": <input
                  class="ng-untouched ng-pristine ng-valid govuk-input"
                  id="pdk-form-control-undefined-GENERATED_ID"
                  pdk-input=""
                  type="text"
                />,
              },
              "id": "pdk-form-error-undefined-GENERATED_ID",
              "message": "Minor creditor address line 1 – Enter this information",
              "shouldFocus": true,
            },
            {
              "controlRef": ElementRef {
                "nativeElement": <input
                  class="ng-untouched ng-pristine ng-valid govuk-input govuk-input--width-5"
                  id="pdk-form-control-undefined-GENERATED_ID"
                  pdk-input=""
                  type="text"
                />,
              },
              "id": "pdk-form-error-undefined-GENERATED_ID",
              "message": "Minor creditor post code – Enter a postcode",
              "shouldFocus": true,
            },
          ]
        `);

        const setFormValues = (promptRef: string, value: unknown) => {
          const ngForm = fixture.debugElement.query(By.directive(NgForm)).componentInstance.ngForm;
          ngForm.form.controls[promptRef].setValue(value);
          fixture.detectChanges();
          tick();
        };

        setFormValues('minorcreditornameandaddressAddressType', 'Person');
        submitForm();

        expect(getFormErrors()).toMatchInlineSnapshot(`
          [
            {
              "controlRef": ElementRef {
                "nativeElement": <input
                  aria-describedby="pdk-form-error-undefined-GENERATED_ID"
                  class="ng-untouched ng-pristine govuk-input ng-invalid govuk-input--error"
                  id="pdk-form-control-undefined-GENERATED_ID"
                  pdk-input=""
                  type="text"
                />,
              },
              "id": "pdk-form-error-undefined-GENERATED_ID",
              "message": "Minor creditor address line 1 – Enter this information",
              "shouldFocus": true,
            },
            {
              "controlRef": ElementRef {
                "nativeElement": <input
                  aria-describedby="pdk-form-error-undefined-GENERATED_ID"
                  class="ng-untouched ng-pristine govuk-input govuk-input--width-5 ng-invalid govuk-input--error"
                  id="pdk-form-control-undefined-GENERATED_ID"
                  pdk-input=""
                  type="text"
                />,
              },
              "id": "pdk-form-error-undefined-GENERATED_ID",
              "message": "Minor creditor post code – Enter a postcode",
              "shouldFocus": true,
            },
            {
              "controlRef": ElementRef {
                "nativeElement": <input
                  class="ng-untouched ng-pristine ng-valid govuk-input"
                  id="pdk-form-control-undefined-GENERATED_ID"
                  pdk-input=""
                  type="text"
                />,
              },
              "id": "pdk-form-error-undefined-GENERATED_ID",
              "message": "Minor creditor first name – Enter this information",
              "shouldFocus": true,
            },
            {
              "controlRef": ElementRef {
                "nativeElement": <input
                  class="ng-untouched ng-pristine ng-valid govuk-input"
                  id="pdk-form-control-undefined-GENERATED_ID"
                  pdk-input=""
                  type="text"
                />,
              },
              "id": "pdk-form-error-undefined-GENERATED_ID",
              "message": "Minor creditor last name – Enter this information",
              "shouldFocus": true,
            },
          ]
        `);
      }));

      it('should create a result prompt when valid', fakeAsync(() => {
        fixture.detectChanges();
        tick();
        setFormValue('minorcreditornameandaddressAddressType', 'Person');
        setFormValue('minorcreditornameandaddressFirstName', 'James');
        setFormValue('minorcreditornameandaddressLastName', 'Gray');
        setFormValue('minorcreditornameandaddressAddress1', '29 Acacia Road');
        setFormValue('minorcreditornameandaddressPostCode', 'CR0 1AX');
        submitForm();
        expect(getSubmittedResultPrompts()).toMatchInlineSnapshot(`
          [
            {
              "label": "Minor creditor",
              "promptId": "5707f766-b5b5-4747-9b15-542e7d170301",
              "promptRef": "minorcreditornameandaddress",
              "type": "NAMEADDRESS",
              "value": [
                {
                  "label": "Minor creditor first name",
                  "promptId": "5707f766-b5b5-4747-9b15-542e7d170301",
                  "promptRef": "minorcreditornameandaddressFirstName",
                  "type": "TXT",
                  "value": "James",
                },
                {
                  "label": "Minor creditor last name",
                  "promptId": "5707f766-b5b5-4747-9b15-542e7d170301",
                  "promptRef": "minorcreditornameandaddressLastName",
                  "type": "TXT",
                  "value": "Gray",
                },
                {
                  "label": "Minor creditor address line 1",
                  "promptId": "5707f766-b5b5-4747-9b15-542e7d170301",
                  "promptRef": "minorcreditornameandaddressAddress1",
                  "type": "TXT",
                  "value": "29 Acacia Road",
                },
                {
                  "label": "Minor creditor post code",
                  "promptId": "5707f766-b5b5-4747-9b15-542e7d170301",
                  "promptRef": "minorcreditornameandaddressPostCode",
                  "type": "TXT",
                  "value": "CR0 1AX",
                },
              ],
            },
          ]
        `);
      }));
    });

    describe('Both / Person with address lookup', () => {
      const FCOST = getParsedResultDefinitionByShortCode('FCOST');
      const NAMEADDRESS = {
        ...((FCOST.promptChoices[1] as OneOfPromptChoice).children[1] as NameAddressPromptChoice),
        isStructuredUnstructuredAddress: true
      };

      beforeEach(() => {
        fixture.componentInstance.promptChoices = [NAMEADDRESS];
      });

      it('should render the address lookup above the address fields', fakeAsync(() => {
        fixture.detectChanges();
        tick();
        expect(fixture.debugElement.query(By.css('cpp-address-autosuggest'))).not.toBeNull();
      }));

      it('should not render the address lookup when isStructuredUnstructuredAddress is not set', fakeAsync(() => {
        fixture.componentInstance.promptChoices = [
          { ...NAMEADDRESS, isStructuredUnstructuredAddress: false }
        ];
        fixture.detectChanges();
        tick();
        expect(fixture.debugElement.query(By.css('cpp-address-autosuggest'))).toBeNull();
      }));

      it('should populate the address fields when an address is selected', fakeAsync(() => {
        fixture.detectChanges();
        tick();
        selectAutosuggestAddress({
          line1: '29 Acacia Road',
          town: 'Bristol',
          postcode: 'BS1 1AA'
        });
        expect(getFormValues()).toMatchObject({
          minorcreditornameandaddressAddress1: '29 Acacia Road',
          minorcreditornameandaddressAddress3: 'Bristol',
          minorcreditornameandaddressPostCode: 'BS1 1AA'
        });
      }));

      it('should keep the same currentAddress object across repeated change detection cycles once a result is populated', fakeAsync(() => {
        // currentAddress feeds cpp-address-autosuggest's [ngModel]. A getter that
        // built a new object on every read would look "changed" to Angular on
        // every check once the result has real address data, re-triggering
        // cpp-address's real OS Places verification call in a tight loop.
        fixture.componentInstance.resultPrompts = [createTestDraftResultPrompt(NAMEADDRESS)];
        fixture.detectChanges();
        tick();
        const component = fixture.debugElement.query(By.css('cpp-nameaddress-prompt-choice'))
          .componentInstance as { currentAddress: unknown };
        const first = component.currentAddress;

        fixture.detectChanges();
        tick();
        fixture.detectChanges();
        tick();

        expect(component.currentAddress).toBe(first);
      }));
    });

    describe('Organisation', () => {
      const NAMEADDRESS = {
        ...getPromptChoiceForType('NAMEADDRESS'),
        required: true
      };

      beforeEach(() => {
        fixture.componentInstance.promptChoices = [NAMEADDRESS];
      });

      it('should render the name/address inputs', fakeAsync(() => {
        fixture.detectChanges();
        tick();
        expect(fixture).toMatchSnapshot();
      }));

      it('should prepopulate the input using an organisation result prompt', fakeAsync(() => {
        fixture.componentInstance.resultPrompts = [createTestDraftResultPrompt(NAMEADDRESS)];
        fixture.detectChanges();
        tick();

        expect(fixture).toMatchSnapshot();
        expect(getFormValues()).toMatchInlineSnapshot(`
          {
            "prisonAddress1": "X",
            "prisonAddress2": "X",
            "prisonAddress3": "X",
            "prisonAddress4": "X",
            "prisonAddress5": "X",
            "prisonEmailAddress1": "foo@bar.org",
            "prisonEmailAddress2": "foo@bar.org",
            "prisonOrganisationName": "*",
            "prisonPostCode": "CR0 1XN",
          }
        `);
      }));

      it('should raise an error when a required input is absent', fakeAsync(() => {
        fixture.detectChanges();
        tick();
        submitForm();
        expect(getFormErrors()).toMatchInlineSnapshot(`
          [
            {
              "controlRef": ElementRef {
                "nativeElement": <input
                  class="ng-untouched ng-pristine ng-valid govuk-input"
                  id="pdk-form-control-undefined-GENERATED_ID"
                  pdk-input=""
                  type="text"
                />,
              },
              "id": "pdk-form-error-undefined-GENERATED_ID",
              "message": "Prison email address 1 – Enter an email address",
              "shouldFocus": true,
            },
          ]
        `);
      }));

      it('should create a result prompt when valid', fakeAsync(() => {
        fixture.detectChanges();
        tick();
        setFormValue('prisonEmailAddress1', 'foo@bar.com');
        setFormValue('prisonOrganisationName', 'HMCTS');
        submitForm();
        expect(getSubmittedResultPrompts()).toMatchInlineSnapshot(`
          [
            {
              "label": "Prison",
              "promptId": "2d6330a2-1f12-45fb-bb72-65f4c1215e9c",
              "promptRef": "prison",
              "type": "NAMEADDRESS",
              "value": [
                {
                  "label": "Prison organisation name",
                  "promptId": "2d6330a2-1f12-45fb-bb72-65f4c1215e9c",
                  "promptRef": "prisonOrganisationName",
                  "type": "TXT",
                  "value": "HMCTS",
                },
                {
                  "label": "Prison email address 1",
                  "promptId": "2d6330a2-1f12-45fb-bb72-65f4c1215e9c",
                  "promptRef": "prisonEmailAddress1",
                  "type": "TXT",
                  "value": "foo@bar.com",
                },
              ],
            },
          ]
        `);
      }));
    });

    describe('Organisation as Prosecution to be notified', () => {
      const STDEC = getParsedResultDefinitionByShortCode('STDEC');
      const NAMEADDRESS = STDEC.promptChoices.find(
        promptChoice => promptChoice.promptRef === 'prosecutortobenotified'
      );
      beforeEach(() => {
        fixture.componentInstance.promptChoices = [NAMEADDRESS];
      });

      it('should render the prosecution to be notified name/address inputs', fakeAsync(() => {
        fixture.detectChanges();
        tick();
        expect(fixture).toMatchSnapshot();
      }));

      it('should prepopulate the input using an organisation results prompt over prosecutor to be notified', fakeAsync(() => {
        const mockResultsPrompt: DraftResultPrompt[] = [
          {
            label: 'Prosecutor to be notified',
            promptId: '0a7dd6aa-f7cc-43d7-ba03-c9621f3e4471',
            promptRef: 'prosecutortobenotified',
            type: 'NAMEADDRESS',
            value: [
              {
                label: 'Prosecutor to be notified organisation name',
                promptId: '0a7dd6aa-f7cc-43d7-ba03-c9621f3e4471',
                promptRef: 'prosecutortobenotifiedOrganisationName',
                type: 'TXT',
                value: 'Test Org'
              },
              {
                label: 'Prosecutor to be notified address line 1',
                promptId: '0a7dd6aa-f7cc-43d7-ba03-c9621f3e4471',
                promptRef: 'prosecutortobenotifiedAddress1',
                type: 'TXT',
                value: 'Test Address1'
              },
              {
                label: 'Prosecutor to be notified address line 2',
                promptId: '0a7dd6aa-f7cc-43d7-ba03-c9621f3e4471',
                promptRef: 'prosecutortobenotifiedAddress2',
                type: 'TXT',
                value: 'Test Address2'
              },
              {
                label: 'Prosecutor to be notified post code',
                promptId: '0a7dd6aa-f7cc-43d7-ba03-c9621f3e4471',
                promptRef: 'prosecutortobenotifiedPostCode',
                type: 'TXT',
                value: 'RG1 3ES'
              }
            ]
          }
        ];

        const mockReuseableResults: PromptEntry[] = [
          {
            type: 'NAMEADDRESS',
            cacheDataPath:
              'respondents[0].prosecutingAuthority.name; applicant.prosecutingAuthority.name',
            cacheable: 2,
            applicationId: '256624f5-b70e-4211-8907-085a1a3e08d6',
            promptRef: 'prosecutortobenotified',
            value: {
              prosecutortobenotifiedOrganisationName: 'Derbyshire Police',
              prosecutortobenotifiedAddress1: 'Criminal Justice Department',
              prosecutortobenotifiedAddress2: 'Derbyshire Constabulary',
              prosecutortobenotifiedAddress3: 'Butterley Hall',
              prosecutortobenotifiedAddress4: 'Ripley',
              prosecutortobenotifiedAddress5: 'Derby',
              prosecutortobenotifiedPostCode: 'DE5 3RS',
              prosecutortobenotifiedEmailAddress1: 'criminaldataderbyshire@derbyshire.police.uk',
              prosecutortobenotifiedEmailAddress2: 'criminaldataderbyshire@derbyshire.police.uk'
            }
          }
        ];
        fixture.componentInstance.resultPrompts = mockResultsPrompt;
        fixture.componentInstance.prosecutorToBeNotified = mockReuseableResults;
        fixture.componentInstance.hasHmctsOrganisation = true;
        fixture.componentInstance.shortCode = 'stdec';
        fixture.detectChanges();
        tick();
        expect(fixture).toMatchSnapshot();
        expect(getFormValues()).toStrictEqual({
          prosecutortobenotifiedOrganisationName: 'Test Org',
          prosecutortobenotifiedAddress1: 'Test Address1',
          prosecutortobenotifiedAddress2: 'Test Address2',
          prosecutortobenotifiedAddress3: null,
          prosecutortobenotifiedAddress4: null,
          prosecutortobenotifiedAddress5: null,
          prosecutortobenotifiedPostCode: 'RG1 3ES',
          prosecutortobenotifiedEmailAddress1: null,
          prosecutortobenotifiedEmailAddress2: null
        });
      }));

      it('should prepopulate the input using an organisation reusable prompt', fakeAsync(() => {
        const mockReuseableResults: PromptEntry[] = [
          {
            type: 'NAMEADDRESS',
            cacheDataPath:
              'respondents[0].prosecutingAuthority.name; applicant.prosecutingAuthority.name',
            cacheable: 2,
            applicationId: '256624f5-b70e-4211-8907-085a1a3e08d6',
            promptRef: 'prosecutortobenotified',
            value: {
              prosecutortobenotifiedOrganisationName: 'Derbyshire Police',
              prosecutortobenotifiedAddress1: 'Criminal Justice Department',
              prosecutortobenotifiedAddress2: 'Derbyshire Constabulary',
              prosecutortobenotifiedAddress3: 'Butterley Hall',
              prosecutortobenotifiedAddress4: 'Ripley',
              prosecutortobenotifiedAddress5: 'Derby',
              prosecutortobenotifiedPostCode: 'DE5 3RS',
              prosecutortobenotifiedEmailAddress1: 'criminaldataderbyshire@derbyshire.police.uk',
              prosecutortobenotifiedEmailAddress2: 'criminaldataderbyshire@derbyshire.police.uk'
            }
          }
        ];
        fixture.componentInstance.prosecutorToBeNotified = mockReuseableResults;
        fixture.componentInstance.hasHmctsOrganisation = true;
        fixture.componentInstance.shortCode = 'stdec';
        fixture.detectChanges();
        tick();
        expect(fixture).toMatchSnapshot();
        expect(getFormValues()).toStrictEqual({
          prosecutortobenotifiedOrganisationName: 'Derbyshire Police',
          prosecutortobenotifiedAddress1: 'Criminal Justice Department',
          prosecutortobenotifiedAddress2: 'Derbyshire Constabulary',
          prosecutortobenotifiedAddress3: 'Butterley Hall',
          prosecutortobenotifiedAddress4: 'Ripley',
          prosecutortobenotifiedAddress5: 'Derby',
          prosecutortobenotifiedPostCode: 'DE5 3RS',
          prosecutortobenotifiedEmailAddress1: 'criminaldataderbyshire@derbyshire.police.uk',
          prosecutortobenotifiedEmailAddress2: 'criminaldataderbyshire@derbyshire.police.uk'
        });
      }));
    });
  });

  describe('INT prompt', () => {
    const INT = {
      ...getPromptChoiceForType('INT'),
      required: true,
      minValue: '0',
      maxValue: '999'
    };

    beforeEach(() => {
      fixture.componentInstance.promptChoices = [INT];
    });

    it('should render an integer input', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(fixture).toMatchSnapshot();
    }));

    it('should prepopulate the input using a result prompt', fakeAsync(() => {
      fixture.componentInstance.resultPrompts = [createTestDraftResultPrompt(INT)];
      fixture.detectChanges();
      tick();
      expect(getFormValues()).toMatchInlineSnapshot(`
        {
          "numberOfDaysInCustodyInForeignJurisdictionToCount": 50,
        }
      `);
    }));

    it('should raise an error when the input is absent', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      submitForm();
      expect(getFormErrors()).toMatchInlineSnapshot(`
        [
          {
            "controlRef": ElementRef {
              "nativeElement": <input
                class="ng-untouched ng-pristine ng-valid govuk-input govuk-input--width-10"
                id="pdk-form-control-undefined-GENERATED_ID"
                pdk-text-input="number"
                type="text"
              />,
            },
            "id": "pdk-form-error-undefined-GENERATED_ID",
            "message": "Number of days in custody in foreign jurisdiction to count – Enter a number",
            "shouldFocus": true,
          },
        ]
      `);
    }));

    it('should raise an error when the input is greater than maxValue', fakeAsync(() => {
      fixture.componentInstance.resultPrompts = [
        { ...createTestDraftResultPrompt(INT), value: 1000 }
      ];
      fixture.detectChanges();
      tick();
      submitForm();
      expect(fixture.componentInstance.handleErrors).toHaveBeenCalledWith([
        {
          id: 'pdk-form-error-undefined-GENERATED_ID',
          controlRef: expect.objectContaining({
            nativeElement: expect.any(HTMLInputElement)
          }),
          message:
            'Number of days in custody in foreign jurisdiction to count – Enter a value that is not greater than 999',
          shouldFocus: true
        }
      ]);
    }));

    it('should raise an error when the input is lower than minValue', fakeAsync(() => {
      fixture.componentInstance.promptChoices = [{ ...INT, minValue: '1' }];
      fixture.componentInstance.resultPrompts = [{ ...createTestDraftResultPrompt(INT), value: 0 }];
      fixture.detectChanges();
      tick();
      submitForm();
      expect(fixture.componentInstance.handleErrors).toHaveBeenCalledWith([
        {
          id: 'pdk-form-error-undefined-GENERATED_ID',
          controlRef: expect.objectContaining({
            nativeElement: expect.any(HTMLInputElement)
          }),
          message:
            'Number of days in custody in foreign jurisdiction to count – Enter a value that is greater than or equal to 1',
          shouldFocus: true
        }
      ]);
    }));

    it('should create a result prompt when valid', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      setFormValue('numberOfDaysInCustodyInForeignJurisdictionToCount', 1);
      submitForm();
      expect(fixture.componentInstance.handleFormSubmit).toHaveBeenCalledWith([
        {
          label: 'Number of days in custody in foreign jurisdiction to count',
          promptId: 'cc398d5e-6a52-416d-8081-af8a5adf24f9',
          promptRef: 'numberOfDaysInCustodyInForeignJurisdictionToCount',
          type: 'INT',
          value: '1'
        }
      ]);
    }));
  });

  describe('INTC prompt', () => {
    const INTC = {
      ...getPromptChoiceForType('INTC')
    };

    beforeEach(() => {
      fixture.componentInstance.promptChoices = [INTC];
    });

    it('should render an integer input', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(fixture).toMatchSnapshot();
    }));

    it('should raise an error when the input is absent', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      submitForm();
      expect(fixture.componentInstance.handleErrors).toHaveBeenCalledWith([
        {
          id: 'pdk-form-error-undefined-GENERATED_ID',
          controlRef: expect.objectContaining({
            nativeElement: expect.any(HTMLInputElement)
          }),
          message: 'Original court code – Enter a number',
          shouldFocus: true
        }
      ]);
    }));

    it('should raise an error when the inputs length is greater than maxLength', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      setFormValue('originalCourtCode', 12345);
      submitForm();
      expect(fixture.componentInstance.handleErrors).toHaveBeenCalledWith([
        {
          id: 'pdk-form-error-undefined-GENERATED_ID',
          controlRef: expect.objectContaining({
            nativeElement: expect.any(HTMLInputElement)
          }),
          message: 'Original court code – Enter a value that is less than 4 characters',
          shouldFocus: true
        }
      ]);
    }));

    it('should raise an error when the inputs length is lower than minLength', fakeAsync(() => {
      fixture.componentInstance.promptChoices = [{ ...INTC, minLength: '2' }];
      fixture.detectChanges();
      tick();
      setFormValue('originalCourtCode', 9);
      submitForm();
      expect(fixture.componentInstance.handleErrors).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'pdk-form-error-undefined-GENERATED_ID',
          controlRef: expect.objectContaining({
            nativeElement: expect.any(HTMLInputElement)
          }),
          message: 'Original court code – Enter a value that is greater than 2 characters',
          shouldFocus: true
        })
      ]);
    }));

    it('should create a result prompt when valid', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      setFormValue('originalCourtCode', 1234);
      submitForm();
      expect(fixture.componentInstance.handleFormSubmit).toHaveBeenCalledWith([
        {
          label: 'Original court code',
          promptId: 'b49bf4fa-0b1e-4079-b85a-c0113a46b91b',
          promptRef: 'originalCourtCode',
          type: 'INTC',
          value: '1234'
        }
      ]);
    }));
  });

  describe('DURATION prompt with INTM sub-component (CDDQ/CDDQS scenario)', () => {
    // The backend sends an INTM prompt choice with the same promptRef as a DURATION
    // prompt choice. The INTM is an internal sub-component of DURATION — the DURATION
    // form control captures its value. The INTM must not be rendered as a standalone
    // control and must not produce its own result prompt on submit.
    const DURATION = { ...getPromptChoiceForType('DURATION'), required: true };
    // Construct a mock INTM prompt that shares the DURATION's promptRef
    const INTM_sub = {
      type: 'INTM' as const,
      promptRef: DURATION.promptRef,
      required: true,
      code: 'intm-sub-code',
      label: 'Disqualification period (INTM)',
      hidden: false,
      promptOrder: DURATION.promptOrder + 1,
      nameAddressList: []
    } as unknown as PromptChoice;

    beforeEach(() => {
      fixture.componentInstance.promptChoices = [DURATION, INTM_sub];
    });

    it('should not render a separate form control for the INTM prompt', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      const ngForm = fixture.debugElement.query(By.directive(NgForm)).componentInstance.ngForm;
      const controlKeys = Object.keys(ngForm.controls);
      // Only the DURATION control should exist; no duplicate for the same promptRef
      expect(controlKeys.filter(k => k === DURATION.promptRef).length).toBe(1);
    }));

    it('should submit only the DURATION result prompt (no INTM result prompt)', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      setFormValue(DURATION.promptRef, [{ label: 'Days', value: 30, type: 'INT' }]);
      submitForm();
      const submitted: DraftResultPrompt[] =
        fixture.componentInstance.handleFormSubmit.mock.calls[0][0];
      expect(submitted.some(p => p.type === 'INTM')).toBe(false);
      expect(submitted.find(p => p.type === 'DURATION')).toMatchObject({
        promptRef: DURATION.promptRef,
        type: 'DURATION',
        value: [{ label: 'Days', value: 30, type: 'INT' }]
      });
    }));

    it('should still render other required prompts alongside DURATION', fakeAsync(() => {
      const TXT = { ...getPromptChoiceForType('TXT'), required: false };
      fixture.componentInstance.promptChoices = [DURATION, INTM_sub, TXT];
      fixture.detectChanges();
      tick();
      const ngForm = fixture.debugElement.query(By.directive(NgForm)).componentInstance.ngForm;
      const controlKeys = Object.keys(ngForm.controls);
      expect(controlKeys).toContain(DURATION.promptRef);
      expect(controlKeys).toContain(TXT.promptRef);
      // INTM should not add a second control for the same promptRef
      expect(controlKeys.filter(k => k === DURATION.promptRef).length).toBe(1);
    }));
  });

  describe('ONEOF prompt', () => {
    const ONEOF = { ...getPromptChoiceForType('ONEOF'), required: true } as OneOfPromptChoice;
    const booleanResultPrompt = createDraftResultPrompt(
      ONEOF,
      createTestDraftResultPrompt(ONEOF.children[0])
    );
    const otherResultPrompt = createDraftResultPrompt(
      ONEOF,
      createTestDraftResultPrompt(ONEOF.children[1])
    );

    beforeEach(() => {
      fixture.componentInstance.promptChoices = [ONEOF];
    });

    it('should render a oneOf input', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(fixture).toMatchSnapshot();
    }));

    it('should prepopulate the input using a result prompt with a boolean choice', fakeAsync(() => {
      fixture.componentInstance.resultPrompts = [booleanResultPrompt];
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      tick();
      expect(fixture).toMatchSnapshot();
      expect(getFormValues()).toMatchInlineSnapshot(`
        {
          "totalCustodialPeriodChildIndex": 0,
          "totalCustodialPeriodIsLife": true,
        }
      `);
    }));

    it('should prepopulate the input using a result prompt with a non-boolean choice', fakeAsync(() => {
      fixture.componentInstance.resultPrompts = [otherResultPrompt];
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      tick();
      expect(fixture).toMatchSnapshot();
      expect(getFormValues()).toMatchInlineSnapshot(`
        {
          "totalCustodialPeriod": [
            {
              "label": "Minutes",
              "type": "INT",
              "value": 60,
            },
          ],
          "totalCustodialPeriodChildIndex": 1,
        }
      `);
    }));

    it('should raise an error when the input is absent', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      submitForm();
      expect(getFormErrors()).toMatchInlineSnapshot(`
        [
          {
            "controlRef": {
              "nativeElement": {
                "focus": [Function],
              },
            },
            "id": "pdk-form-error-undefined-GENERATED_ID",
            "message": "Total custodial period – Select an option",
            "shouldFocus": true,
          },
        ]
      `);
    }));

    it('should create a boolean result prompt when valid', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      setFormValue('totalCustodialPeriodChildIndex', 0);
      submitForm();
      expect(getSubmittedResultPrompts()).toMatchInlineSnapshot(`
        [
          {
            "label": "Total custodial period",
            "promptId": "b2cf5a1e-8539-45a1-a287-4be5094a0e73",
            "promptRef": "totalCustodialPeriod",
            "type": "ONEOF",
            "value": {
              "label": "Total custodial period is life",
              "promptId": "9dbe839c-3804-4c47-bf9e-5be6f9b9b3bb",
              "promptRef": "totalCustodialPeriodIsLife",
              "type": "BOOLEAN",
              "value": true,
            },
          },
        ]
      `);
    }));

    it('should create a non-boolean result prompt when valid', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      setFormValue('totalCustodialPeriodChildIndex', 1);
      setFormValue('totalCustodialPeriod', [{ label: 'MINUTES', type: 'INT', value: 60 }]);
      submitForm();
      expect(getSubmittedResultPrompts()).toMatchInlineSnapshot(`
        [
          {
            "label": "Total custodial period",
            "promptId": "b2cf5a1e-8539-45a1-a287-4be5094a0e73",
            "promptRef": "totalCustodialPeriod",
            "type": "ONEOF",
            "value": {
              "label": "Total custodial period",
              "promptId": "b2cf5a1e-8539-45a1-a287-4be5094a0e73",
              "promptRef": "totalCustodialPeriod",
              "type": "DURATION",
              "value": [
                {
                  "label": "MINUTES",
                  "type": "INT",
                  "value": 60,
                },
              ],
            },
          },
        ]
      `);
    }));

    it('should create result prompt from reusable info', fakeAsync(() => {
      const reusableInfoService = TestBed.inject(ReusableInfoService);
      (reusableInfoService.getValueForPromptChoice as jest.Mock).mockReturnValue(
        of({
          type: 'DURATION',
          promptRef: 'totalCustodialPeriod',
          value: [{ label: 'Weeks', type: 'INT', value: 60 }]
        })
      );
      fixture.detectChanges();
      tick();
      setFormValue('totalCustodialPeriodChildIndex', 1);
      submitForm();
      expect(getSubmittedResultPrompts()).toMatchInlineSnapshot(`
        [
          {
            "label": "Total custodial period",
            "promptId": "b2cf5a1e-8539-45a1-a287-4be5094a0e73",
            "promptRef": "totalCustodialPeriod",
            "type": "ONEOF",
            "value": {
              "label": "Total custodial period",
              "promptId": "b2cf5a1e-8539-45a1-a287-4be5094a0e73",
              "promptRef": "totalCustodialPeriod",
              "type": "DURATION",
              "value": [
                {
                  "label": "Weeks",
                  "type": "INT",
                  "value": 60,
                },
              ],
            },
          },
        ]
      `);
      expect(reusableInfoService.getValueForPromptChoice).toHaveBeenCalledWith(ONEOF.children[1], {
        applicationId: 'applicationId',
        hearingId: 'hearingId',
        orderedDate: '2021-01-01'
      });
    }));
  });

  describe('TIME prompt', () => {
    const TIME = {
      ...getPromptChoiceForType('TIME'),
      required: true
    };

    beforeEach(() => {
      fixture.componentInstance.promptChoices = [TIME];
    });

    it('should render a time input', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(fixture).toMatchSnapshot();
    }));

    it('should prepopulate the input using a result prompt', fakeAsync(() => {
      fixture.componentInstance.resultPrompts = [createTestDraftResultPrompt(TIME)];
      fixture.detectChanges();
      tick();
      expect(getFormValues()).toMatchInlineSnapshot(`
        {
          "timeDefendantMustAttendAtThePoliceStation": "10:00",
        }
      `);
    }));

    it('should raise an error when the input is absent', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      submitForm();
      expect(getFormErrors()).toMatchInlineSnapshot(`
        [
          {
            "controlRef": ElementRef {
              "nativeElement": <input
                autocomplete="off"
                class="ng-untouched ng-pristine ng-valid govuk-input govuk-input--width-2"
                formcontrolname="hours"
                id="pdk-time-input-GENERATED_ID-hours"
                maxlength="2"
                name="timeHours"
                pattern="[0-9]*"
                type="text"
              />,
            },
            "id": "pdk-form-error-undefined-GENERATED_ID",
            "message": "Time defendant must attend at the police station – Enter a time, for example 14 45",
            "shouldFocus": true,
          },
        ]
      `);
    }));

    it('should create a result prompt when valid', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      setFormValue('timeDefendantMustAttendAtThePoliceStation', '10:00');
      submitForm();
      expect(getSubmittedResultPrompts()).toMatchInlineSnapshot(`
        [
          {
            "label": "Time defendant must attend at the police station",
            "promptId": "64dd104d-6205-41f4-982f-247e5577e0dd",
            "promptRef": "timeDefendantMustAttendAtThePoliceStation",
            "type": "TIME",
            "value": "10:00",
          },
        ]
      `);
    }));
  });

  describe('TXT prompt', () => {
    const TXT = {
      ...getPromptChoiceForType('TXT'),
      minLength: '1',
      maxLength: '99',
      required: true
    } as TextPromptChoice;

    beforeEach(() => {
      fixture.componentInstance.promptChoices = [TXT];
    });

    it('should render a text input', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(fixture).toMatchSnapshot();
    }));

    it('should render a textarea input for longer inputs', fakeAsync(() => {
      fixture.componentInstance.promptChoices = [{ ...TXT, maxLength: '100' }];
      fixture.detectChanges();
      tick();
      expect(fixture).toMatchSnapshot();
    }));

    it('should prepopulate the input using a result prompt', fakeAsync(() => {
      fixture.componentInstance.resultPrompts = [createTestDraftResultPrompt(TXT)];
      fixture.detectChanges();
      tick();
      expect(getFormValues()).toMatchInlineSnapshot(`
        {
          "consecutiveToOffenceNumber": "*",
        }
      `);
    }));

    it('should raise an error when the input is absent', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      submitForm();
      expect(getFormErrors()).toMatchInlineSnapshot(`
        [
          {
            "controlRef": ElementRef {
              "nativeElement": <input
                class="ng-untouched ng-pristine ng-valid govuk-input"
                pdk-input=""
                pdk-text-input=""
              />,
            },
            "id": "pdk-form-error-undefined-GENERATED_ID",
            "message": "Consecutive to offence – Enter this information",
            "shouldFocus": true,
          },
        ]
      `);
    }));

    it('should create a result prompt when valid', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      setFormValue('consecutiveToOffenceNumber', '*');
      submitForm();
      expect(getSubmittedResultPrompts()).toMatchInlineSnapshot(`
        [
          {
            "label": "Consecutive to offence",
            "promptId": "7784b81d-44d2-43c0-a903-a53b0e73683b",
            "promptRef": "consecutiveToOffenceNumber",
            "type": "TXT",
            "value": "*",
          },
        ]
      `);
    }));
  });

  describe('TXT prompt with address lookup', () => {
    const TXT_WITH_LOOKUP = {
      ...getPromptChoiceForType('TXT'),
      minLength: '1',
      maxLength: '99',
      required: true,
      isStructuredUnstructuredAddress: true
    } as TextPromptChoice;

    beforeEach(() => {
      fixture.componentInstance.promptChoices = [TXT_WITH_LOOKUP];
    });

    it('should render the address lookup above the text box', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(fixture.debugElement.query(By.css('cpp-address-autosuggest'))).not.toBeNull();
    }));

    it('should not render the address lookup when isStructuredUnstructuredAddress is not set', fakeAsync(() => {
      fixture.componentInstance.promptChoices = [
        { ...TXT_WITH_LOOKUP, isStructuredUnstructuredAddress: false }
      ];
      fixture.detectChanges();
      tick();
      expect(fixture.debugElement.query(By.css('cpp-address-autosuggest'))).toBeNull();
    }));

    it('should insert the selected address as a single comma-separated line in the text box', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      selectAutosuggestAddress({
        line1: '29 Acacia Road',
        town: 'Bristol',
        postcode: 'BS1 1AA'
      });
      expect(getFormValues()).toMatchObject({
        consecutiveToOffenceNumber: '29 Acacia Road, Bristol, BS1 1AA'
      });
    }));

    it('should still allow the inserted text to be edited manually', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      selectAutosuggestAddress({
        line1: '29 Acacia Road',
        town: 'Bristol',
        postcode: 'BS1 1AA'
      });
      const ngForm = fixture.debugElement.query(By.directive(NgForm)).componentInstance.ngForm;

      ngForm.controls['consecutiveToOffenceNumber'].setValue(
        '29 Acacia Road, Bristol, BS1 1AA (flat 2)'
      );
      fixture.detectChanges();
      tick();
      submitForm();
      expect(getSubmittedResultPrompts()).toMatchObject([
        {
          promptRef: 'consecutiveToOffenceNumber',
          value: '29 Acacia Road, Bristol, BS1 1AA (flat 2)'
        }
      ]);
    }));
  });
});

@Component({
  template: `
    <cpp-result-prompts-form
      [promptChoices]="promptChoices"
      [resultPrompts]="resultPrompts"
      [hasHmctsOrganisation]="hasHmctsOrganisation"
      [prosecutorToBeNotified]="prosecutorToBeNotified"
      [shortCode]="shortCode"
      [isExParteCase]="isExParteCase"
      (formSubmit)="handleFormSubmit($event)"
      (errors)="handleErrors($event)"
    ></cpp-result-prompts-form>
  `,
  imports: [ResultPromptsFormComponent]
})
class ResultPromptFormTestComponent {
  promptChoices: PromptChoice[] = [];
  resultPrompts: DraftResultPrompt[];
  shortCode?: string;
  hasHmctsOrganisation?: boolean;
  prosecutorToBeNotified?: PromptEntry[];
  isExParteCase?: boolean;
  handleFormSubmit = jest.fn();
  handleErrors = jest.fn();
}
