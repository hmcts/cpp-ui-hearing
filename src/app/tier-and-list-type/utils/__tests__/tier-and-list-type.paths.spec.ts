import { FORM_PATH, formRoute, REVIEW_PATH, reviewRoute } from '../tier-and-list-type.paths';

describe('tier and list type paths', () => {
  it('should expose an empty review path so the review page is the default child route', () => {
    expect(REVIEW_PATH).toBe('');
  });

  it('should expose an edit form path', () => {
    expect(FORM_PATH).toBe('edit');
  });

  it('should build the review route for a hearing', () => {
    expect(reviewRoute('hearing-1')).toEqual(['/manage', 'hearing-1', 'tier-and-list-type']);
  });

  it('should build the form route by appending the form path to the review route', () => {
    expect(formRoute('hearing-1')).toEqual(['/manage', 'hearing-1', 'tier-and-list-type', 'edit']);
  });

  it('should not mutate a previously built review route when building a form route', () => {
    const review = reviewRoute('hearing-1');

    formRoute('hearing-1');

    expect(review).toEqual(['/manage', 'hearing-1', 'tier-and-list-type']);
  });

  it('should return a new array on every call', () => {
    expect(reviewRoute('hearing-1')).not.toBe(reviewRoute('hearing-1'));
    expect(formRoute('hearing-1')).not.toBe(formRoute('hearing-1'));
  });
});
