import { Validators } from '@angular/forms';
import { buildTierAndListTypeFormGroup } from '../tier-and-list-type-form.utils';

describe('buildTierAndListTypeFormGroup', () => {
  it('should create the tier, listType and keyReason controls', () => {
    const form = buildTierAndListTypeFormGroup();

    expect(Object.keys(form.controls).sort()).toEqual(['keyReason', 'listType', 'tier']);
  });

  it('should start every control empty', () => {
    const form = buildTierAndListTypeFormGroup();

    expect(form.value).toEqual({ tier: null, listType: null, keyReason: null });
  });

  it('should make tier required', () => {
    const form = buildTierAndListTypeFormGroup();

    expect(form.controls.tier.hasValidator(Validators.required)).toBe(true);
    expect(form.controls.tier.hasError('required')).toBe(true);
    expect(form.invalid).toBe(true);
  });

  it('should leave listType optional', () => {
    const form = buildTierAndListTypeFormGroup();

    expect(form.controls.listType.hasValidator(Validators.required)).toBe(false);
    expect(form.controls.listType.valid).toBe(true);
  });

  it('should leave keyReason optional', () => {
    const form = buildTierAndListTypeFormGroup();

    expect(form.controls.keyReason.hasValidator(Validators.required)).toBe(false);
    expect(form.controls.keyReason.valid).toBe(true);
  });

  it('should become valid once tier alone is selected', () => {
    const form = buildTierAndListTypeFormGroup();

    form.controls.tier.setValue('TIER_3');

    expect(form.valid).toBe(true);
  });

  it('should return an independent form group on every call', () => {
    const first = buildTierAndListTypeFormGroup();
    const second = buildTierAndListTypeFormGroup();

    first.controls.tier.setValue('TIER_1');

    expect(first).not.toBe(second);
    expect(second.controls.tier.value).toBeNull();
  });
});
