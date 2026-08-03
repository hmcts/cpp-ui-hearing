import { PanelItemComponent } from './panel-item.component';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

describe('PanelItemComponent', () => {
  let component: PanelItemComponent;
  let fixture: ComponentFixture<PanelItemComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [PanelItemComponent],
      teardown: { destroyAfterEach: false }
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PanelItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
