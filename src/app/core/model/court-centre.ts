export interface CourtCentre {
  id: string;
  name: string;
  oucode?: string;
  oucodeL1Code?: string;
  welshName?: string;
  roomId?: string;
  roomName?: string;
  courtrooms?: CourtRoom[];
  welshRoomName?: string;
}

export interface CourtRoom {
  id: string;
  name: string;
  welshCourtroomName?: string;
}
