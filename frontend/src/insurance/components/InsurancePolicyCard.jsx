import React from 'react';
import { Shield, Calendar, Award, Building2, CheckCircle2, ChevronRight } from 'lucide-react';
import { PolicyStatusBadge } from './StatusBadge';
import { Button } from '../../components/ui/button';

export const maskPolicyNumber = (policyNum) => {
  if (!policyNum) return 'XXXX-XXXX-XXXX';
  const parts = policyNum.split('-');
  if (parts.length > 1) {
    const last = parts[parts.length - 1];
    return `XXXX-XXXX-${last}`;
  }
  if (policyNum.length > 4) {
    return `XXXX-XXXX-${policyNum.slice(-4)}`;
  }
  return policyNum;
};

const InsurancePolicyCard = ({
  policy,
  onSelect,
  isSelected = false,
  showActions = true,
  onViewPolicy,
  onGenerateReport,
  onTrackClaim,
  onDownloadReceipt
}) => {
  if (!policy) return null;

  return (
    <div
      onClick={onSelect ? () => onSelect(policy) : undefined}
      className={`
        relative rounded-3xl p-5 sm:p-6 transition-all duration-300
        bg-gradient-to-br from-[#091122]/95 via-[#0c1630]/90 to-[#070e1e]/95
        border backdrop-blur-xl shadow-xl flex flex-col justify-between
        ${isSelected 
          ? 'border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.3)] ring-2 ring-blue-500/80 scale-[1.01]' 
          : 'border-slate-800/90 hover:border-slate-700/80 hover:shadow-2xl'
        }
        ${onSelect ? 'cursor-pointer' : ''}
      `}
    >
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 text-blue-400 shadow-inner">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                {policy.insurance_company}
              </h3>
              <p className="text-xs text-blue-300/80 font-medium mt-0.5">{policy.policy_type || 'Comprehensive Health'}</p>
            </div>
          </div>
          <PolicyStatusBadge status={policy.status} />
        </div>

        {/* Policy Details Grid */}
        <div className="grid grid-cols-2 gap-3.5 py-3.5 border-y border-slate-800/80 my-3 text-xs bg-slate-900/30 rounded-2xl px-3.5">
          <div>
            <span className="text-slate-400 block mb-0.5 text-[11px]">Policy Number</span>
            <span className="font-mono font-bold text-slate-200 text-xs">
              {maskPolicyNumber(policy.policy_number)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5 text-[11px]">Policyholder</span>
            <span className="font-semibold text-white text-xs truncate block">
              {policy.patient_name || 'Primary Insured'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5 text-[11px]">Total Sum Insured</span>
            <span className="font-bold text-emerald-400 text-sm">
              ₹{Number(policy.sum_insured || policy.coverage_amount || 0).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5 text-[11px]">Remaining Coverage</span>
            <span className="font-bold text-blue-300 text-sm">
              ₹{Number(policy.remaining_coverage !== undefined && policy.remaining_coverage !== null ? policy.remaining_coverage : policy.coverage_amount || 450000).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5 text-[11px]">Policy Validity</span>
            <span className="text-slate-300 text-[11px]">
              {policy.start_date} → {policy.end_date}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5 text-[11px]">Deductible & Copay</span>
            <span className="text-slate-300 font-medium text-[11px]">
              ₹{Number(policy.deductible || 5000).toLocaleString()} ({policy.copay_percentage || 10}%)
            </span>
          </div>
        </div>
      </div>

      {/* Footer & Functional Buttons */}
      <div className="pt-2">
        {isSelected && (
          <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30">
            <CheckCircle2 className="h-4 w-4" />
            <span>Policy Selected for Report</span>
          </div>
        )}

        {showActions && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                if (onViewPolicy) onViewPolicy(policy);
              }}
              className="border-slate-800 bg-[#091122] hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-[11px] font-semibold h-8 px-2"
            >
              View Policy
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                if (onGenerateReport) onGenerateReport(policy);
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[11px] font-bold h-8 px-2 shadow-sm shadow-blue-500/20"
            >
              Prepare Report
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                if (onTrackClaim) onTrackClaim(policy);
              }}
              className="border-slate-800 bg-[#091122] hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-[11px] font-semibold h-8 px-2"
            >
              Track Claim
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                if (onDownloadReceipt) onDownloadReceipt(policy);
              }}
              className="border-slate-800 bg-[#091122] hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-[11px] font-semibold h-8 px-2"
            >
              Receipt
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InsurancePolicyCard;
