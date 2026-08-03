import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeOfJurisdictionComponent } from '../change-of-jurisdiction.component';
import { AvailableHearing } from '../../../../core';
import { provideTranslateService } from '@ngx-translate/core';

describe('ChangeOfJurisdictionComponent', () => {
  let component: ChangeOfJurisdictionComponent;
  let fixture: ComponentFixture<ChangeOfJurisdictionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService()],
      imports: [ChangeOfJurisdictionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ChangeOfJurisdictionComponent);
    component = fixture.componentInstance;

    component.hasSameJurisdiction = true;
    component.hearings = [
      {
        id: 'hearing-id',
        type: {
          description: 'description'
        }
      }
    ] as AvailableHearing[];
    component.mapOrganisationUnits = {
      'organisation-unit-id': {
        id: 'organisation-unit-id',
        oucodeL3Code: 'oucodeL3Code',
        oucodeL3Name: 'oucodeL3Name'
      }
    };
    fixture.detectChanges();
  });

  it('should render the component', async () => {
    expect(fixture).toMatchSnapshot();
  });
});
