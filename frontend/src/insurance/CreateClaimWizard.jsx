import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import InsuranceClaimReport from './components/InsuranceClaimReport';
import {
  Shield,
  FilePlus,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Stethoscope,
  Building2,
  Calendar,
  Receipt,
  FileText,
  Printer,
  Copy,
  Check,
  RotateCcw,
  User,
  Activity,
  FileCheck2,
  FolderOpen
} from 'lucide-react';

const BASE_API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Preset configurations matching the user's PDF sample & project scans
const PRESET_TEMPLATES = [
  {
    icon: '🏥',
    label: 'PDF Sample: Sunrise Hospital (Appendicitis)',
    badge: 'Exact PDF Sample',
    hospital: 'Sunrise Multispeciality Hospital, Mangaluru',
    insuranceProvider: 'ABC Health Insurance / Sample TPA',
    claimType: 'Reimbursement',
    policyNumber: 'POL-DEMO-2048',
    claimNumber: 'CLM-DEMO-7812',
    dateOfReport: '2026-10-30',
    patientName: 'Rahul Kumar (fictional)',
    ageGender: '32 years / Male',
    relationship: 'Self',
    patientId: 'PAT-DEMO-1025',
    admissionDate: '2026-10-24',
    dischargeDate: '2026-10-27',
    department: 'General Surgery',
    doctor: 'Dr. Ananya Rao (fictional), General Surgeon',
    presentingComplaints: 'Abdominal pain, nausea and fever, as recorded in this fictional case',
    diagnosis: 'Acute appendicitis',
    procedure: 'Laparoscopic appendectomy on 25/10/2026',
    hospitalCourse: 'Post-operative observation; discharged in stable condition with follow-up advice',
    expenses: {
      room_nursing: 12000,
      surgeon_fees: 18000,
      ot_procedure: 22000,
      medicines: 8500,
      lab_imaging: 6500,
      other_charges: 3000,
      total_hospital_bill: 70000,
      discount: 2000,
      net_claimed: 68000
    }
  },
  {
    icon: '🫁',
    label: 'Chest X-Ray (Pneumonia Care)',
    badge: 'AI Scan Linked',
    hospital: 'Apollo Multi-Specialty Hospital',
    insuranceProvider: 'Star Health and Allied Insurance',
    claimType: 'Reimbursement',
    policyNumber: 'POL-STAR-2026-8941',
    claimNumber: 'CLM-XRAY-4491',
    dateOfReport: '2026-10-30',
    patientName: 'John Miller',
    ageGender: '42 years / Male',
    relationship: 'Self',
    patientId: 'PAT-MED-88421',
    admissionDate: '2026-10-29',
    dischargeDate: '2026-10-30',
    department: 'Pulmonology & Radiology',
    doctor: 'Dr. Sarah Patel, MD (Pulmonology)',
    presentingComplaints: 'Persistent cough, fever and dyspnea on exertion for 4 days',
    diagnosis: 'Pneumonia / Respiratory Infiltration',
    procedure: 'High-Resolution Digital Chest Radiography & Bronchial Evaluation',
    hospitalCourse: 'Oral antibiotic coverage initiated, clinical monitoring stable, follow-up scan advised',
    expenses: {
      room_nursing: 3500,
      surgeon_fees: 2500,
      ot_procedure: 3000,
      medicines: 2500,
      lab_imaging: 4000,
      other_charges: 1000,
      total_hospital_bill: 16500,
      discount: 1500,
      net_claimed: 15000
    }
  },
  {
    icon: '🧠',
    label: 'Brain MRI (Neurology)',
    badge: 'Diagnostic Scan',
    hospital: 'Manipal Hospital',
    insuranceProvider: 'HDFC ERGO Health Care',
    claimType: 'Reimbursement',
    policyNumber: 'POL-HDFC-9932',
    claimNumber: 'CLM-MRI-7291',
    dateOfReport: '2026-10-30',
    patientName: 'Rahul Kumar',
    ageGender: '35 years / Male',
    relationship: 'Self',
    patientId: 'PAT-DEMO-1025',
    admissionDate: '2026-10-28',
    dischargeDate: '2026-10-29',
    department: 'Neurology & Neuro-Radiology',
    doctor: 'Dr. Rajesh Kumar, MD, DM (Neurology)',
    presentingComplaints: 'Severe intractable headache, dizziness and blurred vision',
    diagnosis: 'Cerebral Microvascular Ischemia',
    procedure: 'Brain MRI Scan with Contrast & Angiography protocols',
    hospitalCourse: 'Neuro-protective therapy initiated, hemodynamic stability observed, outpatient review scheduled',
    expenses: {
      room_nursing: 5000,
      surgeon_fees: 4000,
      ot_procedure: 6000,
      medicines: 3500,
      lab_imaging: 8500,
      other_charges: 1500,
      total_hospital_bill: 28500,
      discount: 2500,
      net_claimed: 26000
    }
  },
  {
    icon: '🦴',
    label: 'Orthopedic Fracture (Radius Plaster)',
    badge: 'Trauma Care',
    hospital: 'JSS Multi-Specialty Hospital, Bannimantap',
    insuranceProvider: 'Care Health Insurance',
    claimType: 'Reimbursement',
    policyNumber: 'POL-CARE-5512',
    claimNumber: 'CLM-ORTH-3310',
    dateOfReport: '2026-10-30',
    patientName: 'Rahul Kumar',
    ageGender: '32 years / Male',
    relationship: 'Self',
    patientId: 'PAT-DEMO-1025',
    admissionDate: '2026-10-29',
    dischargeDate: '2026-10-30',
    department: 'Orthopedic Surgery & Trauma',
    doctor: 'Dr. Arvind Rao, MS (Orthopedics)',
    presentingComplaints: 'Fall with blunt wrist trauma, severe pain and deformity in right wrist',
    diagnosis: 'Distal Radius Fracture (Right Wrist)',
    procedure: 'Digital Orthopedic X-Ray & Below-Elbow POP Cast Immobilization',
    hospitalCourse: 'Closed reduction with POP cast applied, distal circulation intact, discharged with sling',
    expenses: {
      room_nursing: 4000,
      surgeon_fees: 5500,
      ot_procedure: 4500,
      medicines: 2000,
      lab_imaging: 3500,
      other_charges: 1000,
      total_hospital_bill: 20500,
      discount: 1500,
      net_claimed: 19000
    }
  }
];

