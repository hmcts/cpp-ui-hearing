import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DefendantPresenceComponent } from './defendant-presence.component';
import { provideTranslateService } from '@ngx-translate/core';

describe('DefendantPresenceComponent', () => {
  let component: DefendantPresenceComponent;
  let fixture: ComponentFixture<DefendantPresenceComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService()],
      imports: [DefendantPresenceComponent],
      teardown: { destroyAfterEach: false }
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DefendantPresenceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the template with the values expected', () => {
    expect(fixture).toMatchSnapshot();
  });
});
