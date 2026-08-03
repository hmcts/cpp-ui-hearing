import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CppHttp, provideCppCoreHttpServices } from '@cpp/core';
import { provideTranslateService } from '@ngx-translate/core';
import { Offence } from '../../../magistrates/interfaces/magistrates-hearing.interface';
import { OffenceConditionsDialogComponent } from '../offence-conditions-dialog.component';

describe('OffenceConditionsDialogComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(),
        provideRouter([]),
        provideCppCoreHttpServices(),
        {
          provide: CppHttp,
          useValue: {
            query: jest.fn(),
            commandSync: jest.fn()
          }
        }
      ],
      teardown: { destroyAfterEach: false }
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  }));

  it('should render the component', () => {
    expect(fixture).toMatchSnapshot();
  });
});

@Component({
  template: ` <offence-conditions-dialog [offences]="offences"></offence-conditions-dialog> `,
  imports: [OffenceConditionsDialogComponent]
})
class TestHostComponent {
  offences: Offence[] = [
    {
      offenceTitle: 'Offence title'
    } as Offence
  ];
}
