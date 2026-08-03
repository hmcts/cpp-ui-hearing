export interface FilterOption {
  value: number | string;
  label: string;
  selected?: boolean;
}

export interface DefaultOptions {
  dateFilter?: string | number;
  courtCentreFilter?: {
    id: string | number;
    name: string;
  };
  courtRoomFilter?: {
    id: string | number;
    name: string;
  };
  startTimeFilter?: string;
  endTimeFilter?: string;
}
