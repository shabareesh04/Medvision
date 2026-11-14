import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ClaimStatusBadge } from './components/StatusBadge';
import ClaimTimeline from './components/ClaimTimeline';
import {
  ShieldCheck,
  Building2,
  Calendar,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Send,
  Banknote,
  FileQuestion,
  UserCheck,
  User,
  Stethoscope,
  Receipt,
  IndianRupee,
  ArrowRightLeft,
  DollarSign,
  Hash,
  CalendarCheck,
  Info,
  Bot,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const BASE_API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

/* ────────────────────────────────────────────────────────────────
   Valid status transitions (mirrors backend VALID_TRANSITIONS)
   Only transitions a reviewer would manually trigger are listed.
──────────────────────────────────────────────────────────────── */
const REVIEWER_TRANSITIONS = {
  SUBMITTED: ['UNDER_REVIEW'],
  UNDER_REVIEW: ['DOCUMENTS_REQUIRED', 'AWAITING_HOSPITAL_RESPONSE'],
  DOCUMENTS_RESUBMITTED: ['UNDER_REVIEW'],
  AWAITING_HOSPITAL_RESPONSE: ['UNDER_REVIEW'],
  APPROVED: ['PAYMENT_PROCESSING'],
  PARTIALLY_APPROVED: ['PAYMENT_PROCESSING'],
  PAYMENT_PROCESSING: ['SETTLED'],
};

const STATUS_LABELS = {
  UNDER_REVIEW: 'Move to Under Review',
  DOCUMENTS_REQUIRED: 'Request Documents',
  AWAITING_HOSPITAL_RESPONSE: 'Awaiting Hospital Response',
  PAYMENT_PROCESSING: 'Begin Payment Processing',
  SETTLED: 'Mark as Settled',
};

/* ────────────────────────────────────────────────────────────────
   Expense category labels
──────────────────────────────────────────────────────────────── */
const EXPENSE_LABELS = {
  consultation: 'Consultation Fees',
  diagnostic: 'Diagnostic / Lab Tests',
  hospitalization: 'Hospitalization Charges',
  surgery: 'Surgery / Procedure',
  medication: 'Medication Costs',
  other: 'Other Eligible Expenses',
};

/* ────────────────────────────────────────────────────────────────
   Collapsible Section helper
──────────────────────────────────────────────────────────────── */
const CollapsibleSection = ({ title, icon: Icon, iconColor = 'text-purple-400', badge, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-3xl bg-[#091122]/90 border border-slate-800/90 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 sm:p-6 text-left hover:bg-slate-800/20 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          {Icon && <Icon className={`h-4.5 w-4.5 ${iconColor}`} />}
          <h3 className="text-sm font-bold text-white">{title}</h3>
          {badge && <span className="ml-1.5 px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-300">{badge}</span>}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
      </button>
      {open && <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-4">{children}</div>}
    </div>
  );
};


const ReviewClaimPage = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Modal / Form state for decisions
  const [activeModal, setActiveModal] = useState(null); // 'APPROVE' | 'REJECT' | 'REQUEST_INFO' | 'SETTLE' | 'TRANSITION' | null
  const [reviewerComments, setReviewerComments] = useState('');

  // Approval specific
  const [approvalType, setApprovalType] = useState('FULL'); // 'FULL' | 'PARTIAL'
  const [approvedAmount, setApprovedAmount] = useState('');

  // Rejection specific
  const [rejectionReason, setRejectionReason] = useState('');

  // Settlement specific
  const [settlementRef, setSettlementRef] = useState('');
  const [paymentDate, setPaymentDate] = useState('');

  // Transition specific
  const [selectedTransition, setSelectedTransition] = useState('');

  // Request info specific
  const [requestedDocsNote, setRequestedDocsNote] = useState('');

  /* ── Is Reviewer Check ──────────────────────────────────── */
  const isReviewer = useMemo(() => {
    if (!user) return false;
    const role = (user.role || '').toUpperCase();
    const email = (user.email || '').toLowerCase();
    return role === 'INSURANCE_REVIEWER' || role === 'ADMIN' || email.includes('insurance') || email.includes('reviewer');
  }, [user]);

  /* ── Fetch claim detail ─────────────────────────────────── */
  const fetchClaim = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_API_URL}/insurance/claims/${id}`);
      setClaim(res.data);
    } catch (err) {
      console.error('Error fetching review claim:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaim();
  }, [id]);

  /* ── Available transitions for current status ───────────── */
  const availableTransitions = useMemo(() => {
    if (!claim) return [];
    return REVIEWER_TRANSITIONS[claim.status] || [];
  }, [claim]);

  /* ── Parse expense breakdown ────────────────────────────── */
  const expenses = useMemo(() => {
    if (!claim) return null;
    const raw = claim.expense_breakdown;
    if (!raw) return null;
    if (typeof raw === 'string') {
      try { return JSON.parse(raw); } catch { return null; }
    }
    return raw;
  }, [claim]);

  /* ── Reset modal state helper ───────────────────────────── */
  const openModal = (type) => {
    setActiveModal(type);
    setActionError('');
    setActionSuccess('');
    setReviewerComments('');
    setRejectionReason('');
    setApprovalType('FULL');
    setApprovedAmount(claim?.claim_amount?.toString() || '');
    setSettlementRef('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setSelectedTransition('');
    setRequestedDocsNote('');

    if (type === 'APPROVE') {
      setReviewerComments('Verified against hospital billing and medical diagnostic findings.');
    } else if (type === 'SETTLE') {
      setReviewerComments('Disbursed reimbursement to patient bank account.');
    }
  };

  /* ── Handle decision submission ─────────────────────────── */
  const handleDecision = async () => {
    if (!activeModal) return;
    setActionLoading(true);
    setActionError('');
    setActionSuccess('');

    try {
      const reviewerPayload = {
        reviewer_id: user?.email || 'reviewer@insurance.medivision.ai',
        reviewer_name: user?.name || 'Marcus Chen (Senior Claims Officer)',
        reviewer_role: 'INSURANCE_REVIEWER',
      };

      if (activeModal === 'APPROVE') {
        const isPartial = approvalType === 'PARTIAL';
        const amt = isPartial ? parseFloat(approvedAmount) : claim.claim_amount;
        if (isPartial && (!amt || amt <= 0 || amt > claim.claim_amount)) {
          setActionError('Partial approval amount must be between ₹1 and the total claimed amount.');
          setActionLoading(false);
          return;
        }
        const res = await axios.post(`${BASE_API_URL}/insurance/claims/${id}/approve`, {
          ...reviewerPayload,
          comments: reviewerComments || (isPartial ? `Partially approved ₹${amt.toLocaleString()} after medical review.` : 'Full claim approved.'),
          approved_amount: isPartial ? amt : null,
        });
        setActionSuccess(res.data.message || `Claim ${isPartial ? 'partially ' : ''}approved for ₹${(res.data.approved_amount || amt).toLocaleString()}.`);

      } else if (activeModal === 'REJECT') {
        const reason = rejectionReason.trim();
        if (reason.length < 5) {
          setActionError('Rejection reason is mandatory and must be at least 5 characters.');
          setActionLoading(false);
          return;
        }
        const res = await axios.post(`${BASE_API_URL}/insurance/claims/${id}/reject`, {
          ...reviewerPayload,
          comments: reason,
          rejection_reason: reason,
        });
        setActionSuccess(res.data.message || 'Claim rejected.');

      } else if (activeModal === 'REQUEST_INFO') {
        const note = requestedDocsNote.trim();
        if (!note) {
          setActionError('Please specify what documents or information are required.');
          setActionLoading(false);
          return;
        }
        const res = await axios.post(`${BASE_API_URL}/insurance/claims/${id}/request-information`, {
          ...reviewerPayload,
          comments: note,
          requested_documents_note: note,
        });
        setActionSuccess(res.data.message || 'Additional information requested.');

      } else if (activeModal === 'SETTLE') {
        const res = await axios.post(`${BASE_API_URL}/insurance/claims/${id}/settle`, {
          ...reviewerPayload,
          comments: reviewerComments || 'Settlement processed.',
          settlement_reference: settlementRef || undefined,
          payment_date: paymentDate || undefined,
        });
        setActionSuccess(res.data.message || `Claim settled. Ref: ${res.data.settlement_reference}`);

      } else if (activeModal === 'TRANSITION') {
        if (!selectedTransition) {
          setActionError('Please select a target status.');
          setActionLoading(false);
          return;
        }
        const res = await axios.post(`${BASE_API_URL}/insurance/reviewer/claims/${id}/transition-status`, {
          ...reviewerPayload,
          new_status: selectedTransition,
          comments: reviewerComments || `Transitioned to ${selectedTransition}.`,
        });
        setActionSuccess(res.data.message || `Status changed to ${selectedTransition}.`);
      }

      setActiveModal(null);
      fetchClaim();
    } catch (err) {
      console.error('Decision error:', err);
      setActionError(err.response?.data?.detail || 'Failed to submit decision.');
    } finally {
      setActionLoading(false);
    }
  };

  /* ── Loading state ──────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#060a14] text-white flex flex-col items-center justify-center p-4">
        <RefreshCw className="h-8 w-8 text-purple-400 animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-400">Loading claim review workspace...</p>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="min-h-screen bg-[#060a14] text-white flex flex-col items-center justify-center p-4 space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-sm font-bold text-slate-300">Claim not found.</p>
        <Button asChild size="sm" className="bg-purple-600 rounded-xl text-xs">
          <Link to="/admin/insurance/claims">Back to Claims Queue</Link>
        </Button>
      </div>
    );
  }

  /* ── Derived values ─────────────────────────────────────── */
  const canApproveReject = ['SUBMITTED', 'UNDER_REVIEW', 'DOCUMENTS_RESUBMITTED', 'AWAITING_HOSPITAL_RESPONSE'].includes(claim.status);
  const canSettle = ['APPROVED', 'PARTIALLY_APPROVED', 'PAYMENT_PROCESSING'].includes(claim.status);
  const canRequestInfo = ['SUBMITTED', 'UNDER_REVIEW', 'DOCUMENTS_RESUBMITTED', 'AWAITING_HOSPITAL_RESPONSE'].includes(claim.status);

  return (
    <div className="min-h-screen bg-[#060a14] text-white py-8 px-4 sm:px-6 lg:px-12 selection:bg-blue-500 selection:text-white">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ══ Role Protection Notice ══════════════════════════ */}
        {!isReviewer && (
          <div className="p-4 rounded-2xl bg-red-950/60 border border-red-600/40 text-red-200 text-xs flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-300">⚠ Unauthorized Access — Reviewer Role Required</p>
              <p className="text-[11px] text-red-200/80 mt-0.5 leading-relaxed">
                You are viewing this page in read-only mode. Only users with the <strong>INSURANCE_REVIEWER</strong> role
                can approve, reject, or transition claims. Switch to the reviewer demo account to test reviewer workflows.
              </p>
            </div>
          </div>
        )}

        {/* ══ Navigation Breadcrumb ═══════════════════════════ */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <Link
            to="/admin/insurance/claims"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#091122] hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-all border border-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-purple-400" />
            <span>Back to Reviewer Queue</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
            <span>Claims Queue</span>
            <span className="text-slate-600">/</span>
            <span className="text-purple-400 font-mono">{claim.claim_number}</span>
          </div>
        </div>

        {/* ══ Claim Review Header ═════════════════════════════ */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#091122]/95 border border-slate-800/90 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-mono font-extrabold text-white">
                  {claim.claim_number}
                </h1>
                <ClaimStatusBadge status={claim.status} />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Claimant: <strong className="text-white">{claim.patient_name}</strong> ({claim.patient_id})
                {claim.policyholder_name && claim.policyholder_name !== claim.patient_name && (
                  <span className="ml-2">| Policyholder: <strong className="text-blue-300">{claim.policyholder_name}</strong></span>
                )}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Submitted: {claim.submitted_at ? new Date(claim.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Draft'}
                {claim.claim_type && <span className="ml-2">• Type: <strong className="text-blue-400">{claim.claim_type}</strong></span>}
              </p>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span className="text-xs text-slate-400 block">Claim Amount Requested</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
                ₹{Number(claim.claim_amount).toLocaleString()}
              </span>
              {claim.approved_amount != null && claim.approved_amount > 0 && (
                <div className="text-xs">
                  <span className="text-slate-500">Approved: </span>
                  <span className={`font-bold ${claim.approved_amount < claim.claim_amount ? 'text-amber-400' : 'text-emerald-400'}`}>
                    ₹{Number(claim.approved_amount).toLocaleString()}
                  </span>
                  {claim.approved_amount < claim.claim_amount && (
                    <span className="text-red-400 ml-1 text-[10px]">
                      (−₹{(claim.claim_amount - claim.approved_amount).toLocaleString()} deducted)
                    </span>
                  )}
                </div>
              )}
              <span className="block text-[11px] text-slate-500">{claim.claim_type} Settlement</span>
            </div>
          </div>

          {/* Documents Pending Advisory Notice if 0 files */}
          {(!claim.documents || claim.documents.length === 0) && (
            <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-300">No Supporting Medical Documents Attached (0 Files)</p>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                  The claimant has not uploaded hospital invoices or diagnostic scan reports yet. It is recommended to use <strong>Request More Info</strong> to prompt the patient for bills prior to final claim approval.
                </p>
              </div>
            </div>
          )}

          {/* ── Adjudication Action Bar ─────────────────────── */}
          {isReviewer && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#060a14] border border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-purple-400" />
                <span className="text-xs font-bold text-slate-200">Reviewer Decisions (Human Action):</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {canApproveReject && (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => openModal('APPROVE')}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl gap-1"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Approve Claim</span>
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => openModal('REJECT')}
                      className="bg-red-600/20 border border-red-500/40 hover:bg-red-600/40 text-red-300 text-xs font-bold rounded-xl gap-1"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Reject Claim</span>
                    </Button>
                  </>
                )}

                {canRequestInfo && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => openModal('REQUEST_INFO')}
                    className="border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold rounded-xl gap-1"
                  >
                    <FileQuestion className="h-3.5 w-3.5" />
                    <span>Request More Info</span>
                  </Button>
                )}

                {canSettle && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => openModal('SETTLE')}
                    className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl gap-1"
                  >
                    <Banknote className="h-3.5 w-3.5" />
                    <span>Mark Settled</span>
                  </Button>
                )}

                {availableTransitions.length > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => openModal('TRANSITION')}
                    className="border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-xs font-bold rounded-xl gap-1"
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5" />
                    <span>Change Status</span>
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* ── Success / Error feedback ────────────────────── */}
          {actionSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {actionError && !activeModal && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span>{actionError}</span>
            </div>
          )}
        </div>

        {/* ══ Action Modal Dialog ═════════════════════════════ */}
        {activeModal && (
          <div className="p-6 rounded-3xl bg-[#091122] border border-purple-500/40 shadow-2xl space-y-5 animate-in fade-in duration-150">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Confirm Decision:</span>
              <span className="text-purple-400 font-extrabold">{activeModal === 'REQUEST_INFO' ? 'REQUEST DOCUMENTS' : activeModal}</span>
            </h3>

            {/* ── APPROVE MODAL ─────────────────────────────── */}
            {activeModal === 'APPROVE' && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="approvalType"
                      value="FULL"
                      checked={approvalType === 'FULL'}
                      onChange={() => { setApprovalType('FULL'); setApprovedAmount(claim.claim_amount.toString()); }}
                      className="accent-emerald-500"
                    />
                    <span className="font-semibold text-emerald-300">Full Approval (₹{Number(claim.claim_amount).toLocaleString()})</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="approvalType"
                      value="PARTIAL"
                      checked={approvalType === 'PARTIAL'}
                      onChange={() => setApprovalType('PARTIAL')}
                      className="accent-amber-500"
                    />
                    <span className="font-semibold text-amber-300">Partial Approval</span>
                  </label>
                </div>

                {approvalType === 'PARTIAL' && (
                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-xs font-semibold">Approved Amount (₹) *</Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                      <Input
                        type="number"
                        step="0.01"
                        min="1"
                        max={claim.claim_amount}
                        value={approvedAmount}
                        onChange={(e) => setApprovedAmount(e.target.value)}
                        className="pl-8 bg-[#060a14] border-slate-800 text-white text-xs rounded-xl focus:border-purple-500"
                        placeholder="Enter approved amount..."
                      />
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Maximum claimable: ₹{Number(claim.claim_amount).toLocaleString()}
                      {approvedAmount && parseFloat(approvedAmount) < claim.claim_amount && (
                        <span className="text-amber-400 ml-2">
                          Deduction: ₹{(claim.claim_amount - parseFloat(approvedAmount)).toLocaleString()}
                        </span>
                      )}
                    </p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-xs font-semibold">Reviewer Comments:</Label>
                  <textarea
                    rows={3}
                    value={reviewerComments}
                    onChange={(e) => setReviewerComments(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#060a14] border border-slate-800 text-white text-xs focus:border-purple-500 focus:outline-none"
                    placeholder="Enter approval remarks..."
                  />
                </div>
              </div>
            )}

            {/* ── REJECT MODAL ──────────────────────────────── */}
            {activeModal === 'REJECT' && (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-[11px] text-red-300 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <span>A mandatory rejection reason is required (minimum 5 characters). The reason will be visible to the patient and recorded in the audit trail.</span>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-red-300 text-xs font-bold">Rejection Reason / Justification *</Label>
                  <textarea
                    rows={4}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className={`w-full p-3 rounded-xl bg-[#060a14] border text-white text-xs focus:outline-none ${
                      rejectionReason.trim().length > 0 && rejectionReason.trim().length < 5
                        ? 'border-red-500 focus:border-red-400'
                        : 'border-slate-800 focus:border-purple-500'
                    }`}
                    placeholder="Specify the exact reason, missing documents, policy exclusion clause, or medical non-eligibility..."
                  />
                  <div className="flex items-center justify-between text-[10px]">
                    <span className={`${rejectionReason.trim().length >= 5 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {rejectionReason.trim().length}/5 characters minimum
                    </span>
                    {rejectionReason.trim().length >= 5 && (
                      <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Valid</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── REQUEST INFO MODAL ────────────────────────── */}
            {activeModal === 'REQUEST_INFO' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-amber-300 text-xs font-bold">Specify Required Documents / Information *</Label>
                  <textarea
                    rows={4}
                    value={requestedDocsNote}
                    onChange={(e) => setRequestedDocsNote(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#060a14] border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                    placeholder="E.g., Please upload itemized hospital bill with GST breakdown, discharge summary signed by treating physician, and original payment receipts..."
                  />
                </div>
              </div>
            )}

            {/* ── SETTLE MODAL ──────────────────────────────── */}
            {activeModal === 'SETTLE' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-xs font-semibold flex items-center gap-1.5">
                      <Hash className="h-3 w-3 text-teal-400" />
                      Settlement Reference Number
                    </Label>
                    <Input
                      type="text"
                      value={settlementRef}
                      onChange={(e) => setSettlementRef(e.target.value)}
                      className="bg-[#060a14] border-slate-800 text-white text-xs rounded-xl focus:border-teal-500"
                      placeholder="E.g., NEFT-2026101300123 or auto-generated"
                    />
                    <p className="text-[10px] text-slate-500">Leave blank to auto-generate a reference number.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-xs font-semibold flex items-center gap-1.5">
                      <CalendarCheck className="h-3 w-3 text-teal-400" />
                      Payment Date
                    </Label>
                    <Input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="bg-[#060a14] border-slate-800 text-white text-xs rounded-xl focus:border-teal-500"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-xs font-semibold">Settlement Notes:</Label>
                  <textarea
                    rows={2}
                    value={reviewerComments}
                    onChange={(e) => setReviewerComments(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#060a14] border border-slate-800 text-white text-xs focus:border-teal-500 focus:outline-none"
                    placeholder="E.g., Amount disbursed via NEFT to patient bank account..."
                  />
                </div>
                <div className="p-3 rounded-xl bg-teal-950/40 border border-teal-800/50 text-[11px] text-teal-200 flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-teal-400 shrink-0" />
                  <span>
                    Settlement amount: <strong>₹{Number(claim.approved_amount || claim.claim_amount).toLocaleString()}</strong>
                    {' '}— This action will mark the claim as <strong>SETTLED</strong> and record the payment reference.
                  </span>
                </div>
              </div>
            )}

            {/* ── TRANSITION MODAL ──────────────────────────── */}
            {activeModal === 'TRANSITION' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-blue-300 text-xs font-bold">Select Target Status *</Label>
                  <div className="flex flex-wrap gap-2">
                    {availableTransitions.map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setSelectedTransition(st)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                          selectedTransition === st
                            ? 'bg-blue-600/30 border-blue-500 text-blue-200 ring-1 ring-blue-500/50'
                            : 'bg-[#060a14] border-slate-800 text-slate-300 hover:border-blue-500/50 hover:text-blue-300'
                        }`}
                      >
                        {STATUS_LABELS[st] || st}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-xs font-semibold">Transition Comments:</Label>
                  <textarea
                    rows={2}
                    value={reviewerComments}
                    onChange={(e) => setReviewerComments(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#060a14] border border-slate-800 text-white text-xs focus:border-blue-500 focus:outline-none"
                    placeholder="Reason for status change..."
                  />
                </div>
              </div>
            )}

            {/* ── Modal error feedback ──────────────────────── */}
            {actionError && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <span>{actionError}</span>
              </div>
            )}

            {/* ── Modal action buttons ──────────────────────── */}
            <div className="flex items-center justify-end gap-2 text-xs pt-2 border-t border-slate-800/60">
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setActiveModal(null); setActionError(''); }}
                className="text-slate-400 hover:text-white rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={actionLoading}
                onClick={handleDecision}
                className={`font-bold rounded-xl px-5 text-white ${
                  activeModal === 'REJECT' ? 'bg-red-600 hover:bg-red-500' :
                  activeModal === 'SETTLE' ? 'bg-teal-600 hover:bg-teal-500' :
                  activeModal === 'TRANSITION' ? 'bg-blue-600 hover:bg-blue-500' :
                  'bg-purple-600 hover:bg-purple-500'
                }`}
              >
                {actionLoading ? (
                  <span className="flex items-center gap-1.5"><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Processing...</span>
                ) : (
                  'Confirm Decision'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ══ Claim Timeline ══════════════════════════════════ */}
        <CollapsibleSection title="Claim Progress Timeline" icon={Clock} iconColor="text-blue-400">
          <ClaimTimeline status={claim.status} />
        </CollapsibleSection>

        {/* ══ Patient & Treatment Details ═════════════════════ */}
        <CollapsibleSection title="Patient & Treatment Information" icon={User} iconColor="text-emerald-400">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <InfoField label="Patient Name" value={claim.patient_name} />
            <InfoField label="Patient ID" value={claim.patient_id} mono />
            {claim.patient_id_number && <InfoField label="ID Number" value={claim.patient_id_number} mono />}
            {claim.policyholder_name && <InfoField label="Policyholder" value={claim.policyholder_name} />}
            <InfoField label="Hospital / Clinic" value={claim.hospital_name} icon={<Building2 className="h-3 w-3 text-blue-400" />} />
            <InfoField label="Treating Doctor" value={claim.doctor_name} icon={<Stethoscope className="h-3 w-3 text-emerald-400" />} />
            <InfoField label="Treatment Type" value={claim.treatment_type} />
            <InfoField label="Diagnosis" value={claim.diagnosis_reference || claim.diagnosis || 'N/A'} />
            <InfoField label="Treatment Date" value={claim.treatment_date} icon={<Calendar className="h-3 w-3 text-purple-400" />} />
            {claim.admission_date && <InfoField label="Admission Date" value={claim.admission_date} icon={<Calendar className="h-3 w-3 text-blue-400" />} />}
            {claim.discharge_date && <InfoField label="Discharge Date" value={claim.discharge_date} icon={<Calendar className="h-3 w-3 text-green-400" />} />}
            <InfoField label="Claim Type" value={claim.claim_type} highlight />
          </div>
          {claim.description && (
            <div className="mt-3 p-3 rounded-xl bg-[#060a14] border border-slate-800 text-xs text-slate-300">
              <span className="text-[10px] text-slate-500 block mb-1">Treatment Description:</span>
              {claim.description}
            </div>
          )}
        </CollapsibleSection>

        {/* ══ Policy Information ══════════════════════════════ */}
        {claim.policy && (
          <CollapsibleSection title="Linked Insurance Policy" icon={ShieldCheck} iconColor="text-indigo-400" defaultOpen={false}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <InfoField label="Insurance Provider" value={claim.policy.insurance_company || claim.policy.provider} />
              <InfoField label="Policy Number" value={claim.policy.policy_number} mono />
              <InfoField label="Policy Type" value={claim.policy.policy_type} />
              <InfoField label="Sum Insured" value={`₹${Number(claim.policy.sum_insured || claim.policy.coverage_amount || 0).toLocaleString()}`} highlight />
              <InfoField label="Remaining Coverage" value={`₹${Number(claim.policy.remaining_coverage || 0).toLocaleString()}`} />
              <InfoField label="Deductible" value={`₹${Number(claim.policy.deductible || 0).toLocaleString()}`} />
              <InfoField label="Co-payment" value={`${claim.policy.copay_percentage || 0}%`} />
              <InfoField label="Valid From" value={claim.policy.start_date} />
              <InfoField label="Valid Until" value={claim.policy.end_date} />
            </div>
          </CollapsibleSection>
        )}

        {/* ══ Itemized Expense Breakdown ══════════════════════ */}
        <CollapsibleSection title="Itemized Expense Breakdown" icon={Receipt} iconColor="text-emerald-400" badge={expenses ? `₹${Number(expenses.total || 0).toLocaleString()}` : null}>
          {expenses ? (
            <div className="space-y-3">
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#060a14]">
                      <th className="text-left px-4 py-2.5 text-slate-400 font-semibold border-b border-slate-800">Category</th>
                      <th className="text-right px-4 py-2.5 text-slate-400 font-semibold border-b border-slate-800">Amount (₹)</th>
                      <th className="text-right px-4 py-2.5 text-slate-400 font-semibold border-b border-slate-800">% of Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(EXPENSE_LABELS).map(([key, label]) => {
                      const amount = parseFloat(expenses[key] || 0);
                      const total = parseFloat(expenses.total || 1);
                      const pct = total > 0 ? ((amount / total) * 100).toFixed(1) : '0.0';
                      return (
                        <tr key={key} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                          <td className="px-4 py-2.5 text-slate-200 font-medium">{label}</td>
                          <td className="text-right px-4 py-2.5 font-mono text-white">
                            {amount > 0 ? `₹${amount.toLocaleString()}` : <span className="text-slate-600">—</span>}
                          </td>
                          <td className="text-right px-4 py-2.5 text-slate-400">
                            {amount > 0 ? (
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" style={{ width: `${Math.min(100, parseFloat(pct))}%` }} />
                                </div>
                                <span>{pct}%</span>
                              </div>
                            ) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#060a14]">
                      <td className="px-4 py-3 text-white font-bold border-t border-slate-700">Total Claimed</td>
                      <td className="text-right px-4 py-3 font-mono font-extrabold text-emerald-400 border-t border-slate-700">
                        ₹{Number(expenses.total || 0).toLocaleString()}
                      </td>
                      <td className="text-right px-4 py-3 text-emerald-400 font-bold border-t border-slate-700">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Financial eligibility summary if available */}
              {claim.eligibility_summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <MiniStat label="Coverage Remaining" value={`₹${Number(claim.eligibility_summary.remaining_coverage || 0).toLocaleString()}`} color="text-blue-400" />
                  <MiniStat label="Deductible" value={`₹${Number(claim.eligibility_summary.deductible || 0).toLocaleString()}`} color="text-amber-400" />
                  <MiniStat label="Est. Payable" value={`₹${Number(claim.eligibility_summary.estimated_payable || 0).toLocaleString()}`} color="text-emerald-400" />
                  <MiniStat label="Patient Responsibility" value={`₹${Number(claim.eligibility_summary.estimated_patient_responsibility || 0).toLocaleString()}`} color="text-red-400" />
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No itemized expense breakdown available for this claim.</p>
          )}
        </CollapsibleSection>

        {/* ══ AI Claim Summary & Consistency Warnings ════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* AI Summary */}
          <CollapsibleSection title="AI Synthesized Claim Summary" icon={Sparkles} iconColor="text-blue-400" defaultOpen={true}>
            <p className="text-xs text-slate-300 leading-relaxed">
              {claim.ai_summary || 'AI Summary is generated upon claim submission and document analysis.'}
            </p>
            {claim.is_ai_report_attached && (
              <div className="mt-3 p-3 rounded-xl bg-blue-950/40 border border-blue-800/50 text-[11px] text-blue-200 flex items-start gap-2">
                <Bot className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-blue-300">MedVision AI Diagnosis Report Attached</p>
                  {claim.ai_report_summary && <p className="text-blue-200/80 mt-0.5">{claim.ai_report_summary}</p>}
                  <p className="text-[10px] text-blue-300/60 mt-1 italic">
                    ⚠ AI-generated preliminary analysis — not a substitute for a signed report from a qualified healthcare professional.
                  </p>
                </div>
              </div>
            )}
          </CollapsibleSection>

          {/* Consistency Checks */}
          <CollapsibleSection title="Administrative Consistency Check" icon={AlertTriangle} iconColor="text-amber-400" defaultOpen={true}>
            {claim.consistency_issues?.length > 0 ? (
              <ul className="list-disc ml-4 text-xs text-amber-300/90 space-y-1">
                {claim.consistency_issues.map((iss, i) => (
                  <li key={i}>{iss}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                <span>No administrative discrepancies detected between claim form and uploaded bills.</span>
              </p>
            )}
          </CollapsibleSection>
        </div>

        {/* ══ Settlement Information (if settled) ════════════ */}
        {(claim.status === 'SETTLED' || claim.settlement_reference) && (
          <CollapsibleSection title="Settlement & Payment Record" icon={Banknote} iconColor="text-teal-400">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <InfoField label="Settlement Reference" value={claim.settlement_reference || 'N/A'} mono highlight />
              <InfoField label="Payment Date" value={claim.payment_date || 'N/A'} />
              <InfoField label="Settlement Amount" value={`₹${Number(claim.approved_amount || claim.claim_amount).toLocaleString()}`} />
              <InfoField label="Settled At" value={claim.settled_at ? new Date(claim.settled_at).toLocaleString() : 'N/A'} />
            </div>
          </CollapsibleSection>
        )}

        {/* ══ Rejection Details (if rejected) ════════════════ */}
        {claim.status === 'REJECTED' && claim.rejection_reason && (
          <div className="p-5 rounded-3xl bg-red-950/30 border border-red-800/50 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-red-300">
              <XCircle className="h-4 w-4 text-red-400" />
              <span>Rejection Reason</span>
            </div>
            <p className="text-xs text-red-200/90 leading-relaxed">{claim.rejection_reason}</p>
            {claim.reviewer_name && (
              <p className="text-[10px] text-red-400/60">
                Rejected by: {claim.reviewer_name} • {claim.reviewed_at ? new Date(claim.reviewed_at).toLocaleString() : ''}
              </p>
            )}
          </div>
        )}

        {/* ══ Uploaded Documents & AI Extracted Fields ════════ */}
        <CollapsibleSection
          title="Uploaded Evidence & AI Line-Item Extractions"
          icon={FileText}
          iconColor="text-emerald-400"
          badge={`${claim.documents?.length || 0} files`}
        >
          <div className="space-y-3">
            {claim.documents?.length > 0 ? claim.documents.map((doc) => {
              const data = doc.ai_extracted_data || {};
              return (
                <div key={doc.id} className="p-4 rounded-2xl bg-[#060a14] border border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-bold text-white">{doc.original_filename}</p>
                        <p className="text-[10px] text-slate-500">{doc.document_type} • {(doc.file_size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>

                    <a
                      href={`${BASE_API_URL}/insurance/documents/${doc.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                    >
                      <Download className="h-3.5 w-3.5 text-blue-400" />
                      <span>Inspect File</span>
                    </a>
                  </div>

                  {/* Extracted Fields Table */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Patient Name on Doc</span>
                      <span className="font-semibold text-slate-200">{data.patient_name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Hospital / Clinic</span>
                      <span className="font-semibold text-slate-200">{data.hospital_name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Bill / Invoice #</span>
                      <span className="font-mono text-slate-200">{data.bill_number || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Extracted Amount</span>
                      <span className="font-bold text-emerald-400">{data.total_amount ? `₹${Number(data.total_amount).toLocaleString()}` : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <p className="text-xs text-slate-500 italic">No documents uploaded for this claim.</p>
            )}
          </div>
        </CollapsibleSection>

        {/* ══ Audit Log Trail ═════════════════════════════════ */}
        <CollapsibleSection
          title="Adjudication Audit Trail"
          icon={UserCheck}
          iconColor="text-purple-400"
          badge={`${claim.audit_logs?.length || 0} events`}
        >
          <div className="space-y-2">
            {claim.audit_logs?.length > 0 ? claim.audit_logs.map((log) => (
              <div key={log.id} className="p-3 rounded-xl bg-[#060a14] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                <div>
                  <span className="font-bold text-purple-300">{log.action}</span>
                  <span className="text-slate-400 ml-2">by {log.user_name || log.user_id} ({log.user_role})</span>
                  {log.old_status && log.new_status && (
                    <span className="ml-2 text-slate-500">
                      {log.old_status} → <span className="text-blue-400">{log.new_status}</span>
                    </span>
                  )}
                  {log.comments && <p className="text-slate-400 mt-0.5 leading-relaxed">{log.comments}</p>}
                </div>
                <span className="text-slate-500 font-mono text-[10px] shrink-0">{log.created_at ? new Date(log.created_at).toLocaleString() : ''}</span>
              </div>
            )) : (
              <p className="text-xs text-slate-500 italic">No audit events recorded yet.</p>
            )}
          </div>
        </CollapsibleSection>

      </div>
    </div>
  );
};

/* ── Reusable InfoField Component ─────────────────────────── */
const InfoField = ({ label, value, icon, mono, highlight }) => (
  <div className="p-3 rounded-xl bg-[#060a14] border border-slate-800/60">
    <span className="text-[10px] text-slate-500 block mb-0.5 flex items-center gap-1">
      {icon}
      {label}
    </span>
    <span className={`text-xs font-semibold ${highlight ? 'text-blue-300' : 'text-slate-200'} ${mono ? 'font-mono' : ''}`}>
      {value || 'N/A'}
    </span>
  </div>
);

/* ── Reusable MiniStat Component ──────────────────────────── */
const MiniStat = ({ label, value, color = 'text-white' }) => (
  <div className="p-3 rounded-xl bg-[#060a14] border border-slate-800/60 text-center">
    <span className="text-[10px] text-slate-500 block">{label}</span>
    <span className={`text-sm font-bold ${color}`}>{value}</span>
  </div>
);

export default ReviewClaimPage;
