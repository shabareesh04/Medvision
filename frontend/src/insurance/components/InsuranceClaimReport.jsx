import React, { useMemo } from 'react';
import { Download, Printer, Copy, Check } from 'lucide-react';
import { Button } from '../../components/ui/button';

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const formatDate = (val) => {
  if (!val) return '30/10/2026';
  // If format is YYYY-MM-DD
  if (typeof val === 'string' && val.includes('-')) {
    const parts = val.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  return val;
};

const InsuranceClaimReport = ({ claim }) => {
  const [copied, setCopied] = React.useState(false);

  const report = useMemo(() => {
    if (!claim) return null;

    const exp = claim.expense_breakdown || {};
    const room = Number(exp.room_nursing ?? exp.consultation ?? 12000);
    const surgeon = Number(exp.surgeon_fees ?? exp.surgery ?? 18000);
    const ot = Number(exp.ot_procedure ?? exp.diagnostic ?? 22000);
    const medicines = Number(exp.medicines ?? exp.medication ?? 8500);
    const lab = Number(exp.lab_imaging ?? 6500);
    const other = Number(exp.other_charges ?? exp.other ?? 3000);
    const discount = Number(exp.discount ?? 2000);

    const totalBill = exp.total_hospital_bill || (room + surgeon + ot + medicines + lab + other);
    const netClaimed = claim.claim_amount || Math.max(0, totalBill - discount);

    return {
      hospital: claim.hospital_name || 'Sunrise Multispeciality Hospital, Mangaluru',
      insuranceProvider: claim.policy?.insurance_company || claim.insurance_provider || 'ABC Health Insurance / Sample TPA',
      claimType: claim.claim_type || 'Reimbursement',
      policyReference: `${claim.policy?.policy_number || 'POL-DEMO-2048'} / ${claim.claim_number || 'CLM-DEMO-7812'}`,
      claimNumber: claim.claim_number || 'CLM-DEMO-7812',
      reportDate: formatDate(claim.treatment_date || claim.prepared_at || new Date()),
      
      patientName: claim.patient_name || 'Rahul Kumar (fictional)',
      ageGender: claim.patient_age_gender || '32 years / Male',
      relationship: claim.policyholder_relationship || 'Self',
      patientId: claim.patient_id_number || 'PAT-DEMO-1025',

      admissionDate: formatDate(claim.admission_date || '2026-10-24'),
      dischargeDate: formatDate(claim.discharge_date || '2026-10-27'),
      department: claim.department || 'General Surgery',
      doctor: claim.doctor_name || 'Dr. Ananya Rao (fictional), General Surgeon',
      presentingComplaints: claim.presenting_complaints || claim.description || 'Abdominal pain, nausea and fever, as recorded in this fictional case',
      diagnosis: claim.diagnosis_reference || 'Acute appendicitis',
      procedure: claim.treatment_type || 'Laparoscopic appendectomy on 25/10/2026',
      hospitalCourse: claim.hospital_course || 'Post-operative observation; discharged in stable condition with follow-up advice',

      expenses: {
        room,
        surgeon,
        ot,
        medicines,
        lab,
        other,
        totalBill,
        discount,
        netClaimed
      },

      documents: claim.supporting_documents_list || [
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
  }, [claim]);

  if (!report) return null;

  const downloadJsonReport = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hospital-insurance-claim-report-${report.claimNumber}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const copyRef = () => {
    navigator.clipboard.writeText(report.policyReference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Split documents checklist cleanly across page 1 and page 2 matching the PDF
  const docsPage1 = report.documents.slice(0, 3);
  const docsPage2 = report.documents.slice(3);

  return (
    <div className="space-y-6">
      {/* Action Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#091122] border border-slate-800 text-slate-200 print:hidden">
        <div>
          <span className="text-xs uppercase tracking-wider text-blue-400 font-bold block">Hospital Insurance Claim Format</span>
          <span className="text-sm font-semibold text-white">Reference: {report.policyReference}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyRef}
            className="border-slate-700 bg-slate-900 text-slate-300 hover:text-white text-xs rounded-xl h-8 px-3 gap-1.5"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-blue-400" />}
            <span>{copied ? 'Copied' : 'Copy Ref'}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={downloadJsonReport}
            className="border-slate-700 bg-slate-900 text-slate-300 hover:text-white text-xs rounded-xl h-8 px-3 gap-1.5"
          >
            <Download className="h-3.5 w-3.5 text-blue-400" />
            <span>Download JSON</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl h-8 px-4 gap-1.5 shadow-md shadow-blue-600/30"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print / Save PDF</span>
          </Button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          PRINTABLE & VISUAL REPORT CONTAINER (Matches User's PDF)
      ───────────────────────────────────────────────────────────── */}
      <div className="insurance-claim-document bg-white text-[#111827] shadow-2xl rounded-2xl sm:rounded-3xl p-6 sm:p-12 max-w-4xl mx-auto font-sans border border-slate-200">
        
        {/* Print Stylesheet */}
        <style>{`
          @media print {
            body * { visibility: hidden !important; }
            .insurance-claim-document, .insurance-claim-document * { visibility: visible !important; }
            .insurance-claim-document {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 24px 32px !important;
              border: 0 !important;
              box-shadow: none !important;
              background: #ffffff !important;
              color: #111827 !important;
            }
            .page-break {
              page-break-before: always;
              break-before: page;
              margin-top: 36px;
              padding-top: 16px;
            }
          }
        `}</style>

        {/* ═════════════════════════════════════════════════════════════
            PAGE 1 CONTENT
        ═════════════════════════════════════════════════════════════ */}
        <div className="report-page-1 space-y-6">
          
          {/* Top Running Header */}
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 tracking-wider uppercase border-b border-slate-200 pb-2">
            <span>FICTIONAL DEMO REPORT</span>
            <span>Page 1</span>
          </div>

          {/* Main Title & Disclaimer Banner */}
          <div className="text-center space-y-1.5 pt-2 pb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#174375] tracking-tight uppercase">
              HOSPITAL INSURANCE CLAIM REPORT
            </h1>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              ILLUSTRATIVE SAMPLE — FICTIONAL PATIENT AND HOSPITAL DETAILS
            </p>
            <p className="text-[11px] text-slate-500 max-w-2xl mx-auto italic leading-normal">
              For MedVision AI demonstration only. This is not a genuine medical record, invoice, or insurance claim. Do not submit it to an insurer.
            </p>
          </div>

          {/* 1. Hospital and Claim Details */}
          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-[#174375]">
              1. Hospital and Claim Details
            </h2>
            <div className="overflow-hidden rounded-sm border border-slate-300">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[#174375] text-white">
                    <th className="py-2 px-3 text-left font-bold w-1/3 border-r border-blue-900">Field</th>
                    <th className="py-2 px-3 text-left font-bold">Example details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 text-slate-800">
                  <tr>
                    <td className="py-2 px-3 font-medium bg-slate-50/50 border-r border-slate-300">Hospital</td>
                    <td className="py-2 px-3">{report.hospital}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium bg-slate-50/50 border-r border-slate-300">Insurance provider / TPA</td>
                    <td className="py-2 px-3">{report.insuranceProvider}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium bg-slate-50/50 border-r border-slate-300">Claim type</td>
                    <td className="py-2 px-3">{report.claimType}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium bg-slate-50/50 border-r border-slate-300">Policy / claim reference</td>
                    <td className="py-2 px-3 font-mono font-medium">{report.policyReference}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium bg-slate-50/50 border-r border-slate-300">Date of report</td>
                    <td className="py-2 px-3">{report.reportDate}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 2. Patient Details */}
          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-[#174375]">
              2. Patient Details
            </h2>
            <div className="overflow-hidden rounded-sm border border-slate-300">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[#174375] text-white">
                    <th className="py-2 px-3 text-left font-bold w-1/3 border-r border-blue-900">Field</th>
                    <th className="py-2 px-3 text-left font-bold">Example details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 text-slate-800">
                  <tr>
                    <td className="py-2 px-3 font-medium bg-slate-50/50 border-r border-slate-300">Patient name</td>
                    <td className="py-2 px-3 font-semibold">{report.patientName}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium bg-slate-50/50 border-r border-slate-300">Age / gender</td>
                    <td className="py-2 px-3">{report.ageGender}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium bg-slate-50/50 border-r border-slate-300">Policyholder relationship</td>
                    <td className="py-2 px-3">{report.relationship}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium bg-slate-50/50 border-r border-slate-300">Patient ID</td>
                    <td className="py-2 px-3 font-mono">{report.patientId}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 3. Admission and Treatment Summary */}
          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-[#174375]">
              3. Admission and Treatment Summary
            </h2>
            <div className="overflow-hidden rounded-sm border border-slate-300">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[#174375] text-white">
                    <th className="py-2 px-3 text-left font-bold w-1/3 border-r border-blue-900">Field</th>
                    <th className="py-2 px-3 text-left font-bold">Example details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 text-slate-800">
                  <tr>
                    <td className="py-2 px-3 font-medium bg-slate-50/50 border-r border-slate-300">Admission date</td>
                    <td className="py-2 px-3">{report.admissionDate}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium bg-slate-50/50 border-r border-slate-300">Discharge date</td>
                    <td className="py-2 px-3">{report.dischargeDate}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium bg-slate-50/50 border-r border-slate-300">Department</td>
                    <td className="py-2 px-3">{report.department}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium bg-slate-50/50 border-r border-slate-300">Treating doctor</td>
                    <td className="py-2 px-3 font-medium">{report.doctor}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium bg-slate-50/50 border-r border-slate-300">Presenting complaints</td>
                    <td className="py-2 px-3 leading-relaxed">{report.presentingComplaints}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium bg-slate-50/50 border-r border-slate-300">Final diagnosis</td>
                    <td className="py-2 px-3 font-bold text-[#174375]">{report.diagnosis}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium bg-slate-50/50 border-r border-slate-300">Procedure</td>
                    <td className="py-2 px-3 font-medium">{report.procedure}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium bg-slate-50/50 border-r border-slate-300">Hospital course</td>
                    <td className="py-2 px-3 leading-relaxed">{report.hospitalCourse}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 4. Itemised Expense Summary */}
          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-[#174375]">
              4. Itemised Expense Summary
            </h2>
            <div className="overflow-hidden rounded-sm border border-slate-300">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[#174375] text-white">
                    <th className="py-2 px-3 text-left font-bold border-r border-blue-900">Expense category</th>
                    <th className="py-2 px-3 text-right font-bold w-36">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 text-slate-800">
                  <tr>
                    <td className="py-2 px-3 border-r border-slate-300">Room and nursing charges</td>
                    <td className="py-2 px-3 text-right font-mono">{report.expenses.room.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 border-r border-slate-300">Surgeon and anaesthesia fees</td>
                    <td className="py-2 px-3 text-right font-mono">{report.expenses.surgeon.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 border-r border-slate-300">Operation theatre and procedure</td>
                    <td className="py-2 px-3 text-right font-mono">{report.expenses.ot.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 border-r border-slate-300">Medicines and consumables</td>
                    <td className="py-2 px-3 text-right font-mono">{report.expenses.medicines.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 border-r border-slate-300">Laboratory and imaging</td>
                    <td className="py-2 px-3 text-right font-mono">{report.expenses.lab.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 border-r border-slate-300">Other hospital charges</td>
                    <td className="py-2 px-3 text-right font-mono">{report.expenses.other.toLocaleString()}</td>
                  </tr>
                  <tr className="bg-slate-50 font-bold">
                    <td className="py-2 px-3 border-r border-slate-300">Total hospital bill</td>
                    <td className="py-2 px-3 text-right font-mono">{report.expenses.totalBill.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 border-r border-slate-300 text-slate-600">Less: discount / amount adjusted</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-600">{report.expenses.discount.toLocaleString()}</td>
                  </tr>
                  <tr className="bg-blue-50/70 font-extrabold text-[#174375]">
                    <td className="py-2.5 px-3 border-r border-slate-300 text-sm">Net amount claimed</td>
                    <td className="py-2.5 px-3 text-right font-mono text-sm">{report.expenses.netClaimed.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 5. Supporting Documents Checklist (Page 1 portion) */}
          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-[#174375]">
              5. Supporting Documents Checklist
            </h2>
            <div className="overflow-hidden rounded-sm border border-slate-300">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[#174375] text-white">
                    <th className="py-2 px-3 text-left font-bold border-r border-blue-900">Document</th>
                    <th className="py-2 px-3 text-left font-bold w-48">Status in this example</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 text-slate-800">
                  {docsPage1.map((doc, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 border-r border-slate-300">{doc.name}</td>
                      <td className="py-2 px-3 text-slate-700 font-medium">{doc.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Page 1 Bottom Footer */}
          <div className="pt-8 text-center text-[10px] text-slate-400 uppercase tracking-widest border-t border-slate-200">
            FICTIONAL DEMO REPORT • Page 1
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════
            PAGE 2 CONTENT (Page break for print)
        ═════════════════════════════════════════════════════════════ */}
        <div className="page-break pt-12 space-y-6">
          
          {/* Top Running Header */}
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 tracking-wider uppercase border-b border-slate-200 pb-2">
            <span>FICTIONAL DEMO REPORT</span>
            <span>Page 2</span>
          </div>

          {/* 5. Supporting Documents Checklist (Continued) */}
          <section className="space-y-1.5 pt-2">
            <div className="overflow-hidden rounded-sm border border-slate-300">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[#174375] text-white">
                    <th className="py-2 px-3 text-left font-bold border-r border-blue-900">Document</th>
                    <th className="py-2 px-3 text-left font-bold w-48">Status in this example</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 text-slate-800">
                  {docsPage2.map((doc, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 border-r border-slate-300">{doc.name}</td>
                      <td className="py-2 px-3 text-slate-700 font-medium">{doc.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 6. Claim Summary */}
          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-[#174375]">
              6. Claim Summary
            </h2>
            <div className="overflow-hidden rounded-sm border border-slate-300">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[#174375] text-white">
                    <th className="py-2 px-3 text-left font-bold w-1/3 border-r border-blue-900">Field</th>
                    <th className="py-2 px-3 text-left font-bold">Example details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 text-slate-800">
                  <tr>
                    <td className="py-2 px-3 font-medium bg-slate-50/50 border-r border-slate-300">Total amount billed</td>
                    <td className="py-2 px-3 font-bold font-mono">₹{report.expenses.totalBill.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium bg-slate-50/50 border-r border-slate-300">Net amount requested</td>
                    <td className="py-2 px-3 font-bold text-[#174375] font-mono">₹{report.expenses.netClaimed.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium bg-slate-50/50 border-r border-slate-300">Claim decision</td>
                    <td className="py-2 px-3 text-slate-700">Pending insurer / TPA review</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium bg-slate-50/50 border-r border-slate-300">Additional information</td>
                    <td className="py-2 px-3 text-slate-600">Insurer may request further documents or clarification.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 7. Hospital Authorisation */}
          <section className="space-y-2">
            <div>
              <h2 className="text-sm font-bold text-[#174375]">
                7. Hospital Authorisation
              </h2>
              <p className="text-[11px] text-slate-600 italic">
                To be completed and authenticated by the hospital's authorised personnel. The sample intentionally leaves signature and seal blank.
              </p>
            </div>

            <div className="overflow-hidden rounded-sm border border-slate-300">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[#174375] text-white">
                    <th className="py-2 px-3 text-left font-bold w-1/3 border-r border-blue-900">Authorisation field</th>
                    <th className="py-2 px-3 text-left font-bold">For hospital completion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 text-slate-800">
                  <tr>
                    <td className="py-3 px-3 font-medium bg-slate-50/50 border-r border-slate-300">Treating doctor's signature</td>
                    <td className="py-3 px-3 text-slate-400 tracking-widest font-mono">________________________________________</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-medium bg-slate-50/50 border-r border-slate-300">Doctor's name and medical registration number</td>
                    <td className="py-3 px-3 text-slate-400 tracking-widest font-mono">________________________________________</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-medium bg-slate-50/50 border-r border-slate-300">Hospital authorised signatory</td>
                    <td className="py-3 px-3 text-slate-400 tracking-widest font-mono">________________________________________</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-medium bg-slate-50/50 border-r border-slate-300">Designation</td>
                    <td className="py-3 px-3 text-slate-400 tracking-widest font-mono">________________________________________</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-medium bg-slate-50/50 border-r border-slate-300">Date</td>
                    <td className="py-3 px-3 text-slate-600 font-mono">____ / ____ / ______</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-medium bg-slate-50/50 border-r border-slate-300">Hospital seal / official stamp</td>
                    <td className="py-3 px-3 text-slate-500 italic">Affix original hospital seal in this space</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* HOSPITAL SEAL / STAMP AREA BOX */}
            <div className="pt-2">
              <span className="text-xs font-bold text-[#174375] block uppercase tracking-wider mb-1.5">
                HOSPITAL SEAL / STAMP AREA
              </span>
              <div className="w-full sm:w-80 h-36 border border-slate-400 rounded-sm bg-slate-50/30 flex items-center justify-center text-center p-4">
                <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest">
                  Affix Official Seal Here
                </span>
              </div>
            </div>
          </section>

          {/* Important Legal & Compliance Notice */}
          <div className="p-3.5 rounded bg-slate-50 border border-slate-300 text-[11px] text-slate-600 leading-relaxed space-y-1">
            <strong className="text-slate-800 font-bold block">Important Notice:</strong>
            All names, dates, identifiers, diagnosis and amounts above are invented solely to demonstrate report formatting. The signature and
            seal must be provided by the actual hospital; do not imitate or fabricate them. A real claim must use verified hospital records and actual bills.
            Claim eligibility and payment are determined by the insurer under the policy terms.
          </div>

          {/* Page 2 Bottom Footer */}
          <div className="pt-6 text-center text-[10px] text-slate-400 uppercase tracking-widest border-t border-slate-200">
            FICTIONAL DEMO REPORT • Page 2
          </div>

        </div>

      </div>
    </div>
  );
};

export default InsuranceClaimReport;
