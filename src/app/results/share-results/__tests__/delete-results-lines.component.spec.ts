import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { ResolvedDraftResultLine } from '../../results.interfaces';
import { DeletedResultLinesComponent } from '../deleted-result-lines.component';

const deletedResultLinesMock: ResolvedDraftResultLine[] = [
  {
    label: 'Costs',
    valid: true,
    deleted: true,
    applicationId: 'd085e359-6069-4694-8820-7810e7dfe762',
    amendmentDate: '2021-07-21T13:10:57.707Z',
    amendmentReason: {
      id: 'ca8b8285-5fc7-3b36-aa78-ecdf5ac6dad0',
      reasonDescription: 'Admin error on shared result (a result recorded incorrectly)'
    },
    amendmentsLog: {
      isAmended: true,
      amendmentsRecord: [
        {
          amendedBy: 'Mr AmendedBy',
          amendmentDate: '2021-07-21',
          amendmentReason: {
            id: 'ca8b8285-5fc7-3b36-aa78-ecdf5ac6dad0',
            reasonDescription: 'Admin error on shared result (a result recorded incorrectly)'
          },
          resultPromptsRecord: [],
          validatedBy: 'Mr ValidatedBy',
          validationDate: '2021-07-21'
        }
      ]
    },
    shortCode: 'fcost',
    orderedDate: '2021-07-09',
    resultLevel: 'C',
    originalText: 'FCOST',
    resultLineId: 'da14abb8-0f4f-42b6-bd12-9edf72eab7ce',
    resultPrompts: [
      {
        type: 'CURR',
        label: 'Amount of costs',
        value: 1000,
        promptId: 'db261fd9-c6bb-4e10-b93f-9fd98418f7b0',
        promptRef: 'AOC'
      },
      {
        type: 'ONEOF',
        label: 'Major creditor',
        value: {
          type: 'FIXL',
          label: 'Major creditor',
          value: 'Television Licensing Organisation',
          promptId: 'af921cf4-06e7-4f6b-a4ea-dcb58aab0dbe',
          promptRef: 'CREDNAME'
        },
        promptId: 'af921cf4-06e7-4f6b-a4ea-dcb58aab0dbe',
        promptRef: 'CREDNAME'
      }
    ],
    sharedDate: '2021-07-21T00:00:00.000Z',
    unresolvedParts: [],
    resultDefinitionId: '76d43772-0660-4a33-b5c6-8f8ccaf6b4e3'
  }
];

describe('DeletedResultLinesComponent', () => {
  let hostFixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;

  beforeEach(() => {
    hostFixture = TestBed.createComponent(TestHostComponent);
    hostComponent = hostFixture.componentInstance;
  });

  it('should render the component', () => {
    hostComponent.deletedResultLines = deletedResultLinesMock;
    hostFixture.detectChanges();
    expect(hostFixture).toMatchSnapshot();
  });
});

@Component({
  selector: 'test-host-component',
  template: `
    @if (deletedResultLines.length > 0) {
    <cpp-deleted-result-lines [deletedResultLines]="deletedResultLines"> </cpp-deleted-result-lines>
    }
  `,
  imports: [DeletedResultLinesComponent]
})
class TestHostComponent {
  deletedResultLines: ResolvedDraftResultLine[];
}
