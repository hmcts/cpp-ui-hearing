import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AutoFocusDirective } from './auto-focus.directive';

@Component({
  template: `<input type="text" auto-focus />`,
  imports: [AutoFocusDirective]
})
class TestComponent {}

describe('AutofocusDirective', () => {
  let fixture: ComponentFixture<TestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    fixture.detectChanges();
  });

  it('should focus the input element when initialized', () => {
    const inputEl = fixture.debugElement.query(By.directive(AutoFocusDirective)).nativeElement;
    expect(document.activeElement).toBe(inputEl);
  });
});
