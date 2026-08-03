import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { OneLineAddressComponent } from './one-line-address.component';
import { Address } from '../../../core';

describe('OneLineAddressComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: OneLineAddressComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      teardown: { destroyAfterEach: false }
    });

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    component = fixture.debugElement.query(By.directive(OneLineAddressComponent)).componentInstance;
  });

  const mockFullAddress: Address = {
    formatedAddress: '123 Main Street, Apt 4B, Building C, District 5, Area 6, SW1A 1AA',
    address1: '123 Main Street',
    address2: 'Apt 4B',
    address3: 'Building C',
    address4: 'District 5',
    address5: 'Area 6',
    postcode: 'SW1A 1AA'
  };

  it('should render full address as one line', () => {
    fixture.componentInstance.address = mockFullAddress;
    fixture.detectChanges();

    const spanElement = fixture.debugElement.query(By.css('span'));
    const expectedText = '123 Main Street, Apt 4B, Building C, District 5, Area 6, SW1A 1AA';
    expect(spanElement.nativeElement.textContent.trim()).toBe(expectedText);
  });

  it('should skip empty fields and render only filled fields', () => {
    const partialAddress: Address = {
      formatedAddress: '456 Oak Avenue, Suite 100, M1 1AB',
      address1: '456 Oak Avenue',
      address2: '',
      address3: 'Suite 100',
      address4: '',
      address5: '',
      postcode: 'M1 1AB'
    };

    fixture.componentInstance.address = partialAddress;
    fixture.detectChanges();

    const spanElement = fixture.debugElement.query(By.css('span'));
    expect(spanElement.nativeElement.textContent.trim()).toBe('456 Oak Avenue, Suite 100, M1 1AB');
  });

  it('should render empty string when address is null or undefined', () => {
    fixture.componentInstance.address = null;
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('span')).nativeElement.textContent.trim()).toBe('');

    fixture.componentInstance.address = undefined;
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('span')).nativeElement.textContent.trim()).toBe('');
  });

  it('should update address when input changes via ngOnChanges', () => {
    fixture.componentInstance.address = mockFullAddress;
    fixture.detectChanges();

    const newAddress: Address = {
      formatedAddress: '789 Pine Road, Floor 2, E1 2CD',
      address1: '789 Pine Road',
      address2: 'Floor 2',
      address3: '',
      address4: '',
      address5: '',
      postcode: 'E1 2CD'
    };

    fixture.componentInstance.address = newAddress;
    fixture.detectChanges();

    const spanElement = fixture.debugElement.query(By.css('span'));
    expect(spanElement.nativeElement.textContent.trim()).toBe('789 Pine Road, Floor 2, E1 2CD');
    expect(component.oneLineAddress).toBe('789 Pine Road, Floor 2, E1 2CD');
  });
});

@Component({
  template: ` <one-line-address [address]="address"></one-line-address> `,
  imports: [OneLineAddressComponent]
})
class TestHostComponent {
  address: Address = {
    formatedAddress: '123 Main Street, Apt 4B, Building C, District 5, Area 6, SW1A 1AA',
    address1: '123 Main Street',
    address2: 'Apt 4B',
    address3: 'Building C',
    address4: 'District 5',
    address5: 'Area 6',
    postcode: 'SW1A 1AA'
  };
}
