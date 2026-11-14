import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import InsurancePolicyCard from './components/InsurancePolicyCard';
import InsuranceClaimReport from './components/InsuranceClaimReport';
import { PolicyStatusBadge } from './components/StatusBadge';
import {
  Shield,
  FilePlus,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
  Home,
  RefreshCw,
  Printer,
  ChevronRight,
  Sparkles,
  Info,
  Calendar,
  X,
  Stethoscope,
  ExternalLink,
  Award,
  Trash2
} from 'lucide-react';

const BASE_API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const InsuranceDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Active view tab: 'REPORTS' (Generated Reports) or 'POLICIES' (Saved Policies)
  const [activeTab, setActiveTab] = useState('REPORTS');

  const [policies, setPolicies] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [viewPolicyModal, setViewPolicyModal] = useState(null);
  const [viewReportModal, setViewReportModal] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const patientId = user?.email || 'john.miller@patient.medivision.ai';

      const [policiesRes, claimsRes] = await Promise.all([
        axios.get(`${BASE_API_URL}/insurance/policies?patient_id=${encodeURIComponent(patientId)}`),
        axios.get(`${BASE_API_URL}/insurance/claims?patient_id=${encodeURIComponent(patientId)}`)
      ]);

      const policyList = Array.isArray(policiesRes?.data) ? policiesRes.data : [];
      setPolicies(policyList);

      // Load local generated reports
      let localReports = [];
      try {
        localReports = JSON.parse(localStorage.getItem('medivision_generated_insurance_reports') || '[]');
      } catch (e) {
        console.error('Error loading local reports:', e);
      }

      // Convert backend claim records into report view objects
      const serverClaims = Array.isArray(claimsRes?.data) ? claimsRes.data : [];
      const serverReports = serverClaims.map((c) => {
        let breakdown = {};
        try {
          breakdown = typeof c.expense_breakdown === 'string' ? JSON.parse(c.expense_breakdown) : (c.expense_breakdown || {});
        } catch {
          breakdown = {};
        }

        return {
          claim_number: c.claim_number,
          prepared_at: c.submitted_at || c.created_at || new Date().toISOString(),
          claim_type: c.claim_type || 'REIMBURSEMENT',
          patient_name: c.patient_name || user?.name || 'John Miller',
          patient_id: c.patient_id,
          patient_id_number: c.patient_id_number || 'MED-ID-88421',
          policyholder_name: c.policyholder_name || c.patient_name,
          policy: {
            insurance_company: c.insurance_company || 'Star Health Allied Insurance',
            policy_number: c.policy_number || 'POL-STAR-2026-8941',
            policy_type: 'Comprehensive Health Guard',
            sum_insured: 1000000,
            remaining_coverage: 885000,
            deductible: 5000,
            copay_percentage: 10
          },
          hospital_name: c.hospital_name || 'Apollo Multi-Specialty Hospital',
          doctor_name: c.doctor_name || 'Dr. Sarah Patel',
          treatment_type: c.treatment_type || 'Radiological Diagnostic Scan',
          diagnosis_reference: c.diagnosis_reference || 'Preliminary Radiographic Finding',
          treatment_date: c.treatment_date || c.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          claim_amount: c.claim_amount || 11000,
          description: c.description || 'Comprehensive clinical scan and physician diagnostic assessment.',
          expense_breakdown: breakdown,
          financial_estimate: {
            remaining_coverage: 885000,
            deductible: 5000,
            copay_percentage: 10,
            estimated_eligible_base: Math.max(0, (c.claim_amount || 11000) - 5000),
            estimated_copay: Math.max(0, (c.claim_amount || 11000) - 5000) * 0.1,
            estimated_payable: Math.max(0, (c.claim_amount || 11000) - 5000) * 0.9,
            estimated_patient_responsibility: (c.claim_amount || 11000) * 0.1 + 5000,
            disclaimer: 'Preliminary estimate only. Insurer determines final reimbursement eligibility.'
          },
          is_ai_report_attached: !!c.is_ai_report_attached,
          ai_report_summary: c.ai_report_summary || (c.is_ai_report_attached ? 'MediVision AI vision model assessment attached.' : null),
          documents: []
        };
      });

      // Merge: unique by claim_number
      const allReports = [...localReports];
      for (const s of serverReports) {
        if (!allReports.some((r) => r.claim_number === s.claim_number)) {
          allReports.push(s);
        }
      }

      setReports(allReports);
    } catch (err) {
      console.error('Error loading insurance report data:', err);
      setError('Could not connect to insurance service. Showing local files.');
      try {
        const localOnly = JSON.parse(localStorage.getItem('medivision_generated_insurance_reports') || '[]');
        setReports(localOnly);
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleGenerateReport = (policy) => {
    navigate('/insurance/claims/create', { state: { preselectedPolicyId: policy?.id } });
  };

  // Delete / Remove claim report
  const handleDeleteClaim = async (claimNumber) => {
    if (!window.confirm(`Are you sure you want to remove claim report ${claimNumber}?`)) {
      return;
    }

    // 1. Update UI state immediately
    setReports((prev) => prev.filter((r) => r.claim_number !== claimNumber));

    // 2. Remove from localStorage
    try {
      const localReports = JSON.parse(localStorage.getItem('medivision_generated_insurance_reports') || '[]');
      const filtered = localReports.filter((r) => r.claim_number !== claimNumber);
      localStorage.setItem('medivision_generated_insurance_reports', JSON.stringify(filtered));
    } catch (e) {
      console.error('Error removing report from localStorage:', e);
    }

    // 3. Remove from server database if present
    try {
      await axios.delete(`${BASE_API_URL}/insurance/claims/${encodeURIComponent(claimNumber)}`);
    } catch (err) {
      console.warn('Server delete response notice:', err?.response?.data || err.message);
    }

    // Close view modal if it was viewing this report
    if (viewReportModal?.claim_number === claimNumber) {
      setViewReportModal(null);
    }
  };

  // Clean up any remaining legacy state names
  const cleanHospitalName = (name) => {
    if (!name) return 'Hospital';
    return name.replace(/,?\s*Karnataka(\s*\(fictional\))?/gi, '').replace(/\s*\(fictional\)/gi, '').trim();
  };

  return (
    <div className="min-h-screen bg-[#060a14] text-white py-6 px-4 sm:px-6 lg:px-10">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* ── Top Header & Actions ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Link to="/" className="hover:text-blue-400 transition-colors flex items-center gap-1">
                <Home className="h-3.5 w-3.5" />
                <span>Home</span>
              </Link>
              <span>/</span>
              <span className="text-slate-300">Insurance</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Insurance Claims
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Manage your policies and download ready-to-file claim reports
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 rounded-lg text-xs h-9 px-3"
            >
              <Link to="/insurance/policies/add" className="flex items-center gap-1.5">
                <PlusCircle className="h-3.5 w-3.5 text-blue-400" />
                <span>Add Policy</span>
              </Link>
            </Button>

            <Button
              asChild
              size="sm"
              className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold h-9 px-3.5 shadow-sm"
            >
              <Link to="/insurance/claims/create" className="flex items-center gap-1.5">
                <FilePlus className="h-3.5 w-3.5" />
                <span>New Claim</span>
              </Link>
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Summary Stats ── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Total Claims</p>
              <p className="text-lg sm:text-xl font-bold text-white mt-0.5">{reports.length}</p>
            </div>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <FileText className="h-4 w-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Active Policies</p>
              <p className="text-lg sm:text-xl font-bold text-emerald-400 mt-0.5">{policies.length}</p>
            </div>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Shield className="h-4 w-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">AI Scans Linked</p>
              <p className="text-lg sm:text-xl font-bold text-purple-300 mt-0.5">
                {reports.filter((r) => r.is_ai_report_attached).length || reports.length}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* ── Segmented Tab Switcher ── */}
        <div className="flex items-center justify-between pt-1">
          <div className="inline-flex p-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setActiveTab('REPORTS')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'REPORTS'
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Claim Reports</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'REPORTS' ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {reports.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('POLICIES')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'POLICIES'
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Policies</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'POLICIES' ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {policies.length}
              </span>
            </button>
          </div>
        </div>

        {/* ── TAB 1: GENERATED CLAIM REPORTS ── */}
        {activeTab === 'REPORTS' && (
          <div className="space-y-2.5">
            {loading ? (
              <div className="p-10 text-center text-slate-400 rounded-xl bg-slate-900/30 border border-slate-800">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto text-blue-400 mb-2" />
                <span className="text-xs">Loading claim reports...</span>
              </div>
            ) : reports.length === 0 ? (
              <div className="p-10 text-center rounded-xl bg-slate-900/30 border border-dashed border-slate-800 space-y-2.5">
                <FileText className="h-8 w-8 mx-auto text-slate-600" />
                <h3 className="text-sm font-semibold text-slate-200">No Claim Reports Yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Package medical imaging diagnoses, doctor assessments, and hospital bills into a ready-to-file insurance claim report.
                </p>
                <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium mt-1">
                  <Link to="/insurance/claims/create">+ Create Claim</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {reports.map((report, idx) => (
                  <div
                    key={report.claim_number || idx}
                    className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/70 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3.5"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-300 text-xs bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                          {report.claim_number}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                          READY
                        </span>
                        {report.claim_type && (
                          <span className="text-[10px] font-medium text-slate-400 uppercase">
                            • {report.claim_type}
                          </span>
                        )}
                      </div>

                      <div className="text-sm font-semibold text-white truncate">
                        {cleanHospitalName(report.hospital_name)}
                        {report.treatment_type && (
                          <span className="text-slate-400 font-normal"> — {report.treatment_type}</span>
                        )}
                      </div>

                      <div className="text-xs text-slate-400 truncate">
                        <span>{report.policy?.insurance_company || 'Insurance Provider'}</span>
                        {report.diagnosis_reference && ` • ${report.diagnosis_reference}`}
                      </div>

                      {report.is_ai_report_attached && (
                        <div className="inline-flex items-center gap-1 text-[10px] font-medium text-purple-400 pt-0.5">
                          <Sparkles className="h-3 w-3" /> AI Vision Diagnostic Attached
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2.5 md:pt-0 border-t md:border-t-0 border-slate-800/60">
                      <div className="text-left md:text-right">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Claim Amount</span>
                        <span className="text-base font-bold text-white">
                          ₹{Number(report.claim_amount || 0).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setViewReportModal(report);
                            setTimeout(() => window.print(), 300);
                          }}
                          className="h-8 px-2.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                          title="Print / Save PDF"
                        >
                          <Printer className="h-3.5 w-3.5 text-blue-400" />
                          <span className="hidden sm:inline">Print</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setViewReportModal(report)}
                          className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors"
                        >
                          <span>View Report</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteClaim(report.claim_number)}
                          className="h-8 px-2 rounded-lg border border-slate-700/60 bg-slate-800/80 hover:bg-rose-500/15 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 text-xs font-medium flex items-center justify-center transition-colors"
                          title="Delete claim"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: POLICIES VIEW ── */}
        {activeTab === 'POLICIES' && (
          <div className="space-y-3">
            {loading ? (
              <div className="p-10 text-center text-slate-400 rounded-xl bg-slate-900/30 border border-slate-800">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto text-blue-400 mb-2" />
                <span className="text-xs">Loading policies...</span>
              </div>
            ) : policies.length === 0 ? (
              <div className="p-10 text-center rounded-xl bg-slate-900/30 border border-dashed border-slate-800 space-y-2.5">
                <Building2 className="h-8 w-8 mx-auto text-slate-600" />
                <h3 className="text-sm font-semibold text-slate-200">No Policies Added Yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Add your health insurance policy to automatically include coverage details in generated claims.
                </p>
                <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium mt-1">
                  <Link to="/insurance/policies/add">+ Add Policy</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {policies.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      {/* Provider Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                            <Shield className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white text-sm leading-snug">
                              {p.insurance_company}
                            </h3>
                            <p className="text-xs text-slate-400">{p.policy_type || 'Comprehensive Health'}</p>
                          </div>
                        </div>
                        <PolicyStatusBadge status={p.status} />
                      </div>

                      {/* Policy Numbers and Coverage */}
                      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-900/70 border border-slate-800/60 my-2.5 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">Policy Number</span>
                          <span className="font-mono font-medium text-slate-200 text-xs">{p.policy_number}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">Policyholder</span>
                          <span className="font-medium text-white truncate block text-xs">{p.patient_name || 'Primary Insured'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">Sum Insured</span>
                          <span className="font-bold text-emerald-400 text-xs">
                            ₹{Number(p.sum_insured || p.coverage_amount || 0).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">Validity</span>
                          <span className="text-slate-300 text-xs">
                            {p.end_date || 'Active'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Simple Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleGenerateReport(p)}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold h-8"
                      >
                        File Claim
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setViewPolicyModal(p)}
                        className="border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium h-8 px-3"
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── MODAL 1: VIEW FORMAL INSURANCE CLAIM REPORT ── */}
      {viewReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-4xl my-auto rounded-3xl bg-white text-slate-900 p-4 sm:p-8 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setViewReportModal(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <InsuranceClaimReport claim={viewReportModal} />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteClaim(viewReportModal.claim_number)}
                className="border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Claim</span>
              </Button>

              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewReportModal(null)}
                  className="border-slate-300 text-slate-700 rounded-xl text-xs"
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={() => window.print()}
                  className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print / Save as PDF</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: VIEW POLICY DETAILS ── */}
      {viewPolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#091122] border border-slate-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setViewPolicyModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{viewPolicyModal.insurance_company}</h3>
                <p className="text-xs text-slate-400">{viewPolicyModal.policy_type}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Policy Number</span>
                <span className="font-mono font-bold text-white text-xs">{viewPolicyModal.policy_number}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Policyholder</span>
                <span className="font-semibold text-white">{viewPolicyModal.patient_name || 'Primary Insured'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Status</span>
                <PolicyStatusBadge status={viewPolicyModal.status} />
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Sum Insured</span>
                <span className="font-bold text-emerald-400 text-xs">
                  ₹{Number(viewPolicyModal.sum_insured || 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Remaining Limit</span>
                <span className="font-bold text-blue-300 text-xs">
                  ₹{Number(viewPolicyModal.remaining_coverage || viewPolicyModal.coverage_amount || 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Validity</span>
                <span className="text-slate-300">{viewPolicyModal.start_date} → {viewPolicyModal.end_date}</span>
              </div>
            </div>

            {viewPolicyModal.network_hospitals && (
              <div className="space-y-1.5 text-xs">
                <span className="font-semibold text-slate-300 block text-[11px]">Partner Hospitals</span>
                <p className="text-slate-400 p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 text-[11px] leading-relaxed">
                  {viewPolicyModal.network_hospitals}
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewPolicyModal(null)}
                className="border-slate-800 text-slate-300 rounded-xl text-xs h-8"
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setViewPolicyModal(null);
                  handleGenerateReport(viewPolicyModal);
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold h-8"
              >
                Generate Report
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default InsuranceDashboard;
