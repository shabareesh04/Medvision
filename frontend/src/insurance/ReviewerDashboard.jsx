import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ClaimStatusBadge } from './components/StatusBadge';
import {
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Home,
  ChevronRight,
  ShieldAlert,
  Building2,
  Banknote,
  Sparkles,
  Lock,
  UserCheck
} from 'lucide-react';

const BASE_API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const STATUS_FILTERS = [
  { code: 'ALL', label: 'All Statuses' },
  { code: 'SUBMITTED', label: 'Submitted (New)' },
  { code: 'UNDER_REVIEW', label: 'Under Review' },
  { code: 'DOCUMENTS_REQUIRED', label: 'Docs Required' },
  { code: 'DOCUMENTS_RESUBMITTED', label: 'Docs Resubmitted' },
  { code: 'APPROVED', label: 'Approved' },
  { code: 'PARTIALLY_APPROVED', label: 'Partially Approved' },
  { code: 'REJECTED', label: 'Rejected' },
  { code: 'SETTLED', label: 'Settled' },
];

const ReviewerDashboard = () => {
  const { user, loginWithGoogle } = useAuth();

  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedClaimType, setSelectedClaimType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const isAuthorizedReviewer = user?.role === 'INSURANCE_REVIEWER' || user?.role === 'ADMIN' || user?.email?.includes('reviewer');

  const fetchReviewerClaims = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_API_URL}/insurance/reviewer/claims`, {
        params: {
          status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
          claim_type: selectedClaimType !== 'ALL' ? selectedClaimType : undefined,
          search: searchQuery.trim() || undefined
        }
      });
      setClaims(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error('Error loading reviewer claims:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewerClaims();
  }, [selectedStatus, selectedClaimType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReviewerClaims();
  };

  // Helper for quick reviewer role switch in demo mode
  const handleSwitchToReviewer = () => {
    loginWithGoogle({
      id: 'demo_reviewer',
      name: 'Marcus Chen',
      email: 'marcus.chen@insurance.medivision.ai',
      role: 'INSURANCE_REVIEWER',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MarcusChen',
      provider: 'demo'
    });
  };

  return (
    <div className="min-h-screen bg-[#060a14] text-white py-8 px-4 sm:px-6 lg:px-12 selection:bg-purple-500 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#091122] hover:bg-slate-800 text-slate-300 hover:text-white transition-all border border-slate-800"
            >
              <Home className="h-3.5 w-3.5 text-blue-400" />
              <span>Home</span>
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-purple-400 font-bold">Insurance Claims Review Portal</span>
          </div>

          <div className="flex items-center gap-3">
            {isAuthorizedReviewer ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold">
                <ShieldCheck className="h-4 w-4 text-purple-400" />
                <span>Authorized Reviewer ({user?.name || 'Marcus Chen'})</span>
              </div>
            ) : (
              <Button
                type="button"
                onClick={handleSwitchToReviewer}
                className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold h-8 px-3 gap-1.5 shadow-md shadow-purple-600/20"
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Switch to Reviewer Account (Demo)</span>
              </Button>
            )}
          </div>
        </div>

        {/* Reviewer Header Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-950/40 via-[#091122] to-blue-950/40 border border-purple-500/30 shadow-2xl backdrop-blur-xl space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Insurance Claims Adjudication Queue
            </h1>
            <span className="text-xs font-bold text-purple-300 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40">
              Staff Portal
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
            Review incoming patient claims, evaluate supporting medical bills & imaging reports, request documentation, approve full or partial amounts, and record final settlements.
          </p>
        </div>

        {/* Access Warning Banner if not logged in as Reviewer */}
        {!isAuthorizedReviewer && (
          <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Lock className="h-5 w-5 text-amber-400 shrink-0" />
              <span>
                You are currently viewing the queue with standard permissions. Authorized reviewers have adjudication privileges to approve, reject, or request documents.
              </span>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleSwitchToReviewer}
              className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shrink-0"
            >
              Sign as Reviewer
            </Button>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="p-4 rounded-2xl bg-[#091122]/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-grow max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by claim number, patient, or hospital..."
                className="bg-slate-900 border-slate-800 pl-9 rounded-xl text-xs h-9 text-slate-200"
              />
            </div>
            <Button type="submit" size="sm" className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs h-9 font-bold px-3">
              Search
            </Button>
          </form>

          {/* Type & Status Selectors */}
          <div className="flex items-center gap-2 text-xs">
            <select
              value={selectedClaimType}
              onChange={(e) => setSelectedClaimType(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl h-9 px-3 text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Claim Types</option>
              <option value="CASHLESS">Cashless Only</option>
              <option value="REIMBURSEMENT">Reimbursement Only</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl h-9 px-3 text-slate-300 focus:outline-none"
            >
              {STATUS_FILTERS.map(f => (
                <option key={f.code} value={f.code}>{f.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Claims Adjudication Table */}
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-slate-400 rounded-3xl bg-[#091122]/50 border border-slate-800">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-purple-400 mb-2" />
              <span className="text-xs font-semibold">Loading adjudication claims queue...</span>
            </div>
          ) : claims.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-[#091122]/80 border border-dashed border-slate-800 space-y-2">
              <FileText className="h-10 w-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No claims match the filter criteria</p>
              <p className="text-xs text-slate-500">Try adjusting your search terms or clearing status filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-slate-800/90 bg-[#091122]/90 backdrop-blur-xl shadow-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#060a14]/90 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-4 px-5">Claim Number</th>
                    <th className="py-4 px-4">Patient & Policy</th>
                    <th className="py-4 px-4">Hospital & Treatment</th>
                    <th className="py-4 px-4">Amount Claimed</th>
                    <th className="py-4 px-4">Status & Type</th>
                    <th className="py-4 px-5 text-right">Adjudication Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {claims.map((claim) => (
                    <tr key={claim.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-5">
                        <span className="font-mono font-bold text-purple-300 text-xs block">
                          {claim.claim_number}
                        </span>
                        <span className="text-[10px] text-slate-500 font-sans block mt-0.5">
                          {claim.submitted_at ? new Date(claim.submitted_at).toLocaleDateString() : 'Draft'}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-bold text-white block">{claim.patient_name}</span>
                        <span className="text-[11px] text-slate-400">{claim.insurance_company}</span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-medium text-slate-200 block">{claim.hospital_name}</span>
                        <span className="text-[11px] text-slate-400">{claim.treatment_type}</span>
                        {claim.is_ai_report_attached && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-400 mt-0.5">
                            <Sparkles className="h-2.5 w-2.5" /> AI Report Attached
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-extrabold text-white text-sm block">
                          ₹{Number(claim.claim_amount || 0).toLocaleString()}
                        </span>
                        {claim.approved_amount > 0 && (
                          <span className="text-[11px] font-semibold text-emerald-400">
                            Approved: ₹{Number(claim.approved_amount).toLocaleString()}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 space-y-1">
                        <div>
                          <ClaimStatusBadge status={claim.status} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">
                          {claim.claim_type}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <Button
                          asChild
                          size="sm"
                          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold h-8 px-3 shadow-md shadow-purple-600/20"
                        >
                          <Link to={`/admin/insurance/claims/${claim.id}`}>
                            <span>Review Claim</span>
                            <ChevronRight className="h-3.5 w-3.5 ml-1" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ReviewerDashboard;
