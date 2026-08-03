export interface ApprovalRequest {
  hearingId: string;
  userId?: string;
  requestApprovalTime: string;
  approvalType: 'APPROVAL' | 'CHANGE';
}