const CreateClaimWizard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Prefill state from diagnostic report if navigated from ReportCard
  const prefillData = location.state || {};

  // Default to the first template (the exact PDF template provided by the user)
  const defaultTemplate = PRESET_TEMPLATES[0];

  // 1. Hospital and Claim Details
  const [hospital, setHospital] = useState(prefillData.hospital || defaultTemplate.hospital);
  const [insuranceProvider, setInsuranceProvider] = useState(defaultTemplate.insuranceProvider);
  const [claimType, setClaimType] = useState('Reimbursement');
  const [policyNumber, setPolicyNumber] = useState(defaultTemplate.policyNumber);
  const [claimNumber, setClaimNumber] = useState(defaultTemplate.claimNumber);
  const [dateOfReport, setDateOfReport] = useState(new Date().toISOString().split('T')[0]);

  // 2. Patient Details
  const [patientName, setPatientName] = useState(user?.name || defaultTemplate.patientName);
  const [ageGender, setAgeGender] = useState(defaultTemplate.ageGender);
  const [relationship, setRelationship] = useState(defaultTemplate.relationship);
  const [patientId, setPatientId] = useState(defaultTemplate.patientId);

  // 3. Admission and Treatment Summary
  const [admissionDate, setAdmissionDate] = useState(defaultTemplate.admissionDate);
  const [dischargeDate, setDischargeDate] = useState(defaultTemplate.dischargeDate);
  const [department, setDepartment] = useState(
    prefillData.specialty || defaultTemplate.department
  );
  const [doctor, setDoctor] = useState(prefillData.doctor || defaultTemplate.doctor);
  const [presentingComplaints, setPresentingComplaints] = useState(
    prefillData.report ? `AI Scan Analysis: ${prefillData.report.slice(0, 140)}` : defaultTemplate.presentingComplaints
  );
  const [diagnosis, setDiagnosis] = useState(prefillData.diagnosis || defaultTemplate.diagnosis);
  const [procedure, setProcedure] = useState(defaultTemplate.procedure);
  const [hospitalCourse, setHospitalCourse] = useState(defaultTemplate.hospitalCourse);

  // 4. Itemised Expense Summary
  const [expenses, setExpenses] = useState(defaultTemplate.expenses);

  // Result state
  const [generatedReport, setGeneratedReport] = useState(null);
  const [activeTemplateIdx, setActiveTemplateIdx] = useState(0);

  // If navigated from ReportCard, override diagnosis and procedure
  useEffect(() => {
    if (prefillData.diagnosis) {
      setDiagnosis(prefillData.diagnosis);
      setProcedure(`${prefillData.diagnosis} Procedure / Clinical Assessment`);
      setPresentingComplaints(prefillData.report || 'Preliminary diagnostic scan evaluation');
      if (prefillData.hospital) setHospital(prefillData.hospital);
      if (prefillData.doctor) setDoctor(prefillData.doctor);
    }
  }, [prefillData]);

  // Apply a preset template
  const applyTemplate = (t, idx) => {
    setActiveTemplateIdx(idx);
    setHospital(t.hospital);
    setInsuranceProvider(t.insuranceProvider);
    setClaimType(t.claimType);
    setPolicyNumber(t.policyNumber);
    setClaimNumber(t.claimNumber);
    setDateOfReport(t.dateOfReport);
    setPatientName(t.patientName);
    setAgeGender(t.ageGender);
    setRelationship(t.relationship);
    setPatientId(t.patientId);
    setAdmissionDate(t.admissionDate);
    setDischargeDate(t.dischargeDate);
    setDepartment(t.department);
    setDoctor(t.doctor);
    setPresentingComplaints(t.presentingComplaints);
    setDiagnosis(t.diagnosis);
    setProcedure(t.procedure);
    setHospitalCourse(t.hospitalCourse);
    setExpenses(t.expenses);
  };

  // Re-calculate totals when expense inputs change
  const handleExpenseChange = (field, val) => {
    const num = Number(val) || 0;
    const updated = { ...expenses, [field]: num };
    
    const total = 
      (field === 'room_nursing' ? num : updated.room_nursing) +
      (field === 'surgeon_fees' ? num : updated.surgeon_fees) +
      (field === 'ot_procedure' ? num : updated.ot_procedure) +
      (field === 'medicines' ? num : updated.medicines) +
      (field === 'lab_imaging' ? num : updated.lab_imaging) +
      (field === 'other_charges' ? num : updated.other_charges);

    const disc = field === 'discount' ? num : updated.discount;
    const net = Math.max(0, total - disc);

    setExpenses({
      ...updated,
      total_hospital_bill: total,
      net_claimed: net
    });
  };

  // Generate Report
  const handleGenerate = () => {
    const reportData = {
      hospital_name: hospital,
      insurance_provider: insuranceProvider,
      claim_type: claimType,
      claim_number: claimNumber,
      policy: {
        policy_number: policyNumber,
        insurance_company: insuranceProvider
      },
      treatment_date: dateOfReport,
      prepared_at: new Date().toISOString(),

      patient_name: patientName,
      patient_age_gender: ageGender,
      policyholder_relationship: relationship,
      patient_id_number: patientId,

      admission_date: admissionDate,
      discharge_date: dischargeDate,
      department: department,
      doctor_name: doctor,
      presenting_complaints: presentingComplaints,
      diagnosis_reference: diagnosis,
      treatment_type: procedure,
      hospital_course: hospitalCourse,

      claim_amount: expenses.net_claimed,
      expense_breakdown: expenses,
      is_ai_report_attached: !!prefillData.diagnosis,
      ai_report_summary: prefillData.report ? `${prefillData.diagnosis}: ${prefillData.report.slice(0, 160)}` : null,

      supporting_documents_list: [
        { name: 'Completed claim form', status: 'Attached (sample)' },
        { name: 'Health insurance e-card / policy schedule', status: 'Attached (sample)' },
        { name: 'Patient identity proof', status: 'Attached (sample)' },
        { name: 'Admission advice and case papers', status: 'Attached (sample)' },
        { name: 'Discharge summary', status: 'Attached (sample)' },
        { name: 'Itemised final hospital bill', status: 'Attached (sample)' },
        { name: 'Payment receipts', status: 'Attached (sample)' },
        { name: 'Prescription and medicine bills', status: 'Attached (sample)' },
        { name: 'Laboratory and imaging reports', status: 'Attached (sample)' },
        { name: 'Operation notes', status: 'Attached (sample)' },
        { name: 'Bank proof / cancelled cheque', status: 'Attached (sample)' }
      ]
    };

    // Save to local storage for the dashboard
    try {
      const existing = JSON.parse(localStorage.getItem('medivision_generated_insurance_reports') || '[]');
      const filtered = existing.filter((r) => r.claim_number !== reportData.claim_number);
      localStorage.setItem('medivision_generated_insurance_reports', JSON.stringify([reportData, ...filtered]));
    } catch (e) {
      console.error('Storage error:', e);
    }

    setGeneratedReport(reportData);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ─────────────────────────────────────────────────────────────
  // GENERATED REPORT SCREEN
  // ─────────────────────────────────────────────────────────────
  if (generatedReport) {
    return (
      <div className="min-h-screen bg-[#060a14] text-white py-8 px-4 sm:px-6 lg:px-12 selection:bg-blue-500 selection:text-white">
        <div className="max-w-5xl mx-auto space-y-6">
          
          {/* Top Return & Action Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <Link
              to="/insurance"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#091122] hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-800"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-blue-400" />
              <span>Back to Insurance Portal</span>
            </Link>

            <Button
              type="button"
              onClick={() => setGeneratedReport(null)}
              variant="outline"
              className="border-slate-700 bg-[#091122] hover:bg-slate-800 text-slate-300 text-xs rounded-xl h-8 px-3 gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
              <span>Edit Details / Generate Another</span>
            </Button>
          </div>

          {/* Report Dossier Matching User's PDF */}
          <InsuranceClaimReport claim={generatedReport} />

        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // MAIN REPORT GENERATOR FORM (Simple 1-Page)
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#060a14] text-white py-8 px-4 sm:px-6 lg:px-12 selection:bg-blue-500 selection:text-white">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Top Breadcrumb */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <Link
            to="/insurance"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#091122] hover:bg-slate-800 text-slate-300 hover:text-white transition-all border border-slate-800 text-xs font-semibold"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-blue-400" />
            <span>Back to Insurance Portal</span>
          </Link>

          <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl">
            Official Hospital Insurance Claim Format
          </span>
        </div>

        {/* Page Banner Header */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950/40 via-[#091122] to-indigo-950/40 border border-blue-500/20 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 shrink-0">
              <FilePlus className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Hospital Insurance Claim Report Generator
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5 leading-relaxed">
                Generate the official 2-page hospital claim dossier with itemised expenses, treatment summary, and authorisation seal.
              </p>
            </div>
          </div>
        </div>

        {/* Preset Selector Bar */}
        <div className="p-4 rounded-2xl bg-[#091122] border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <span>⚡</span> Quick Select Report Template:
            </span>
            <span className="text-[11px] text-slate-500">Click to autofill all fields in 1 click</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {PRESET_TEMPLATES.map((t, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyTemplate(t, idx)}
                className={`p-3 rounded-2xl border text-left transition-all text-xs flex flex-col justify-between ${
                  activeTemplateIdx === idx
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/20 ring-1 ring-blue-500'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-lg">{t.icon}</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 uppercase">
                    {t.badge}
                  </span>
                </div>
                <div className="font-bold text-[11px] text-white leading-tight">{t.label}</div>
                <div className="text-[10px] text-emerald-400 mt-2 font-mono font-bold">
                  Net: ₹{t.expenses.net_claimed.toLocaleString()}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── FORM SECTIONS MATCHING THE USER'S PDF ── */}
        <div className="space-y-5">
          
          {/* SECTION 1: Hospital and Claim Details */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#091122]/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Building2 className="h-5 w-5 text-blue-400" />
              <h2 className="text-sm sm:text-base font-bold text-white">
                1. Hospital and Claim Details
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-slate-300 text-xs">Hospital Name & Address</Label>
                <Input
                  value={hospital}
                  onChange={(e) => setHospital(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs">Insurance Provider / TPA</Label>
                <Input
                  value={insuranceProvider}
                  onChange={(e) => setInsuranceProvider(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs">Claim Type</Label>
                <select
                  value={claimType}
                  onChange={(e) => setClaimType(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="Reimbursement">Reimbursement</option>
                  <option value="Cashless">Cashless Pre-Authorization</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs">Policy / Claim Reference</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={policyNumber}
                    onChange={(e) => setPolicyNumber(e.target.value)}
                    placeholder="Policy Number"
                    className="bg-slate-900 border-slate-700 text-white text-xs font-mono"
                  />
                  <Input
                    value={claimNumber}
                    onChange={(e) => setClaimNumber(e.target.value)}
                    placeholder="Claim Reference"
                    className="bg-slate-900 border-slate-700 text-white text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs">Date of Report</Label>
                <Input
                  type="date"
                  value={dateOfReport}
                  onChange={(e) => setDateOfReport(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Patient Details */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#091122]/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <User className="h-5 w-5 text-indigo-400" />
              <h2 className="text-sm sm:text-base font-bold text-white">
                2. Patient Details
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs">Patient Name</Label>
                <Input
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs">Age / Gender</Label>
                <Input
                  value={ageGender}
                  onChange={(e) => setAgeGender(e.target.value)}
                  placeholder="e.g. 32 years / Male"
                  className="bg-slate-900 border-slate-700 text-white text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs">Policyholder Relationship</Label>
                <Input
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  placeholder="e.g. Self, Spouse, Child"
                  className="bg-slate-900 border-slate-700 text-white text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs">Patient ID</Label>
                <Input
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  placeholder="e.g. PAT-DEMO-1025"
                  className="bg-slate-900 border-slate-700 text-white text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Admission and Treatment Summary */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#091122]/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Stethoscope className="h-5 w-5 text-emerald-400" />
              <h2 className="text-sm sm:text-base font-bold text-white">
                3. Admission and Treatment Summary
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs">Admission Date</Label>
                <Input
                  type="date"
                  value={admissionDate}
                  onChange={(e) => setAdmissionDate(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs">Discharge Date</Label>
                <Input
                  type="date"
                  value={dischargeDate}
                  onChange={(e) => setDischargeDate(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs">Department</Label>
                <Input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. General Surgery"
                  className="bg-slate-900 border-slate-700 text-white text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs">Treating Doctor</Label>
                <Input
                  value={doctor}
                  onChange={(e) => setDoctor(e.target.value)}
                  placeholder="e.g. Dr. Ananya Rao, General Surgeon"
                  className="bg-slate-900 border-slate-700 text-white text-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-slate-300 text-xs">Presenting Complaints</Label>
                <Input
                  value={presentingComplaints}
                  onChange={(e) => setPresentingComplaints(e.target.value)}
                  placeholder="Clinical symptoms and complaints..."
                  className="bg-slate-900 border-slate-700 text-white text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs font-bold text-emerald-400">Final Diagnosis *</Label>
                <Input
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Acute appendicitis"
                  className="bg-slate-900 border-slate-700 text-white text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs">Procedure / Treatment</Label>
                <Input
                  value={procedure}
                  onChange={(e) => setProcedure(e.target.value)}
                  placeholder="e.g. Laparoscopic appendectomy on 25/10/2026"
                  className="bg-slate-900 border-slate-700 text-white text-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-slate-300 text-xs">Hospital Course</Label>
                <Input
                  value={hospitalCourse}
                  onChange={(e) => setHospitalCourse(e.target.value)}
                  placeholder="Observation and discharge condition..."
                  className="bg-slate-900 border-slate-700 text-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: Itemised Expense Summary */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#091122]/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-purple-400" />
                <h2 className="text-sm sm:text-base font-bold text-white">
                  4. Itemised Expense Summary
                </h2>
              </div>
              <div className="text-xs text-slate-400">
                Net Claimed: <strong className="text-emerald-400 text-sm font-mono">₹{expenses.net_claimed.toLocaleString()}</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="space-y-1">
                <Label className="text-slate-400 text-[11px]">Room & nursing charges (₹)</Label>
                <Input
                  type="number"
                  value={expenses.room_nursing}
                  onChange={(e) => handleExpenseChange('room_nursing', e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-slate-400 text-[11px]">Surgeon & anaesthesia fees (₹)</Label>
                <Input
                  type="number"
                  value={expenses.surgeon_fees}
                  onChange={(e) => handleExpenseChange('surgeon_fees', e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-slate-400 text-[11px]">Operation theatre & procedure (₹)</Label>
                <Input
                  type="number"
                  value={expenses.ot_procedure}
                  onChange={(e) => handleExpenseChange('ot_procedure', e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-slate-400 text-[11px]">Medicines & consumables (₹)</Label>
                <Input
                  type="number"
                  value={expenses.medicines}
                  onChange={(e) => handleExpenseChange('medicines', e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-slate-400 text-[11px]">Laboratory & imaging (₹)</Label>
                <Input
                  type="number"
                  value={expenses.lab_imaging}
                  onChange={(e) => handleExpenseChange('lab_imaging', e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-slate-400 text-[11px]">Other hospital charges (₹)</Label>
                <Input
                  type="number"
                  value={expenses.other_charges}
                  onChange={(e) => handleExpenseChange('other_charges', e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-slate-400 text-[11px]">Less: discount / adjustment (₹)</Label>
                <Input
                  type="number"
                  value={expenses.discount}
                  onChange={(e) => handleExpenseChange('discount', e.target.value)}
                  className="bg-slate-900 border-slate-700 text-amber-300 text-xs font-mono"
                />
              </div>

              <div className="space-y-1 sm:col-span-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Total Hospital Bill</span>
                  <strong className="text-white font-mono text-sm">₹{expenses.total_hospital_bill.toLocaleString()}</strong>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-emerald-400 block uppercase font-bold">Net Amount Claimed</span>
                  <strong className="text-emerald-400 font-mono text-base">₹{expenses.net_claimed.toLocaleString()}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* ── BIG PRIMARY ACTION BUTTON ── */}
          <div className="pt-2">
            <Button
              type="button"
              onClick={handleGenerate}
              className="w-full h-14 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:via-indigo-500 hover:to-emerald-500 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="h-5 w-5" />
              <span>⚡ Generate Hospital Insurance Claim Report</span>
            </Button>
            <p className="text-center text-[11px] text-slate-400 mt-2">
              Formats and compiles your complete 2-page hospital claim dossier matching the official template.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};

export default CreateClaimWizard;
