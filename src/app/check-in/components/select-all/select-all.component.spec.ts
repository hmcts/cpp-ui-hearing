import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { SelectAllComponent } from './select-all.component';

describe('SelectAllComponent', () => {
  let component: SelectAllComponent;
  let fixture: ComponentFixture<SelectAllComponent>;
  let debugElement: DebugElement;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SelectAllComponent],
      teardown: { destroyAfterEach: false }
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectAllComponent);
    component = fixture.componentInstance;
    debugElement = fixture.debugElement;
  });

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have default hasSelected value as false', () => {
      expect(component.hasSelected).toBe(false);
    });

    it('should initialize onToggle EventEmitter', () => {
      expect(component.onToggle).toBeDefined();
    });
  });

  describe('Input Properties', () => {
    it('should accept hasSelected input', () => {
      component.hasSelected = true;
      fixture.detectChanges();
      expect(component.hasSelected).toBe(true);
    });

    it('should accept selectText input', () => {
      const testText = 'Select all items';
      component.selectText = testText;
      fixture.detectChanges();
      expect(component.selectText).toBe(testText);
    });

    it('should accept unSelectText input', () => {
      const testText = 'Unselect all items';
      component.unSelectText = testText;
      fixture.detectChanges();
      expect(component.unSelectText).toBe(testText);
    });
  });

  describe('Template Rendering', () => {
    it('should display selectText when hasSelected is false', () => {
      component.hasSelected = false;
      component.selectText = 'Select All';
      component.unSelectText = 'Unselect All';
      fixture.detectChanges();

      const linkElement = debugElement.query(By.css('a'));
      expect(linkElement.nativeElement.textContent.trim()).toBe('Select All');
    });

    it('should display unSelectText when hasSelected is true', () => {
      component.hasSelected = true;
      component.selectText = 'Select All';
      component.unSelectText = 'Unselect All';
      fixture.detectChanges();

      const linkElement = debugElement.query(By.css('a'));
      expect(linkElement.nativeElement.textContent.trim()).toBe('Unselect All');
    });

    it('should set alt attribute to selectText when hasSelected is false', () => {
      component.hasSelected = false;
      component.selectText = 'Select All';
      component.unSelectText = 'Unselect All';
      fixture.detectChanges();

      const linkElement = debugElement.query(By.css('a'));
      expect(linkElement.nativeElement.getAttribute('alt')).toBe('Select All');
    });

    it('should set alt attribute to unSelectText when hasSelected is true', () => {
      component.hasSelected = true;
      component.selectText = 'Select All';
      component.unSelectText = 'Unselect All';
      fixture.detectChanges();

      const linkElement = debugElement.query(By.css('a'));
      expect(linkElement.nativeElement.getAttribute('alt')).toBe('Unselect All');
    });

    it('should have pdk-link directive', () => {
      fixture.detectChanges();
      const linkElement = debugElement.query(By.css('a[pdk-link]'));
      expect(linkElement).toBeTruthy();
    });

    it('should have correct href attribute', () => {
      fixture.detectChanges();
      const linkElement = debugElement.query(By.css('a'));
      expect(linkElement.nativeElement.getAttribute('href')).toBe('javascript:void(0);');
    });

    it('should have correct font-weight style', () => {
      fixture.detectChanges();
      const linkElement = debugElement.query(By.css('a'));
      expect(linkElement.nativeElement.style.fontWeight).toBe('normal');
    });
  });

  describe('Output Events', () => {
    it('should emit true when link is clicked and hasSelected is false', () => {
      component.hasSelected = false;
      fixture.detectChanges();

      jest.spyOn(component.onToggle, 'emit');

      const linkElement = debugElement.query(By.css('a'));
      linkElement.nativeElement.click();

      expect(component.onToggle.emit).toHaveBeenCalledWith(true);
    });

    it('should emit false when link is clicked and hasSelected is true', () => {
      component.hasSelected = true;
      fixture.detectChanges();

      jest.spyOn(component.onToggle, 'emit');

      const linkElement = debugElement.query(By.css('a'));
      linkElement.nativeElement.click();

      expect(component.onToggle.emit).toHaveBeenCalledWith(false);
    });

    it('should emit onToggle event exactly once per click', () => {
      component.hasSelected = false;
      fixture.detectChanges();

      jest.spyOn(component.onToggle, 'emit');

      const linkElement = debugElement.query(By.css('a'));
      linkElement.nativeElement.click();

      expect(component.onToggle.emit).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined selectText', () => {
      component.hasSelected = false;
      component.selectText = undefined as any;
      component.unSelectText = 'Unselect All';

      expect(() => {
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should handle undefined unSelectText', () => {
      component.hasSelected = true;
      component.selectText = 'Select All';
      component.unSelectText = undefined as any;

      expect(() => {
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should handle empty string for selectText', () => {
      component.hasSelected = false;
      component.selectText = '';
      component.unSelectText = 'Unselect All';
      fixture.detectChanges();

      const linkElement = debugElement.query(By.css('a'));
      expect(linkElement.nativeElement.textContent.trim()).toBe('');
    });

    it('should handle empty string for unSelectText', () => {
      component.hasSelected = true;
      component.selectText = 'Select All';
      component.unSelectText = '';
      fixture.detectChanges();

      const linkElement = debugElement.query(By.css('a'));
      expect(linkElement.nativeElement.textContent.trim()).toBe('');
    });

    it('should toggle correctly multiple times', () => {
      component.hasSelected = false;
      component.selectText = 'Select All';
      component.unSelectText = 'Unselect All';
      fixture.detectChanges();

      jest.spyOn(component.onToggle, 'emit');

      const linkElement = debugElement.query(By.css('a'));

      linkElement.nativeElement.click();
      expect(component.onToggle.emit).toHaveBeenCalledWith(true);

      component.hasSelected = true;
      fixture.detectChanges();

      linkElement.nativeElement.click();
      expect(component.onToggle.emit).toHaveBeenCalledWith(false);

      expect(component.onToggle.emit).toHaveBeenCalledTimes(2);
    });
  });

  describe('Snapshot Tests', () => {
    it('should match snapshot when hasSelected is false', () => {
      component.hasSelected = false;
      component.selectText = 'Select All';
      component.unSelectText = 'Unselect All';
      fixture.detectChanges();

      expect(fixture).toMatchSnapshot();
    });

    it('should match snapshot when hasSelected is true', () => {
      component.hasSelected = true;
      component.selectText = 'Select All';
      component.unSelectText = 'Unselect All';
      fixture.detectChanges();

      expect(fixture).toMatchSnapshot();
    });
  });
});
