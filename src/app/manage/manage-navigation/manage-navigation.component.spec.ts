import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { ManageNavigationComponent } from './manage-navigation.component';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { Store, provideStore } from '@ngrx/store';
import { AppState, reducers } from '../../core';
import { of } from 'rxjs';
import { By } from '@angular/platform-browser';

describe('ManageNavigationComponent', () => {
  let fixture: ComponentFixture<ManageNavigationComponent>;
  let store: Store<AppState>;
  const paramMap = { get: () => 'bed2d8e5-9fe2-4003-a40b-cee8d1f235d8' };

  beforeEach(waitForAsync(() => {
    jest.fn().mockReturnValue(
      new Promise<void>((resolve, reject) => {
        resolve();
      })
    );

    TestBed.configureTestingModule({
      imports: [ManageNavigationComponent],
      providers: [
        provideTranslateService(),
        provideStore(reducers, { runtimeChecks: {} }),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              parent: {
                paramMap: paramMap
              },
              paramMap: paramMap
            },
            paramMap: of(paramMap)
          }
        }
      ],
      teardown: { destroyAfterEach: false }
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageNavigationComponent);
    store = TestBed.inject(Store);
    jest.spyOn(store, 'dispatch');
  });

  it('should have the expected template', () => {
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });

  it('should have the expected template for offences', () => {
    fixture.componentInstance.currentTab = 'Offences';
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });

  it('should have the expected template for Applications', () => {
    fixture.componentInstance.currentTab = 'Applications';
    fixture.componentInstance.ngAfterViewInit();
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });

  it('should disable manage hearing tab if flag is false', () => {
    fixture.componentInstance.isManageHearingPageApplicableFlag = false;
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });

  describe('tier and list type tab', () => {
    const tabLink = () =>
      fixture.debugElement.query(By.css('#tier-and-list-type-link'))?.nativeElement;

    it('is absent outside the Crown Court', () => {
      fixture.componentInstance.isTierAndListTypeAvailable = false;
      fixture.detectChanges();

      expect(tabLink()).toBeUndefined();
    });

    it('links to the tier and list type screen for a Crown Court hearing', () => {
      fixture.componentInstance.isTierAndListTypeAvailable = true;
      fixture.detectChanges();

      expect(tabLink()).toBeTruthy();
      expect(tabLink().getAttribute('routerLink')).toEqual('./tier-and-list-type');
    });

    it('invites entry until a tier has been saved', () => {
      fixture.componentInstance.isTierAndListTypeAvailable = true;
      fixture.componentInstance.isTierAndListTypeEntered = false;
      fixture.detectChanges();

      expect(tabLink().textContent).toContain('MANAGE_HEARING.ENTER_TIER_AND_LIST_TYPE');
    });

    it('drops the "Enter" prefix once a tier has been saved', () => {
      fixture.componentInstance.isTierAndListTypeAvailable = true;
      fixture.componentInstance.isTierAndListTypeEntered = true;
      fixture.detectChanges();

      expect(tabLink().textContent).toContain('MANAGE_HEARING.TIER_AND_LIST_TYPE');
      expect(tabLink().textContent).not.toContain('ENTER_TIER_AND_LIST_TYPE');
    });
  });
});
