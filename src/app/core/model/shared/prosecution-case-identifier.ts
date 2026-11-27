export interface ProsecutionCaseIdentifier {
  prosecutionAuthorityId: string;
  prosecutionAuthorityCode: string;
  prosecutionAuthorityReference?: string;
  caseURN?: string;
}
// A case can EITHER have a caseUrn OR a prosecutionAuthorityReference.
