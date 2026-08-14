import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ListType, Tier } from '../models/ptph-detail.model';

export interface TierAndListTypeControls {
  tier: FormControl<Tier | null>;
  listType: FormControl<ListType | null>;
  keyReason: FormControl<string | null>;
}

export function buildTierAndListTypeFormGroup(): FormGroup<TierAndListTypeControls> {
  return new FormGroup<TierAndListTypeControls>({
    tier: new FormControl<Tier | null>(null, Validators.required),
    listType: new FormControl<ListType | null>(null),
    keyReason: new FormControl<string | null>(null)
  });
}
