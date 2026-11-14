import React from 'react';
import { 
  FilePlus, 
  UploadCloud, 
  Send, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Banknote,
  AlertCircle,
  Clock
} from 'lucide-react';

const ClaimTimeline = ({ status, submittedAt, reviewedAt, settledAt }) => {
  const isCancelled = status === 'CANCELLED';
  const isRejected = status === 'REJECTED';
  const isDocReq = status === 'DOCUMENTS_REQUIRED' || status === 'MORE_INFORMATION_REQUIRED';
  const isDocResub = status === 'DOCUMENTS_RESUBMITTED';
  const isHospWait = status === 'AWAITING_HOSPITAL_RESPONSE';
  const isApproved = status === 'APPROVED' || status === 'PARTIALLY_APPROVED';
  const isProcessing = status === 'PAYMENT_PROCESSING';
  const isSettled = status === 'SETTLED';

  const steps = [
    {
      key: 'DRAFT',
      title: 'Claim Created',
      description: 'Draft details initiated',
      icon: FilePlus,
      isCompleted: status !== 'DRAFT',
      isActive: status === 'DRAFT'
    },
    {
      key: 'SUBMITTED',
      title: 'Submitted',
      description: submittedAt ? new Date(submittedAt).toLocaleDateString() : 'Claim lodged by patient',
      icon: Send,
      isCompleted: status !== 'DRAFT' && status !== 'SUBMITTED',
      isActive: status === 'SUBMITTED'
    },
    {
      key: 'REVIEW',
      title: isDocReq ? 'Docs Required' : isDocResub ? 'Docs Resubmitted' : isHospWait ? 'Hospital Response' : 'Under Review',
      description: isDocReq ? 'Reviewer requested docs' : isDocResub ? 'Awaiting re-check' : isHospWait ? 'Awaiting hospital' : 'Adjudication in progress',
      icon: isDocReq ? AlertCircle : Search,
      isCompleted: isApproved || isRejected || isProcessing || isSettled,
      isActive: status === 'UNDER_REVIEW' || isDocReq || isDocResub || isHospWait,
      isWarning: isDocReq
    },
    {
      key: 'DECISION',
      title: isRejected ? 'Rejected' : status === 'PARTIALLY_APPROVED' ? 'Partially Approved' : 'Approved',
      description: reviewedAt ? new Date(reviewedAt).toLocaleDateString() : (isRejected ? 'Claim rejected' : 'Reviewer decision'),
      icon: isRejected ? XCircle : CheckCircle2,
      isCompleted: isApproved || isRejected || isProcessing || isSettled,
      isActive: isApproved || isRejected,
      isError: isRejected
    },
    {
      key: 'PAYMENT',
      title: 'Payment Processing',
      description: isProcessing ? 'Bank disbursement initiated' : 'Disbursement queue',
      icon: Clock,
      isCompleted: isSettled,
      isActive: isProcessing
    },
    {
      key: 'SETTLED',
      title: isCancelled ? 'Cancelled' : 'Settled',
      description: settledAt ? new Date(settledAt).toLocaleDateString() : (isCancelled ? 'Claim terminated' : 'Reimbursement disbursed'),
      icon: Banknote,
      isCompleted: isSettled || isCancelled,
      isActive: isSettled || isCancelled,
      isError: isCancelled
    }
  ];

  return (
    <div className="w-full py-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {steps.map((step) => {
          const Icon = step.icon;
          let circleBg = 'bg-slate-900 border-slate-800 text-slate-500';
          let textColor = 'text-slate-400';

          if (step.isCompleted) {
            circleBg = 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400';
            textColor = 'text-white';
          } else if (step.isActive) {
            circleBg = 'bg-blue-600/20 border-blue-500/60 text-blue-400 animate-pulse';
            textColor = 'text-blue-300 font-semibold';
          }

          if (step.isWarning && step.isActive) {
            circleBg = 'bg-amber-500/20 border-amber-500/60 text-amber-400 animate-pulse';
            textColor = 'text-amber-300 font-semibold';
          } else if (step.isError) {
            circleBg = 'bg-red-500/20 border-red-500/60 text-red-400';
            textColor = 'text-red-300 font-semibold';
          }

          return (
            <div
              key={step.key}
              className="flex flex-col items-center text-center p-3 rounded-2xl bg-[#091122]/60 border border-slate-800/60 relative"
            >
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-2.5 ${circleBg}`}>
                <Icon className="h-5 w-5" />
              </div>
              <h4 className={`text-xs font-bold ${textColor}`}>
                {step.title}
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ClaimTimeline;
