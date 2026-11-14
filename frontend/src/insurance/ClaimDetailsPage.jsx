import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ClaimStatusBadge, PolicyStatusBadge } from './components/StatusBadge';
import ClaimTimeline from './components/ClaimTimeline';
import { maskPolicyNumber } from './components/InsurancePolicyCard';
import {
  Shield,
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
  UploadCloud,
  RefreshCw,
  Home,
  MessageSquare,
  FileCheck,
  Receipt,
  Banknote,
  Send,
  X,
  Info,
  CheckCheck,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

const BASE_API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const ClaimDetailsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Supplementary document upload (for DOCUMENTS_REQUIRED)
  const [suppFile, setSuppFile] = useState(null);
  const [suppDocType, setSuppDocType] = useState('HOSPITAL_BILL');
  const [suppNotes, setSuppNotes] = useState('');
  const [suppLoading, setSuppLoading] = useState(false);
  const [suppSuccess, setSuppSuccess] = useState('');

  // Appeal Modal (for REJECTED claims)
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealNotes, setAppealNotes] = useState('');
  const [appealLoading, setAppealLoading] = useState(false);
  const [appealSuccess, setAppealSuccess] = useState('');

  // Receipt Modal
  const [receiptData, setReceiptData] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);

  const fetchClaimDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${BASE_API_URL}/insurance/claims/${id}`);
      setClaim(res.data);
    } catch (err) {
      console.error('Error fetching claim details:', err);
      setError('Could not load claim information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaimDetails();
  }, [id]);

  // Handle uploading supplementary document and resubmitting
  const handleResubmitDocuments = async (e) => {
    e.preventDefault();
    if (!suppFile && !suppNotes.trim()) {
      alert('Please select a file or provide an explanatory response note.');
      return;
    }

    setSuppLoading(true);
    setSuppSuccess('');

    try {
      if (suppFile) {
        const formData = new FormData();
        formData.append('file', suppFile);
        formData.append('document_type', suppDocType);
        formData.append('uploaded_by', user?.name || claim.patient_name || 'Patient');

        await axios.post(`${BASE_API_URL}/insurance/claims/${id}/documents`, formData);
      }

      // Transition claim status to DOCUMENTS_RESUBMITTED
      await axios.post(`${BASE_API_URL}/insurance/claims/${id}/resubmit-documents`, {
        notes: suppNotes || 'Patient uploaded requested supplementary documents.',
        patient_id: user?.email || claim.patient_id
      });

      setSuppSuccess('Documents resubmitted successfully! Your claim has been returned to the reviewer queue.');
      setSuppFile(null);
      setSuppNotes('');
      fetchClaimDetails();
    } catch (err) {
      console.error('Error resubmitting documents:', err);
      alert(err.response?.data?.detail || 'Failed to resubmit documents.');
    } finally {
      setSuppLoading(false);
    }
  };

  // Handle submitting an appeal for rejected claims
  const handleAppealSubmit = async (e) => {
    e.preventDefault();
    if (!appealNotes.trim() || appealNotes.trim().length < 10) {
      alert('Please provide a detailed clinical or billing justification for your appeal (minimum 10 characters).');
      return;
    }

    setAppealLoading(true);
    try {
      await axios.post(`${BASE_API_URL}/insurance/claims/${id}/appeal`, {
        appeal_notes: appealNotes,
        patient_id: user?.email || claim.patient_id,
        patient_name: user?.name || claim.patient_name
      });

      setAppealSuccess('Appeal registered! The adjudication team will re-evaluate your claim.');
      setShowAppealModal(false);
      setAppealNotes('');
      fetchClaimDetails();
    } catch (err) {
      console.error('Error submitting appeal:', err);
      alert(err.response?.data?.detail || 'Failed to submit appeal.');
    } finally {
      setAppealLoading(false);
    }
  };

  // Handle claim cancellation (draft or submitted)
  const handleCancelClaim = async () => {
    if (!window.confirm('Are you sure you want to cancel this insurance claim? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.post(`${BASE_API_URL}/insurance/claims/${id}/cancel`);
      fetchClaimDetails();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to cancel claim.');
    }
  };

  // Handle fetching receipt
  const handleOpenReceipt = async () => {
    setReceiptLoading(true);
    try {
      const res = await axios.get(`${BASE_API_URL}/insurance/claims/${id}/receipt`);
      setReceiptData(res.data);
      setShowReceiptModal(true);
    } catch (err) {
      console.error('Error fetching receipt:', err);
      alert('Could not generate receipt.');
    } finally {
      setReceiptLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060a14] text-white flex flex-col items-center justify-center p-4">
        <RefreshCw className="h-8 w-8 text-blue-400 animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-400">Loading claim tracking file...</p>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="min-h-screen bg-[#060a14] text-white flex flex-col items-center justify-center p-4 space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-sm font-bold text-slate-300">Claim record not found.</p>
        <Button asChild size="sm" className="bg-blue-600 rounded-xl text-xs">
          <Link to="/insurance">Back to Insurance Dashboard</Link>
        </Button>
      </div>
    );
  }

  const isDocRequired = claim.status === 'DOCUMENTS_REQUIRED' || claim.status === 'MORE_INFORMATION_REQUIRED';
  const isRejected = claim.status === 'REJECTED';
  const isCancellable = claim.status === 'DRAFT' || claim.status === 'SUBMITTED';

  return (
    <div className="min-h-screen bg-[#060a14] text-white py-8 px-4 sm:px-6 lg:px-12 selection:bg-blue-500 selection:text-white">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
            <Link
              to="/insurance"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#091122] hover:bg-slate-800 text-slate-300 hover:text-white transition-all border border-slate-800"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-blue-400" />
              <span>Back to Insurance Portal</span>
            </Link>
            <span className="text-slate-600">/</span>
            <span className="font-mono text-blue-300 font-bold">{claim.claim_number}</span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenReceipt}
              disabled={receiptLoading}
              className="border-slate-800 bg-[#091122] hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold gap-1.5 h-8"
            >
              <Receipt className="h-3.5 w-3.5 text-teal-400" />
              <span>Download Receipt</span>
            </Button>

            {isCancellable && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancelClaim}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs rounded-xl h-8"
              >
                Cancel Claim
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {appealSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{appealSuccess}</span>
          </div>
        )}

        {/* Claim Top Overview Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-950/40 via-[#091122] to-indigo-950/40 border border-blue-500/20 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xl sm:text-2xl font-extrabold text-blue-300">
                  {claim.claim_number}
                </span>
                <ClaimStatusBadge status={claim.status} />
              </div>
              <p className="text-xs sm:text-sm text-slate-300">
                <strong>{claim.treatment_type}</strong> at {claim.hospital_name} by {claim.doctor_name}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                <span>Policy: <strong className="text-white">{claim.policy?.insurance_company}</strong></span>
                <span>Type: <strong className="text-white uppercase">{claim.claim_type}</strong></span>
                <span>Date: <strong className="text-white">{claim.treatment_date}</strong></span>
                {claim.is_ai_report_attached && (
                  <span className="inline-flex items-center gap-1 text-purple-400 font-bold">
                    <Sparkles className="h-3 w-3" /> AI Report Linked
                  </span>
                )}
              </div>
            </div>

            {/* Financial Highlights Pill */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 min-w-[200px] text-right space-y-1">
              <span className="text-[11px] text-slate-400 block">Total Claimed</span>
              <span className="text-xl sm:text-2xl font-extrabold text-white block">
                ₹{Number(claim.claim_amount || 0).toLocaleString()}
              </span>
              {claim.approved_amount > 0 ? (
                <span className="text-xs font-bold text-emerald-400 block">
                  Approved: ₹{Number(claim.approved_amount).toLocaleString()}
                </span>
              ) : (
                <span className="text-[11px] text-slate-500 block">Adjudication Pending</span>
              )}
            </div>
          </div>
        </div>

        {/* Visual Workflow Timeline */}
        <div className="p-5 sm:p-6 rounded-3xl bg-[#091122]/90 border border-slate-800/90 shadow-xl space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Adjudication Progress Timeline
          </h3>
          <ClaimTimeline
            status={claim.status}
            submittedAt={claim.submitted_at}
            reviewedAt={claim.reviewed_at}
            settledAt={claim.settled_at}
          />
        </div>

        {/* ─────────────────────────────────────────────────────────────
            ACTIVE ACTION BANNER: DOCUMENTS REQUIRED
        ───────────────────────────────────────────────────────────── */}
        {isDocRequired && (
          <div className="p-6 rounded-3xl bg-amber-950/30 border border-amber-500/40 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 shrink-0">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-amber-300">
                  Action Required: Supplementary Documents or Clarification Requested
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The insurance reviewer has requested additional documentation before adjudicating this claim:
                </p>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-amber-500/30 text-xs text-amber-200 font-medium mt-2">
                  "{claim.requested_documents_note || claim.reviewer_comments || 'Please upload the original hospital pharmacy bill vouchers and signed doctor prescription.'}"
                </div>
              </div>
            </div>

            {/* Resubmission Form */}
            <form onSubmit={handleResubmitDocuments} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h5 className="text-xs font-bold text-white">Upload Requested Document & Reply</h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-slate-300 mb-1 block">Document Category</Label>
                  <select
                    value={suppDocType}
                    onChange={(e) => setSuppDocType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl h-10 px-3 text-xs text-slate-200"
                  >
                    <option value="HOSPITAL_BILL">Hospital / Pharmacy Bill</option>
                    <option value="PRESCRIPTION">Doctor Prescription</option>
                    <option value="DIAGNOSTIC_REPORT">Radiology / Lab Scan</option>
                    <option value="DISCHARGE_SUMMARY">Discharge Summary</option>
                    <option value="OTHER">Other Clarification Document</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <Label className="text-xs text-slate-300 mb-1 block">Select File (PDF, JPG, PNG)</Label>
                  <Input
                    type="file"
                    onChange={(e) => setSuppFile(e.target.files?.[0] || null)}
                    className="bg-slate-900 border-slate-800 rounded-xl text-xs h-10"
                  />
                </div>

                <div className="sm:col-span-3">
                  <Label className="text-xs text-slate-300 mb-1 block">Clarification Note to Reviewer</Label>
                  <Input
                    value={suppNotes}
                    onChange={(e) => setSuppNotes(e.target.value)}
                    placeholder="e.g. Attached requested detailed itemized pharmacy invoice and discharge note..."
                    className="bg-slate-900 border-slate-800 rounded-xl text-xs h-10"
                  />
                </div>
              </div>

              {suppSuccess && (
                <p className="text-xs text-emerald-400 font-semibold">{suppSuccess}</p>
              )}

              <Button
                type="submit"
                disabled={suppLoading}
                className="bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold px-4 h-9"
              >
                {suppLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-1.5" /> : <UploadCloud className="h-4 w-4 mr-1.5" />}
                <span>Resubmit Documents to Reviewer</span>
              </Button>
            </form>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            ACTIVE ACTION BANNER: REJECTED CLAIM & APPEAL
        ───────────────────────────────────────────────────────────── */}
        {isRejected && (
          <div className="p-6 rounded-3xl bg-red-950/30 border border-red-500/40 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-red-500/20 text-red-400 shrink-0">
                <XCircle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-red-300">
                  Claim Denied / Rejected by Insurance Reviewer
                </h4>
                <p className="text-xs text-slate-300">
                  Mandatory Denial Reason from Reviewer:
                </p>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-red-500/30 text-xs text-red-200 font-medium mt-2">
                  "{claim.rejection_reason || claim.reviewer_comments || 'Treatment not covered under standard policy terms.'}"
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-red-500/20">
              <span className="text-xs text-slate-400">
                If you believe this decision was made in error or have additional clinical justification, you can submit an appeal.
              </span>
              <Button
                type="button"
                onClick={() => setShowAppealModal(true)}
                className="bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold px-4 h-9 shadow-md shadow-red-600/20"
              >
                <RotateCcw className="h-4 w-4 mr-1.5" />
                <span>Submit Reconsideration Appeal</span>
              </Button>
            </div>
          </div>
        )}

        {/* Details Grid: Clinical & Financial */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left 2 Cols: Clinical and Itemized Expenses */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Treatment & Hospital Info */}
            <div className="p-6 rounded-3xl bg-[#091122]/90 border border-slate-800/90 shadow-xl space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-400" />
                <span>Treatment & Hospital Profile</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Healthcare Center</span>
                  <span className="font-semibold text-white">{claim.hospital_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Attending Doctor</span>
                  <span className="font-semibold text-white">{claim.doctor_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Examination Date</span>
                  <span className="text-slate-200">{claim.treatment_date}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Patient Name</span>
                  <span className="font-semibold text-white">{claim.patient_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Patient ID</span>
                  <span className="font-mono text-slate-300">{claim.patient_id_number || 'MED-ID-88421'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Policyholder</span>
                  <span className="text-slate-200">{claim.policyholder_name || claim.patient_name}</span>
                </div>
                {claim.admission_date && (
                  <div>
                    <span className="text-slate-400 block text-[11px]">Admission Date</span>
                    <span className="text-slate-200">{claim.admission_date}</span>
                  </div>
                )}
                {claim.discharge_date && (
                  <div>
                    <span className="text-slate-400 block text-[11px]">Discharge Date</span>
                    <span className="text-slate-200">{claim.discharge_date}</span>
                  </div>
                )}
              </div>

              {claim.description && (
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1">Clinical Summary</span>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-3 rounded-2xl border border-slate-800">
                    {claim.description}
                  </p>
                </div>
              )}
            </div>

            {/* Itemized Expenses Breakdown Table */}
            <div className="p-6 rounded-3xl bg-[#091122]/90 border border-slate-800/90 shadow-xl space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Receipt className="h-4 w-4 text-emerald-400" />
                <span>Verified Expense Breakdown</span>
              </h3>

              <div className="overflow-x-auto rounded-2xl border border-slate-800/80">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#060a14]/80 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4">Expense Category</th>
                      <th className="py-2.5 px-4 text-right">Claimed Charge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {claim.expense_breakdown && Object.entries(claim.expense_breakdown)
                      .filter(([k]) => k !== 'total')
                      .map(([category, amt]) => (
                        <tr key={category} className="hover:bg-slate-800/30">
                          <td className="py-2.5 px-4 capitalize text-slate-300">
                            {category} charges
                          </td>
                          <td className="py-2.5 px-4 text-right font-medium text-white">
                            ₹{Number(amt || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    <tr className="bg-slate-900/60 font-bold">
                      <td className="py-3 px-4 text-white">Total Claimed Amount</td>
                      <td className="py-3 px-4 text-right text-blue-300 text-sm">
                        ₹{Number(claim.claim_amount || 0).toLocaleString()}
                      </td>
                    </tr>
                    {claim.approved_amount > 0 && (
                      <tr className="bg-emerald-950/30 font-bold text-emerald-400">
                        <td className="py-3 px-4">Approved Reimbursement</td>
                        <td className="py-3 px-4 text-right text-sm">
                          ₹{Number(claim.approved_amount).toLocaleString()}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Uploaded Documents List */}
            <div className="p-6 rounded-3xl bg-[#091122]/90 border border-slate-800/90 shadow-xl space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-blue-400" />
                <span>Attached Supporting Documents ({claim.documents?.length || 0})</span>
              </h3>

              {claim.documents && claim.documents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {claim.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 rounded-xl bg-blue-600/15 text-blue-400 shrink-0">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-white truncate block">{doc.original_filename}</span>
                          <span className="text-[11px] text-slate-400 block">{doc.document_type}</span>
                        </div>
                      </div>

                      <a
                        href={`${BASE_API_URL}/insurance/documents/${doc.id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-blue-400 hover:text-blue-300 hover:underline shrink-0"
                      >
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No external documents uploaded for this claim draft.</p>
              )}
            </div>
          </div>

          {/* Right Col: Settlement Details, Policy Card, Reviewer Comments, & Audit History */}
          <div className="space-y-6">
            
            {/* Settlement Card if Approved/Settled */}
            {(claim.settlement_reference || claim.approved_amount > 0 || claim.status === 'SETTLED') && (
              <div className="p-6 rounded-3xl bg-gradient-to-br from-teal-950/40 via-[#091122] to-emerald-950/30 border border-teal-500/30 shadow-2xl space-y-3">
                <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wider">
                  <Banknote className="h-4 w-4" />
                  <span>Settlement & Payout Summary</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Approved Amount</span>
                    <span className="text-xl font-extrabold text-emerald-400">
                      ₹{Number(claim.approved_amount || claim.claim_amount).toLocaleString()}
                    </span>
                  </div>
                  {claim.settlement_reference && (
                    <div>
                      <span className="text-slate-400 block text-[11px]">Settlement Reference</span>
                      <span className="font-mono font-bold text-teal-300">{claim.settlement_reference}</span>
                    </div>
                  )}
                  {claim.payment_date && (
                    <div>
                      <span className="text-slate-400 block text-[11px]">Disbursement Date</span>
                      <span className="text-slate-200">{claim.payment_date}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Policy Snapshot Card */}
            {claim.policy && (
              <div className="p-6 rounded-3xl bg-[#091122]/90 border border-slate-800/90 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Covering Policy</h4>
                  <PolicyStatusBadge status={claim.policy.status} />
                </div>
                <div className="space-y-1.5 text-xs">
                  <h5 className="font-bold text-white">{claim.policy.insurance_company}</h5>
                  <p className="font-mono text-slate-400 text-[11px]">{maskPolicyNumber(claim.policy.policy_number)}</p>
                  <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Remaining:</span>
                      <strong className="text-blue-300">₹{Number(claim.policy.remaining_coverage || claim.policy.coverage_amount).toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Deductible:</span>
                      <strong className="text-white">₹{Number(claim.policy.deductible || 5000).toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Reviewer Comments Box */}
            <div className="p-6 rounded-3xl bg-[#091122]/90 border border-slate-800/90 shadow-xl space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-purple-400" />
                <span>Reviewer Decision & Notes</span>
              </h4>
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                {claim.reviewer_comments || 'Awaiting initial evaluation by licensed insurance reviewer.'}
              </div>
              {claim.reviewer_name && (
                <span className="text-[11px] text-slate-400 block text-right">
                  Adjudicated by: <strong className="text-white">{claim.reviewer_name}</strong>
                </span>
              )}
            </div>

            {/* Audit History / Timestamped Activity Log */}
            <div className="p-6 rounded-3xl bg-[#091122]/90 border border-slate-800/90 shadow-xl space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-blue-400" />
                <span>Audit Trail & Activity Log</span>
              </h4>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {claim.audit_logs && claim.audit_logs.length > 0 ? (
                  claim.audit_logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-2xl bg-slate-900/50 border border-slate-800/80 text-[11px] space-y-1"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-300">
                        <span className="text-blue-400">{log.action}</span>
                        <span className="text-slate-500 font-normal">{log.created_at ? new Date(log.created_at).toLocaleDateString() : ''}</span>
                      </div>
                      <p className="text-slate-300 leading-tight">{log.comments}</p>
                      <span className="text-[10px] text-slate-500 block">By {log.user_name || log.user_role}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No activity recorded yet.</p>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: RECONSIDERATION APPEAL MODAL
      ───────────────────────────────────────────────────────────── */}
      {showAppealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#091122] border border-red-500/30 p-6 sm:p-8 shadow-2xl space-y-5">
            <button
              onClick={() => setShowAppealModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-red-600/20 text-red-400 border border-red-500/30">
                <RotateCcw className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Submit Reconsideration Appeal</h3>
                <p className="text-xs text-slate-400">Request formal re-evaluation by the insurance board</p>
              </div>
            </div>

            <form onSubmit={handleAppealSubmit} className="space-y-4">
              <div>
                <Label className="text-xs text-slate-300 mb-1.5 block">
                  Clinical & Billing Appeal Justification *
                </Label>
                <textarea
                  rows={4}
                  value={appealNotes}
                  onChange={(e) => setAppealNotes(e.target.value)}
                  placeholder="Explain why the treatment was medically necessary and why the rejection criteria do not apply according to your policy wording..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAppealModal(false)}
                  className="border-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={appealLoading}
                  className="bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold"
                >
                  {appealLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-1.5" /> : null}
                  <span>Submit Appeal</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: CLAIM RECEIPT MODAL
      ───────────────────────────────────────────────────────────── */}
      {showReceiptModal && receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl bg-[#091122] border border-teal-500/30 p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowReceiptModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center pb-3 border-b border-slate-800 space-y-1">
              <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-teal-500/15 text-teal-400 text-xs font-bold border border-teal-500/30">
                <Receipt className="h-3.5 w-3.5" /> Official Claim Receipt
              </span>
              <h3 className="text-xl font-extrabold text-white">MediVision AI Claim Voucher</h3>
              <p className="text-xs font-mono text-slate-400">{receiptData.receipt_number}</p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div>
                  <span className="text-[11px] text-slate-400 block">Patient Name</span>
                  <span className="font-bold text-white">{receiptData.patient?.name}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Claim Reference</span>
                  <span className="font-mono font-bold text-blue-300">{receiptData.claim_number}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Insurer</span>
                  <span className="font-semibold text-white">{receiptData.policy?.company}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Total Claimed</span>
                  <span className="font-bold text-emerald-400">₹{Number(receiptData.financials?.total_claimed || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReceiptModal(false)}
                  className="border-slate-800 text-slate-300 rounded-xl"
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={() => window.print()}
                  className="bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold flex items-center gap-1.5"
                >
                  <Download className="h-4 w-4" />
                  <span>Print Receipt</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ClaimDetailsPage;
