export interface OffenceType {
  offenceId: string;
  cjsOffenceCode: string;
  title: string;
  legislation: string;
}

export interface OffenceCode {
  id: string;
  cjsoffencecode: string;
  title: string;
  pnldref: string;
  offencestartdate: string;
  standardoffencewording: string;
  welshstandardoffencewording: string;
  policeandcpschargingresponsibilities: string;
  timelimitforprosecutions: string;
  misCode: string;
  legislation: string;
  welshOffenceTitle: string;
  welshLegislation: string;
  libraCategoryCode: string;
  custodialIndicatorCode: string;
  dateCreated: string;
  dateOfLastUpdate: string;
  modeoftrial: string;
  modeoftrialdescription: string;
  lastModified: string;
}
