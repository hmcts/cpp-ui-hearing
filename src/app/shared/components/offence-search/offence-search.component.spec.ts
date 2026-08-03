import { Component } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { PdkFormFieldComponent } from '@cpp/pdk';

import { OffenceSearchComponent } from './offence-search.component';
import { ReferenceDataOffenceService } from '../../../core';
import { CommonModule } from '@angular/common';

describe('OffenceSearchComponent', () => {
  let fixture: ComponentFixture<TestOffenceSearchComponent>;
  let searchOffenceTypes: jest.Mock;
  let search: OffenceSearchComponent;

  beforeEach(() => {
    searchOffenceTypes = jest.fn();

    TestBed.configureTestingModule({
      imports: [TestOffenceSearchComponent],
      providers: [
        provideRouter([]),
        {
          provide: ReferenceDataOffenceService,
          useValue: {
            searchOffenceTypes
          }
        }
      ],
      teardown: { destroyAfterEach: false }
    });

    fixture = TestBed.createComponent(TestOffenceSearchComponent);
    fixture.detectChanges();
    search = fixture.debugElement.query(By.directive(OffenceSearchComponent)).componentInstance;
  });

  const offences = [
    {
      offenceId: '*',
      title: 'Offence title',
      cjsOffenceCode: 'CTO101',
      legislation: 'Bondi Beach'
    }
  ];

  it('should compile correctly', () => {
    searchOffenceTypes.mockReturnValue(of(offences));
    expect(fixture).toMatchSnapshot();
  });

  it('should select a charge', () => {
    search.propagateChange(offences[0]);
    fixture.detectChanges();

    const form = fixture.debugElement.children[0].injector.get(NgForm);

    expect(form.value).toEqual({
      offence: {
        cjsOffenceCode: 'CTO101',
        legislation: 'Bondi Beach',
        offenceId: '*',
        title: 'Offence title'
      }
    });
    expect(fixture).toMatchSnapshot();
  });

  it('should return white color for text if highlighted is true', () => {
    const actualColor = search.getTitleTextColour(true);
    expect(actualColor).toEqual('white');
  });

  it('should return black color for text if highlighted is false', () => {
    const actualColor = search.getTitleTextColour(false);
    expect(actualColor).toEqual('black');
  });

  describe('search', () => {
    let onResult: jest.Mock;

    beforeEach(() => {
      onResult = jest.fn();

      search.source$.subscribe(onResult);
    });

    it('should search once at least 3 characters are entered', () => {
      searchOffenceTypes.mockReturnValue(of(offences));
      search.input$.next('as');
      expect(onResult).not.toHaveBeenCalled();
      search.input$.next('ass');
      expect(searchOffenceTypes).toHaveBeenCalledWith('ass', 10, '');
      expect(onResult).toHaveBeenCalledWith([
        {
          id: offences[0].offenceId,
          label: '',
          offence: offences[0]
        }
      ]);
    });

    it('should show no results message no offences found', () => {
      search.noResult = true;
      fixture.detectChanges();

      expect(fixture).toMatchSnapshot();
    });

    it('should set noResult to true when no offences returned', () => {
      searchOffenceTypes.mockReturnValue(of([]));
      search.input$.next('xyz');
      expect(search.noResult).toBe(true);
    });

    it('should set noResult to false when offences are found', () => {
      searchOffenceTypes.mockReturnValue(of(offences));
      search.noResult = true;
      search.input$.next('assault');
      expect(search.noResult).toBe(false);
    });

    it('should clear source when input value is empty', () => {
      const nextSpy = jest.spyOn(search.source$, 'next');
      search.inputValue = '';
      expect(nextSpy).toHaveBeenCalledWith([]);
    });
  });

  describe('Component methods', () => {
    it('should get key from offence suggestion', () => {
      const suggestion = { label: '', offence: offences[0], id: '*' };
      expect(search.getKey(suggestion)).toBe('*');
    });

    it('should return undefined for suggestion without offence', () => {
      const suggestion = { label: '', offence: null, id: '' } as any;
      expect(search.getKey(suggestion)).toBeUndefined();
    });

    it('should get label from suggestion', () => {
      const suggestion = { label: 'test label', offence: offences[0], id: '*' };
      expect(search.getLabel(suggestion)).toBe('test label');
    });

    it('should return white text colour when highlighted', () => {
      expect(search.getTitleTextColour(true)).toBe('white');
    });

    it('should return black text colour when not highlighted', () => {
      expect(search.getTitleTextColour(false)).toBe('black');
    });

    it('should get matched title with highlighting', () => {
      search.inputValue = 'Offence';
      const result = search.getMatchedTitle(offences[0], 'title');
      expect(result).toContain('<b>');
      expect(result).toContain('Offence');
    });

    it('should return plain title when no match', () => {
      search.inputValue = 'xyz';
      const result = search.getMatchedTitle(offences[0], 'title');
      expect(result).toBe('Offence title');
    });

    it('should return empty string for invalid key', () => {
      const result = search.getMatchedTitle(offences[0], 'invalidKey' as any);
      expect(result).toBe('');
    });

    it('should return title when inputValue is empty', () => {
      search.inputValue = '';
      const result = search.getMatchedTitle(offences[0], 'title');
      expect(result).toBe('Offence title');
    });

    it('should handle ngOnInit with selectedOffenceCode', done => {
      const fixtureWithCode = TestBed.createComponent(TestOffenceSearchWithCodeComponent);
      fixtureWithCode.detectChanges();
      const searchWithCode = fixtureWithCode.debugElement.query(
        By.directive(OffenceSearchComponent)
      ).componentInstance;

      searchOffenceTypes.mockReturnValue(of(offences));

      setTimeout(() => {
        expect(searchWithCode.selected).toEqual(offences[0]);
        done();
      }, 10);
    });

    it('should register onChange and propagate selected offence', () => {
      const mockFn = jest.fn();
      let onChangeCallback: (value: unknown) => void;
      search.autoSuggest.registerOnChange = jest.fn(fn => {
        onChangeCallback = fn;
      });

      search.registerOnChange(mockFn);

      expect(search.autoSuggest.registerOnChange).toHaveBeenCalled();

      const suggestion = { label: '', offence: offences[0], id: '*' };
      onChangeCallback!(suggestion);

      expect(search.selected).toEqual(offences[0]);
      expect(mockFn).toHaveBeenCalledWith(offences[0]);
    });

    it('should have ngControl getter', () => {
      expect(search.ngControl).toBeDefined();
    });

    it('should call registerOnTouched', () => {
      const mockFn = jest.fn();
      expect(() => search.registerOnTouched(mockFn)).not.toThrow();
    });

    it('should call writeValue', () => {
      expect(() => search.writeValue()).not.toThrow();
    });

    it('should write value to autosuggest component', () => {
      const mockWriteValue = jest.fn();
      search.autoSuggest.writeValue = mockWriteValue;

      search.writeValue(offences[0]);

      expect(search.selected).toEqual(offences[0]);
      expect(mockWriteValue).toHaveBeenCalledWith({
        label: '',
        offence: offences[0],
        id: offences[0].offenceId
      });
    });

    it('should clear value when writeValue is called with null', () => {
      const mockWriteValue = jest.fn();
      search.autoSuggest.writeValue = mockWriteValue;

      search.writeValue(offences[0]);
      expect(search.selected).toEqual(offences[0]);
      expect(mockWriteValue).toHaveBeenCalledTimes(1);

      mockWriteValue.mockClear();

      search.writeValue(null);

      expect(search.selected).toBeNull();
      expect(mockWriteValue).toHaveBeenCalledWith(null);
    });

    it('should not update if writeValue is called with same value', () => {
      const mockWriteValue = jest.fn();
      search.autoSuggest.writeValue = mockWriteValue;

      search.writeValue(offences[0]);
      expect(search.selected).toEqual(offences[0]);
      expect(mockWriteValue).toHaveBeenCalledTimes(1);

      mockWriteValue.mockClear();

      search.writeValue(offences[0]);
      expect(mockWriteValue).not.toHaveBeenCalled();
      expect(search.selected).toEqual(offences[0]);
    });
  });

  @Component({
    selector: 'offence-search-test',
    template: `
      <form>
        <pdk-form-field label="test">
          <offence-search name="offence" [selectedOffenceCode]="'HAHA'" ngModel> </offence-search>
        </pdk-form-field>
      </form>
    `,
    imports: [OffenceSearchComponent, CommonModule, FormsModule, PdkFormFieldComponent]
  })
  class TestOffenceSearchComponent {
    noResult = false;
  }

  @Component({
    selector: 'offence-search-with-code-test',
    template: `
      <form>
        <offence-search name="offence" [selectedOffenceCode]="'CTO101'" ngModel> </offence-search>
      </form>
    `,
    imports: [OffenceSearchComponent, CommonModule, FormsModule]
  })
  class TestOffenceSearchWithCodeComponent {}
});
