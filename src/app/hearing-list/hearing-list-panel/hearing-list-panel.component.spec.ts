import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HearingListPanelComponent } from './hearing-list-panel.component';

describe('HearingListPanelComponent', () => {
  let component: HearingListPanelComponent;
  let fixture: ComponentFixture<HearingListPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HearingListPanelComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(HearingListPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
