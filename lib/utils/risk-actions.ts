import type { RiskActionType, RiskAuditPayload } from '@/lib/types/risk'

export const RISK_ACTION_REASONS: Record<RiskActionType, string[]> = {
  block: [
    'aml_watchlist_match',
    'account_takeover_signal',
    'structuring_pattern',
    'manual_risk_decision',
  ],
  flag: ['velocity_breach', 'impossible_travel', 'kyc_mismatch', 'manual_review'],
  approve: ['false_positive', 'verified_context', 'analyst_clearance'],
  freeze: ['high_risk_user', 'investigation_in_progress', 'regulatory_hold'],
  escalate: ['sar_required', 'senior_review_needed', 'compliance_review_needed'],
  dismiss: ['duplicate_alert', 'known_safe_pattern', 'no_action_needed'],
}

export function validateRiskReason(actionType: RiskActionType, reasonCode: string, reasonText: string): string | null {
  if (!reasonCode.trim()) return 'Reason code is required.'
  if (!RISK_ACTION_REASONS[actionType].includes(reasonCode)) return 'Selected reason is not allowed for this action.'
  if (!reasonText.trim()) return 'Reason details are required.'
  return null
}

export function buildRiskAuditPayload(payload: RiskAuditPayload): RiskAuditPayload {
  return {
    ...payload,
    reasonCode: payload.reasonCode.trim(),
    reasonText: payload.reasonText.trim(),
  }
}
