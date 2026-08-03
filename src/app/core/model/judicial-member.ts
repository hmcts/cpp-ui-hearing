export interface JudicialMember {
  id: string;
  cpUserId?: string;
  seqId: number;
  titlePrefix?: string;
  titleJudicialPrefix?: string;
  titleSuffix?: string;
  titlePrefixWelsh?: string;
  titleJudiciaryPrefixWelsh?: string;
  titleSuffixWelsh?: string;
  surname: string;
  forenames: string;
  judiciaryType: string;
  validFrom?: string;
  validTo?: string;
  ljaShortName?: string;
  baseLocation?: string;
}

export interface SelectedJudiciaryOptions {
  judiciaryType?: string;
  search?: string;
  ids?: string;
  limit?: number;
}
