import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle, 
  FileText, 
  HelpCircle, 
  CheckCheck,
  ShieldCheck
} from 'lucide-react';

export const ClaimStatusBadge = ({ status }) => {
  switch (status) {
    case 'DRAFT':
    case 'DOCUMENTS_PENDING':
    case 'READY_TO_SUBMIT':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
          <FileText className="h-3.5 w-3.5 text-slate-400" />
          <span>Draft</span>
        </span>
      );
    case 'SUBMITTED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
          <Clock className="h-3.5 w-3.5 text-blue-400 animate-pulse" />
          <span>Submitted</span>
        </span>
      );
    case 'UNDER_REVIEW':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
          <Clock className="h-3.5 w-3.5 text-purple-400 animate-spin" />
          <span>Under Review</span>
        </span>
      );
    case 'DOCUMENTS_REQUIRED':
    case 'MORE_INFORMATION_REQUIRED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
          <span>Documents Required</span>
        </span>
      );
    case 'DOCUMENTS_RESUBMITTED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
          <Clock className="h-3.5 w-3.5 text-cyan-400" />
          <span>Docs Resubmitted</span>
        </span>
      );
    case 'AWAITING_HOSPITAL_RESPONSE':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
          <Clock className="h-3.5 w-3.5 text-indigo-400" />
          <span>Awaiting Hospital Response</span>
        </span>
      );
    case 'APPROVED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          <span>Approved</span>
        </span>
      );
    case 'PARTIALLY_APPROVED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-lime-500/15 text-lime-400 border border-lime-500/30">
          <CheckCheck className="h-3.5 w-3.5 text-lime-400" />
          <span>Partially Approved</span>
        </span>
      );
    case 'REJECTED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
          <XCircle className="h-3.5 w-3.5 text-red-400" />
          <span>Rejected</span>
        </span>
      );
    case 'PAYMENT_PROCESSING':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30">
          <Clock className="h-3.5 w-3.5 text-sky-400 animate-pulse" />
          <span>Payment Processing</span>
        </span>
      );
    case 'SETTLED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-500/15 text-teal-300 border border-teal-500/30">
          <CheckCheck className="h-3.5 w-3.5 text-teal-400" />
          <span>Settled</span>
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
          <XCircle className="h-3.5 w-3.5 text-slate-500" />
          <span>Cancelled</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
          <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
          <span>{status || 'Draft'}</span>
        </span>
      );
  }
};

export const PolicyStatusBadge = ({ status }) => {
  if (status === 'ACTIVE') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
        <ShieldCheck className="h-3 w-3 text-emerald-400" />
        <span>Active</span>
      </span>
    );
  } else if (status === 'EXPIRED') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
        <AlertCircle className="h-3 w-3 text-red-400" />
        <span>Expired</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
      <span>{status || 'Pending'}</span>
    </span>
  );
};
