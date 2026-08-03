import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IdpcIngestionStatusComponent } from './idpc-ingestion-status.component';
import { IdpcIngestionPhase } from '../../core/model/idpc-ingestion';

describe('IdpcIngestionStatusComponent', () => {
  let component: IdpcIngestionStatusComponent;
  let fixture: ComponentFixture<IdpcIngestionStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IdpcIngestionStatusComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(IdpcIngestionStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should render properly when phase is null', () => {
    component.phase = null;
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });
  it('should render properly when phase is IN_PROGRESS', () => {
    component.phase = IdpcIngestionPhase.IN_PROGRESS;
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });
  it('should render properly when phase is COMPLETED', () => {
    component.phase = IdpcIngestionPhase.COMPLETED;
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });
  it('should render properly when phase is FAILED', () => {
    component.phase = IdpcIngestionPhase.FAILED;
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });
  it('should render properly when phase is STARTED', () => {
    component.phase = IdpcIngestionPhase.STARTED;
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });
  it('should render properly when phase is FORBIDDEN', () => {
    component.phase = IdpcIngestionPhase.FORBIDDEN;
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });
});
