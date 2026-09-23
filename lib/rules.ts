export type LedgerMutation={tabId:string;ledgerVersion:number};
export function nextLedgerVersion(current:number){return current+1}
export function canCreateExpense(authUserId:string,payerId:string){return authUserId===payerId}
export function canLockTab(activeMemberIds:string[],approvedUserIds:string[],hasOpenDisputes:boolean){if(hasOpenDisputes)return false;const a=new Set(approvedUserIds);return activeMemberIds.every(id=>a.has(id))}
export function unanimous(currentMemberIds:string[],approvals:string[]){const a=new Set(approvals);return currentMemberIds.every(id=>a.has(id))}
export const APPROVAL_RESET_EVENTS=["expense.created","expense.updated","expense.voided","member.joined","member.inactivated","member.removed","dispute.resolved"] as const;