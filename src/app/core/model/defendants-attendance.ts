import { AttendanceDay } from './attendance-day';

export interface TodaysDefendantAttendance {
  defendantId: string;
  attendanceType: AttendanceTypeEnum;
  day: string;
}

export interface DefendantAttendance {
  defendantId: string;
  attendanceDays: AttendanceDay[];
}

export interface UpdateDefendantAttendance {
  hearingId: string;
  defendantId: string;
  attendanceDay: AttendanceDay;
}

export enum AttendanceTypeEnum {
  IN_PERSON = 'IN_PERSON',
  BY_VIDEO = 'BY_VIDEO',
  NOT_PRESENT = 'NOT_PRESENT'
}
