export interface IntermediaryCounsel {
  id: string;
  firstName: string;
  lastName: string;
  role: IntermediaryType;
  attendant: IntermediaryAttendance;
  attendanceDays: string[];
}

export enum IntermediaryType {
  INTERPRETER = 'INTERPRETER',
  INTERMEDIARY = 'INTERMEDIARY'
}

export enum AttendantType {
  DEFENDANTS = 'DEFENDANTS',
  WITNESS = 'WITNESS'
}

export interface IntermediaryAttendance {
  defendantId?: string;
  attendantType: AttendantType;
  name: string;
}
