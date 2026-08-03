import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApplicationDetailsComponent } from './application-details.component';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('ApplicationComponent', () => {
  let component: ApplicationDetailsComponent;
  let testHostComponent: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      teardown: { destroyAfterEach: false }
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    testHostComponent = fixture.componentInstance;
    component = fixture.debugElement.query(
      By.directive(ApplicationDetailsComponent)
    ).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(fixture).toMatchSnapshot();
  });

  it('should display the legislation', () => {
    testHostComponent.legislation = 'mock-legislation';
    fixture.detectChanges();
    expect(component.legislation).toBe('mock-legislation');
  });

  it('should display the type', () => {
    testHostComponent.type = 'mock-type';
    fixture.detectChanges();
    expect(component.type).toBe('mock-type');
  });

  @Component({
    selector: 'test-host-component',
    template: `
      <application-details [legislation]="legislation" [type]="type"> </application-details>
    `,
    imports: [ApplicationDetailsComponent]
  })
  class TestHostComponent {
    legislation: string;
    type: string;
  }
});
