import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Shield,
  Building2,
  Calendar,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  Home,
  ArrowLeft,
  Sparkles
} from 'lucide-react';

const BASE_API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const INSURANCE_PROVIDERS = [
  'Star Health and Allied Insurance',
  'Care Health Insurance',
  'HDFC ERGO General Insurance',
  'ICICI Lombard General Insurance',
  'Niva Bupa Health Insurance',
  'Bajaj Allianz General Insurance',
  'Tata AIG General Insurance',
  'Aditya Birla Health Insurance',
  'ManipalCigna Health Insurance',
  'National Insurance Company'
];

const POLICY_TYPES = [
  'Comprehensive Health Guard',
  'Critical Illness Cover',
  'Individual Medical Policy',
  'Family Floater Health Plan',
  'Senior Citizen Health Insurance',
  'Super Top-Up Health Cover'
];

const AddPolicyPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [company, setCompany] = useState(INSURANCE_PROVIDERS[0]);
  const [customCompany, setCustomCompany] = useState('');
  const [policyType, setPolicyType] = useState(POLICY_TYPES[0]);
  const [policyNumber, setPolicyNumber] = useState('');
  const [sumInsured, setSumInsured] = useState('1000000');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-12-31');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const finalCompany = company === 'Other' ? customCompany : company;
      if (!finalCompany.trim()) throw new Error('Please select or specify an insurance company.');
      if (!startDate || !endDate) throw new Error('Please select validity start and end dates.');

      const payload = {
        patient_id: user?.email || 'john.miller@patient.medivision.ai',
        patient_name: user?.name || 'John Miller',
        insurance_company: finalCompany,
        policy_number: policyNumber.trim() || undefined,
        policy_type: policyType,
        sum_insured: parseFloat(sumInsured) || 500000.0,
        coverage_amount: parseFloat(sumInsured) || 500000.0,
        start_date: startDate,
        end_date: endDate
      };

      await axios.post(`${BASE_API_URL}/insurance/policies`, payload);
      setSuccess(true);
      setTimeout(() => {
        navigate('/insurance');
      }, 1000);
    } catch (err) {
      console.error('Error adding policy:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to add insurance policy.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060a14] text-white py-8 px-4 sm:px-6 lg:px-12 selection:bg-blue-500 selection:text-white">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <Link
            to="/insurance"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#091122] hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-all border border-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-blue-400" />
            <span>Back to Insurance</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Home</span>
            <span className="text-slate-600">/</span>
            <span>Insurance</span>
            <span className="text-slate-600">/</span>
            <span className="text-blue-400 font-semibold">Register Policy</span>
          </div>
        </div>

        {/* Card Header */}
        <div className="p-7 rounded-3xl bg-[#091122]/90 border border-slate-800/90 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-600/15 border border-blue-500/30 text-blue-400">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Register New Insurance Policy
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Add your policy details to link clinical scans and file reimbursement claims seamlessly.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Insurance policy added successfully! Redirecting...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            {/* Provider Selection */}
            <div className="space-y-1.5">
              <Label className="text-slate-300 font-semibold">Insurance Company *</Label>
              <select
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-[#060a14] border border-slate-800 text-white text-xs focus:border-blue-500 focus:outline-none"
              >
                {INSURANCE_PROVIDERS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
                <option value="Other">Other (Specify below)</option>
              </select>
            </div>

            {company === 'Other' && (
              <div className="space-y-1.5">
                <Label className="text-slate-300 font-semibold">Company Name *</Label>
                <Input
                  type="text"
                  placeholder="e.g. Religare Health Insurance"
                  value={customCompany}
                  onChange={(e) => setCustomCompany(e.target.value)}
                  className="bg-[#060a14] border-slate-800 text-white text-xs h-10 rounded-xl"
                  required
                />
              </div>
            )}

            {/* Policy Type & Policy Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-slate-300 font-semibold">Policy Type *</Label>
                <select
                  value={policyType}
                  onChange={(e) => setPolicyType(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#060a14] border border-slate-800 text-white text-xs focus:border-blue-500 focus:outline-none"
                >
                  {POLICY_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-300 font-semibold">Policy Number (Optional)</Label>
                <Input
                  type="text"
                  placeholder="e.g. POL-STAR-2026-8941"
                  value={policyNumber}
                  onChange={(e) => setPolicyNumber(e.target.value)}
                  className="bg-[#060a14] border-slate-800 text-white text-xs h-10 rounded-xl font-mono"
                />
                <span className="text-[10px] text-slate-500 block">Leave blank to auto-generate verified format</span>
              </div>
            </div>

            {/* Sum Insured */}
            <div className="space-y-1.5">
              <Label className="text-slate-300 font-semibold">Sum Insured / Total Coverage (₹) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
                <Input
                  type="number"
                  min="50000"
                  step="10000"
                  value={sumInsured}
                  onChange={(e) => setSumInsured(e.target.value)}
                  className="bg-[#060a14] border-slate-800 text-white text-xs h-10 rounded-xl pl-8 font-bold"
                  required
                />
              </div>
            </div>

            {/* Validity Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-slate-300 font-semibold">Coverage Start Date *</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-[#060a14] border-slate-800 text-white text-xs h-10 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-300 font-semibold">Coverage End Date (Expiry) *</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-[#060a14] border-slate-800 text-white text-xs h-10 rounded-xl"
                  required
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/insurance')}
                className="text-slate-400 hover:text-white rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl px-6 font-bold shadow-lg shadow-blue-600/25 text-xs"
              >
                {loading ? 'Registering Policy...' : 'Save & Register Policy'}
              </Button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default AddPolicyPage;
