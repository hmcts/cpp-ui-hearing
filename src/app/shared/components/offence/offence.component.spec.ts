import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { OffenceComponent } from './offence.component';

describe('OffenceComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: OffenceComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      teardown: { destroyAfterEach: false }
    });

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    component = fixture.debugElement.query(By.directive(OffenceComponent)).componentInstance;
  });

  const mockOffence = {
    offenceId: '*',
    cjsOffenceCode: 'CTO101',
    title: 'Offence title',
    legislation: 'Bondi Beach'
  };

  it('should compile correctly', () => {
    fixture.componentInstance.offence = mockOffence;
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });

  it('should render offence code', () => {
    fixture.componentInstance.offence = mockOffence;
    fixture.detectChanges();

    const offenceCodeElement = fixture.debugElement.query(
      By.css('span[pdk-text-colour="dark-grey"]')
    );
    expect(offenceCodeElement.nativeElement.textContent.trim()).toBe('CTO101');
  });

  it('should render offence title', () => {
    fixture.componentInstance.offence = mockOffence;
    fixture.detectChanges();

    const titleElement = fixture.debugElement.query(By.css('.bold'));
    expect(titleElement.nativeElement.textContent.trim()).toBe('Offence title');
  });

  it('should render legislation', () => {
    fixture.componentInstance.offence = mockOffence;
    fixture.detectChanges();

    const legislationElements = fixture.debugElement.queryAll(
      By.css('span[pdk-text-colour="dark-grey"]')
    );
    const legislationElement = legislationElements.find(
      el => el.nativeElement.textContent.trim() === 'Bondi Beach'
    );
    expect(legislationElement).toBeDefined();
    expect(legislationElement.nativeElement.textContent.trim()).toBe('Bondi Beach');
  });

  it('should render all offence properties correctly', () => {
    fixture.componentInstance.offence = mockOffence;
    fixture.detectChanges();

    expect(fixture).toMatchSnapshot();
  });

  it('should update when offence input changes', () => {
    fixture.componentInstance.offence = mockOffence;
    fixture.detectChanges();

    const newOffence = {
      offenceId: '456',
      cjsOffenceCode: 'ABC999',
      title: 'New Offence Title',
      legislation: 'New Legislation'
    };

    fixture.componentInstance.offence = newOffence;
    fixture.detectChanges();

    const titleElement = fixture.debugElement.query(By.css('.bold'));
    expect(titleElement.nativeElement.textContent.trim()).toBe('New Offence Title');
    expect(fixture).toMatchSnapshot();
  });

  it('should handle offence with empty strings', () => {
    const emptyOffence = {
      offenceId: '',
      cjsOffenceCode: '',
      title: '',
      legislation: ''
    };

    fixture.componentInstance.offence = emptyOffence;
    fixture.detectChanges();

    expect(fixture).toMatchSnapshot();
  });

  it('should handle offence with long text', () => {
    const longTextOffence = {
      offenceId: '123',
      cjsOffenceCode: 'VERY_LONG_OFFENCE_CODE_THAT_MIGHT_WRAP',
      title: 'This is a very long offence title that might wrap to multiple lines in the UI',
      legislation: 'This is a very long piece of legislation text that might also wrap'
    };

    fixture.componentInstance.offence = longTextOffence;
    fixture.detectChanges();

    expect(fixture).toMatchSnapshot();
  });

  it('should have correct component instance', () => {
    fixture.componentInstance.offence = mockOffence;
    fixture.detectChanges();

    expect(component).toBeDefined();
    expect(component.offence).toEqual(mockOffence);
  });

  it('should update when input binding changes', () => {
    fixture.componentInstance.offence = mockOffence;
    fixture.detectChanges();

    const titleElement = fixture.debugElement.query(By.css('.bold'));
    expect(titleElement.nativeElement.textContent.trim()).toBe('Offence title');

    const updatedOffence = {
      offenceId: '999',
      cjsOffenceCode: 'XYZ888',
      title: 'Updated Title',
      legislation: 'Updated Legislation'
    };

    fixture.componentInstance.offence = updatedOffence;
    fixture.detectChanges();

    expect(titleElement.nativeElement.textContent.trim()).toBe('Updated Title');
    expect(component.offence).toEqual(updatedOffence);
  });
});

@Component({
  template: ` <offence [offence]="offence"></offence> `,
  imports: [OffenceComponent]
})
class TestHostComponent {
  offence = {
    offenceId: '*',
    cjsOffenceCode: 'CTO101',
    title: 'Offence title',
    legislation: 'Bondi Beach'
  };
}
