export const REVIEW_PATH = '';
export const FORM_PATH = 'edit';

export const reviewRoute = (hearingId: string): string[] => [
  '/manage',
  hearingId,
  'tier-and-list-type'
];

export const formRoute = (hearingId: string): string[] => [...reviewRoute(hearingId), FORM_PATH];
