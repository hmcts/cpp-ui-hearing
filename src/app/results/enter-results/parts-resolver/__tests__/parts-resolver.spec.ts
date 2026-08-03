import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Store, provideStore, provideState } from '@ngrx/store';
import { provideRouter } from '@angular/router';
import { reducers } from '../../../../core';
import { DraftResultActions, resultsReducer, ResultsState } from '../../../core/store';
import { UnresolvedPart } from '../../../results.interfaces';
import { PartsResolverContainerComponent } from '../parts-resolver.container';

describe('PartsResolverContainerComponent', () => {
  let fixture: ComponentFixture<PartsResolverContainerTestComponent>;
  let store: Store<ResultsState>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PartsResolverContainerTestComponent],
      providers: [
        provideStore(reducers, { runtimeChecks: {} }),
        provideRouter([]),
        provideState('results', resultsReducer)
      ],
      teardown: { destroyAfterEach: false }
    });

    fixture = TestBed.createComponent(PartsResolverContainerTestComponent);
    store = TestBed.inject(Store);
    jest.spyOn(store, 'dispatch');
  });

  const openOptionsForIndex = (index: number) => {
    fixture.debugElement
      .queryAll(By.css('[data-test-id="unresolvedPart"]'))
      [index].nativeElement.click();
    fixture.detectChanges();
  };

  describe('result choices', () => {
    beforeEach(() => {
      fixture.componentInstance.parts = [
        {
          state: 'UNRESOLVED',
          value: 'I',
          resultChoices: [
            {
              code: '1',
              label: 'Imprisonment',
              level: 'O',
              shortCode: 'IMP',
              type: 'RESULT'
            },
            {
              code: '2',
              label: 'Total custodial period',
              level: 'D',
              shortCode: 'TIMP',
              type: 'RESULT'
            }
          ]
        },
        {
          type: 'TXT',
          value: 'X',
          originalText: 'X',
          state: 'UNRESOLVED'
        }
      ];
      fixture.detectChanges();
    });

    it('should render', () => {
      expect(fixture).toMatchSnapshot();
    });

    it('should display the available options for resolution', () => {
      openOptionsForIndex(0);
      expect(fixture).toMatchSnapshot();
    });

    it('should resolve an available choice', () => {
      openOptionsForIndex(0);
      fixture.debugElement.queryAll(By.css('[data-test-id="choice"]'))[1].nativeElement.click();

      expect(store.dispatch).toHaveBeenCalledWith(
        DraftResultActions.resolveDraftResultLinePart({
          resultLineId: 'resultLineId',
          partIndex: 0,
          choice: {
            code: '2',
            label: 'Total custodial period',
            level: 'D',
            shortCode: 'TIMP',
            type: 'RESULT'
          }
        })
      );
    });

    it('should delete a choice', () => {
      openOptionsForIndex(1);
      fixture.debugElement.query(By.css('[data-test-id="deleteChoice"]')).nativeElement.click();

      expect(store.dispatch).toHaveBeenCalledWith(
        DraftResultActions.destroyDraftResultLinePart({
          resultLineId: 'resultLineId',
          partIndex: 1
        })
      );
    });
  });

  describe('result prompts', () => {
    beforeEach(() => {
      fixture.componentInstance.parts = [
        {
          type: 'TXT',
          value: 'UNKNOWN',
          originalText: 'original_text',
          resultPrompts: [
            {
              type: 'TXT',
              promptId: '*',
              promptRef: 'promptRef1',
              label: 'Prompt Label 1',
              value: 'UNKNOWN'
            },
            {
              type: 'TXT',
              promptId: '*',
              promptRef: 'promptRef2',
              label: 'Prompt Label 2',
              value: 'UNKNOWN'
            }
          ]
        },
        {
          type: 'TXT',
          value: 'value_text',
          resultPrompts: []
        }
      ];
      fixture.detectChanges();
    });

    it('should render', () => {
      expect(fixture).toMatchSnapshot();
    });

    it('should display the available options for resolution', () => {
      openOptionsForIndex(0);
      expect(fixture).toMatchSnapshot();
    });

    it('should display a placeholder when no resolution exists', () => {
      openOptionsForIndex(1);
      expect(fixture).toMatchSnapshot();
    });

    it('should resolve an available choice', () => {
      openOptionsForIndex(0);
      fixture.debugElement.queryAll(By.css('[data-test-id="choice"]'))[1].nativeElement.click();

      expect(store.dispatch).toHaveBeenCalledWith(
        DraftResultActions.resolveDraftResultLinePart({
          resultLineId: 'resultLineId',
          partIndex: 0,
          choice: {
            type: 'TXT',
            promptId: '*',
            promptRef: 'promptRef2',
            label: 'Prompt Label 2',
            value: 'UNKNOWN'
          }
        })
      );
    });

    it('should delete a choice', () => {
      openOptionsForIndex(1);
      fixture.debugElement.query(By.css('[data-test-id="deleteChoice"]')).nativeElement.click();

      expect(store.dispatch).toHaveBeenCalledWith(
        DraftResultActions.destroyDraftResultLinePart({
          resultLineId: 'resultLineId',
          partIndex: 1
        })
      );
    });
  });

  @Component({
    template: `
      <cpp-parts-resolver-container [parts]="parts" [resultLineId]="resultLineId">
      </cpp-parts-resolver-container>
    `,
    imports: [PartsResolverContainerComponent]
  })
  class PartsResolverContainerTestComponent {
    parts: UnresolvedPart[] = [];
    resultLineId = 'resultLineId';
  }
});
