export interface OutstandingFine {
  defendantName: string;
  dateOfBirth?: string;
  accountNumber: string;
  address?: string;
  lastEnforcementAction?: string;
  outstandingBalance?: number;
  isCollectionOrderMade?: boolean;
  paymentRate?: string;
  amountImposed?: number;
  amountPaid?: number;
  defaultDays?: number;
  isConsolidated?: boolean;
  accountLocation?: string;
  parentGuardianToPay?: boolean;
}

export interface OutstandingFineCreateReportFormValues {
  courtCentreFilter: {
    id: string;
    name: string;
  };
  courtRoomsFilter: string[];
  dateFilter: string;
}

export interface OutstandingFinesDetails {
  courtHouse: string;
  courtRooms: string;
  hearingDate: string;
  reportCreatedDate: string;
  createdBy: string;
  outstandingFinesByCourtRooms: CourtRoomOutstandingFines[];
}

export interface CourtRoomOutstandingFines {
  courtRoomName: string;
  outstandingFines: OutstandingFine[];
}

export interface OutstandingFineDefendantDetails {
  defendantId: string;
  firstName?: string;
  lastName?: string;
  name?: string;
}
