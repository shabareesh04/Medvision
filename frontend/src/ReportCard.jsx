import React, { useRef, useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import ReportPDF from './components/ReportPDF';
import { useNavigate } from 'react-router-dom';
import SkeletalBodyMap from './components/SkeletalBodyMap';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs';
import {
  Download,
  Printer,
  Share2,
  Check,
  AlertTriangle,
  Stethoscope,
  TestTube2,
  MessageSquare,
  Shield,
  Activity,
  FileText,
  Info,
  Clock,
  Sparkles,
  ExternalLink,
  Bone,
  Crosshair,
  ShieldAlert,
  Flame
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from './components/ui/dialog';

const ReportCard = ({ 
  report, 
  imagePreview: _imagePreview, 
  imageType,
  fractureDetected,
  boneAffected,
  bodyRegion,
  fractureType,
  severity,
  displacement,
  healingTime
}) => {
  const {
    symptoms = [],
    diagnosis = 'Medical Analysis Completed',
    confidence = 94,
    recommendations = [],
    suggested_tests = [],
    specialty = 'General Physician',
    report: detailedReport = '',
    timestamp = new Date().toISOString()
  } = report || {};

  const navigate = useNavigate();
  const cardRef = useRef(null);
  const [openDialog, setOpenDialog] = useState(false);

  // Determine if this diagnosis involves bone fracture / skeletal trauma
  const isFracture = 
    imageType === 'fracture' || 
    (diagnosis && diagnosis.toLowerCase().includes('fracture')) || 
    (fractureDetected && fractureDetected.toLowerCase().includes('yes')) ||
    (report?.fracture_detected && report.fracture_detected.toLowerCase().includes('yes')) ||
    (detailedReport && detailedReport.toLowerCase().includes('fracture detected: yes'));

  const resolvedBone = boneAffected || report?.bone_affected || (diagnosis.includes('(') ? diagnosis.split('(')[0].replace('Fracture:', '').trim() : 'Affected Bone Structure');
  const resolvedRegion = bodyRegion || report?.body_region || 'Skeletal Region';
  const resolvedType = fractureType || report?.fracture_type || (diagnosis.includes('(') ? diagnosis.split('(')[1].replace(')', '').trim() : 'Bone Fracture');
  const resolvedSeverity = severity || report?.severity || 'Moderate';
  const resolvedDisplacement = displacement || report?.displacement || 'Assessed on radiograph';
  const resolvedHealingTime = healingTime || report?.healing_time || '6 to 8 Weeks';

  const getConfidenceBadge = (score) => {
    if (score >= 85) return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    if (score >= 70) return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
  };

  const handleDownload = async () => {
    try {
      const fullReport = { ...report, report: detailedReport };
      const blob = await pdf(<ReportPDF reportData={fullReport} />).toBlob();
      saveAs(blob, `diagnostic-report-${diagnosis.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      window.print();
    }
  };

  const handlePrint = () => window.print();

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'MediVision AI Diagnostic Report',
        text: `Diagnosis: ${diagnosis} (Confidence: ${confidence}%)`,
        url: window.location.href
      }).catch((err) => console.log('Share canceled or failed', err));
    } else {
      navigator.clipboard?.writeText(window.location.href);
      alert('Report link copied to clipboard!');
    }
  };

  return (
    <Card 
      className="w-full bg-[#091122]/90 border border-slate-800/80 backdrop-blur-xl text-white shadow-[0_0_40px_rgba(59,130,246,0.15)] rounded-2xl overflow-hidden print:bg-white print:text-black print:shadow-none print:border-none" 
      ref={cardRef}
    >
      {/* Header Banner */}
      <CardHeader className="pb-4 border-b border-slate-800/80 bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                {isFracture ? (
                  <Bone className="h-5 w-5 text-orange-400 animate-pulse" />
                ) : (
                  <Activity className="h-5 w-5 text-cyan-400 animate-pulse" />
                )}
              </div>
              <div>
                <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white via-slate-100 to-blue-200 bg-clip-text text-transparent">
                  {isFracture ? 'Full-Body Skeletal Trauma & Diagnostic Report' : 'Clinical Diagnostic Report'}
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs flex items-center gap-2 mt-0.5">
                  <Clock className="h-3 w-3 text-slate-500" />
                  <span>
                    Generated on {new Date(timestamp).toLocaleDateString(undefined, { dateStyle: 'medium' })} at{' '}
                    {new Date(timestamp).toLocaleTimeString(undefined, { timeStyle: 'short' })}
                  </span>
                  {imageType && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
                      {imageType.replace(/_/g, ' ')}
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className={`px-3 py-1 text-xs font-bold rounded-lg border ${getConfidenceBadge(confidence)}`}>
              <Sparkles className="h-3 w-3 mr-1.5" />
              {confidence}% Confidence
            </Badge>
          </div>
        </div>
      </CardHeader>

      {/* Main Tabbed Interface */}
      <Tabs defaultValue={isFracture ? "skeletal" : "summary"} className="w-full">
        <div className="px-6 pt-5">
          <TabsList className={`grid w-full ${isFracture ? 'grid-cols-6' : 'grid-cols-5'} bg-[#060a14] border border-slate-800/90 p-1 rounded-xl text-slate-400 text-xs`}>
            {isFracture && (
              <TabsTrigger 
                value="skeletal" 
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-red-600 data-[state=active]:text-white font-bold text-xs transition-all flex items-center gap-1.5"
              >
                <Bone className="h-3.5 w-3.5" /> Body Map
              </TabsTrigger>
            )}
            <TabsTrigger 
              value="summary" 
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white font-medium text-xs transition-all"
            >
              Summary
            </TabsTrigger>
            <TabsTrigger 
              value="findings" 
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white font-medium text-xs transition-all"
            >
              Findings
            </TabsTrigger>
            <TabsTrigger 
              value="recommendations" 
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white font-medium text-xs transition-all"
            >
              Protocol
            </TabsTrigger>
            <TabsTrigger 
              value="tests" 
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white font-medium text-xs transition-all"
            >
              Suggested Tests
            </TabsTrigger>
            <TabsTrigger 
              value="detailed" 
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white font-medium text-xs transition-all"
            >
              Detailed Report
            </TabsTrigger>
          </TabsList>
        </div>

        {/* 0. Full-Body Skeletal Map Tab (Specialized for Bone Fractures) */}
        {isFracture && (
          <TabsContent value="skeletal" className="p-6 space-y-6">
            <SkeletalBodyMap
              boneAffected={resolvedBone}
              bodyRegion={resolvedRegion}
              fractureType={resolvedType}
              severity={resolvedSeverity}
              displacement={resolvedDisplacement}
              healingTime={resolvedHealingTime}
              confidence={confidence}
              isFracture={true}
            />
          </TabsContent>
        )}

        {/* 1. Summary Tab */}
        <TabsContent value="summary" className="p-6 space-y-6">
          
          {/* If Fracture, show top highlight with bone & region */}
          {isFracture && (
            <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/40">
                  <Crosshair className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-orange-300">Fractured Bone Localized</h4>
                  <p className="text-xs text-slate-300">
                    <strong className="text-white">{resolvedBone}</strong> in <span className="text-orange-200">{resolvedRegion}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-300 font-semibold">
                  Type: {resolvedType}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 font-semibold">
                  Est. Recovery: {resolvedHealingTime}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Primary Diagnosis Highlight */}
            <div className="md:col-span-2 p-5 rounded-2xl bg-gradient-to-br from-[#0c162d] to-[#091122] border border-blue-500/30 shadow-[0_0_25px_rgba(59,130,246,0.1)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Primary Diagnosis</span>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getConfidenceBadge(confidence)}`}>
                  {confidence}% Match
                </span>
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight mb-2">
                {diagnosis}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                {confidence >= 85
                  ? 'High confidence prediction based on automated multimodal vision and anatomical radiologic analysis.'
                  : confidence >= 70
                  ? 'Moderate diagnostic confidence. Clinical verification is recommended.'
                  : 'Preliminary finding with lower confidence score. Specialist consultation strongly advised.'}
              </p>
            </div>

            {/* Specialist Card */}
            <div className="p-5 rounded-2xl bg-[#0c162d]/80 border border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Recommended Specialist</span>
                <div className="flex items-center gap-3 mt-3">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    <Stethoscope className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">{specialty || (isFracture ? 'Orthopedic Surgeon' : 'Radiologist')}</h4>
                    <p className="text-xs text-slate-400">Target Clinical Field</p>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/search-doctor')}
                className="mt-4 w-full border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-blue-300 hover:text-white text-xs font-semibold"
              >
                Find {specialty || 'Orthopedic Specialist'} Near Me
                <ExternalLink className="h-3 w-3 ml-1.5" />
              </Button>
            </div>

          </div>

          {/* Quick Symptoms / Detected Markers Overview */}
          {symptoms && symptoms.length > 0 && (
            <div className="p-5 rounded-2xl bg-[#060a14]/60 border border-slate-800/80">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-blue-400" />
                Detected Pathological & Anatomical Indicators
              </h4>
              <div className="flex flex-wrap gap-2">
                {symptoms.map((symptom, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-300 text-xs font-medium"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    {symptom}
                  </span>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* 2. Findings Tab */}
        <TabsContent value="findings" className="p-6 space-y-4">
          <div className="p-5 rounded-2xl bg-[#060a14]/60 border border-slate-800/80 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-400" />
              Radiological Observations & Findings
            </h4>
            <ul className="space-y-3">
              {symptoms && symptoms.length ? (
                symptoms.map((symptom, index) => (
                  <li key={index} className="flex items-start gap-3 p-3.5 rounded-xl bg-[#091122] border border-slate-800/80">
                    <div className="mt-0.5 rounded-full bg-blue-500/20 p-1 text-blue-400 border border-blue-500/30">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-200">{symptom}</span>
                      <p className="text-xs text-slate-400 mt-0.5">Identified through AI feature extraction & bone cortex analysis</p>
                    </div>
                  </li>
                ))
              ) : (
                <p className="text-sm text-slate-400 italic">No specific abnormalities detected in this scan.</p>
              )}
            </ul>
          </div>
        </TabsContent>

        {/* 3. Recommendations Tab */}
        <TabsContent value="recommendations" className="p-6 space-y-4">
          
          {/* Emergency First-Aid Quick Action (For Fractures) */}
          {isFracture && (
            <div className="p-5 rounded-2xl bg-rose-950/30 border border-rose-800/50 space-y-3">
              <h4 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-400" />
                Immediate Emergency First-Aid & Immobilization Protocol
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                <div className="p-3 rounded-xl bg-[#091122] border border-rose-900/40">
                  <strong className="text-rose-300 block mb-1">1. Rigid Immobilization:</strong>
                  Do not attempt to realign or push protruding bone. Splint the joint above and below the fracture.
                </div>
                <div className="p-3 rounded-xl bg-[#091122] border border-rose-900/40">
                  <strong className="text-rose-300 block mb-1">2. Zero Weight Bearing:</strong>
                  Avoid placing weight or pressure on the injured limb to prevent displacement or neurovascular injury.
                </div>
                <div className="p-3 rounded-xl bg-[#091122] border border-rose-900/40">
                  <strong className="text-rose-300 block mb-1">3. Cold Therapy & Elevation:</strong>
                  Apply covered ice packs for 15-20 mins to reduce swelling. Elevate above heart level if tolerated.
                </div>
                <div className="p-3 rounded-xl bg-[#091122] border border-rose-900/40">
                  <strong className="text-rose-300 block mb-1">4. Urgent Orthopedic Care:</strong>
                  Seek immediate evaluation at an emergency clinic or with an orthopedic trauma specialist.
                </div>
              </div>
            </div>
          )}

          <div className="p-5 rounded-2xl bg-[#060a14]/60 border border-slate-800/80 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-400" />
              Clinical Recommendations & Treatment Roadmap
            </h4>
            <ul className="space-y-3">
              {recommendations && recommendations.length ? (
                recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-3 p-3.5 rounded-xl bg-[#091122] border border-slate-800/80">
                    <div className="mt-0.5 rounded-full bg-emerald-500/20 p-1 text-emerald-400 border border-emerald-500/30">
                      <Check className="h-3 w-3 text-emerald-400" />
                    </div>
                    <span className="text-sm font-medium text-slate-200">{rec}</span>
                  </li>
                ))
              ) : (
                <p className="text-sm text-slate-400 italic">No specific recommendations generated.</p>
              )}
            </ul>
          </div>
        </TabsContent>

        {/* 4. Suggested Tests Tab */}
        <TabsContent value="tests" className="p-6">
          <div className="p-5 rounded-2xl bg-[#060a14]/60 border border-slate-800/80 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <TestTube2 className="h-4 w-4 text-indigo-400" />
              Suggested Confirmatory Diagnostic Tests
            </h4>
            <ul className="space-y-3">
              {suggested_tests && suggested_tests.length ? (
                suggested_tests.map((test, i) => (
                  <li key={i} className="flex items-start gap-3 p-3.5 rounded-xl bg-[#091122] border border-slate-800/80">
                    <div className="mt-0.5 rounded-full bg-indigo-500/20 p-1 text-indigo-400 border border-indigo-500/30">
                      <TestTube2 className="h-3.5 w-3.5 text-indigo-400" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-200">{test}</span>
                      <p className="text-xs text-slate-400 mt-0.5">Recommended to verify cortical alignment and articular surface continuity</p>
                    </div>
                  </li>
                ))
              ) : (
                <p className="text-sm text-slate-400 italic">No additional tests indicated at this time.</p>
              )}
            </ul>
          </div>
        </TabsContent>

        {/* 5. Detailed Report Tab */}
        <TabsContent value="detailed" className="p-6">
          <div className="p-5 rounded-2xl bg-[#060a14]/60 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-cyan-400" />
                Full Clinical AI Narrative & Explanation
              </h4>
              <span className="text-xs text-slate-500 font-mono">Gemini Multimodal Vision</span>
            </div>
            {detailedReport ? (
              <div className="whitespace-pre-line text-sm text-slate-300 leading-relaxed font-sans bg-[#080e1e] border border-slate-800/90 rounded-xl p-5 shadow-inner">
                {detailedReport}
              </div>
            ) : (
              <p className="text-sm italic text-slate-400">No detailed narrative report available from AI model.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer Actions */}
      <CardFooter className="pt-4 pb-6 px-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 bg-[#060a14]/40 print:hidden">
        
        {/* Left Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            onClick={handleDownload} 
            className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-xs shadow-md shadow-blue-500/20"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" /> Download PDF
          </Button>

          <Button 
            variant="outline" 
            size="sm"
            onClick={handlePrint}
            className="border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white text-xs"
          >
            <Printer className="mr-1.5 h-3.5 w-3.5" /> Print
          </Button>

          <Button 
            variant="outline" 
            size="sm"
            onClick={handleShare}
            className="border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white text-xs"
          >
            <Share2 className="mr-1.5 h-3.5 w-3.5" /> Share
          </Button>

          {/* More Info Dialog */}
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white text-xs"
              >
                <Info className="mr-1.5 h-3.5 w-3.5" /> More Info
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg bg-[#091122] border-slate-800 text-white">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-400" />
                  Diagnostic Summary Breakdown
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-xs text-slate-300 mt-2">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <strong className="text-blue-400">Diagnosis:</strong> {diagnosis}
                </div>
                {isFracture && (
                  <>
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                      <strong className="text-orange-400">Bone Affected:</strong> {resolvedBone}
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                      <strong className="text-orange-400">Body Region:</strong> {resolvedRegion}
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                      <strong className="text-orange-400">Classification:</strong> {resolvedType} ({resolvedDisplacement})
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                      <strong className="text-orange-400">Estimated Healing Time:</strong> {resolvedHealingTime}
                    </div>
                  </>
                )}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <strong className="text-blue-400">Confidence:</strong> {confidence}%
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <strong className="text-blue-400">Recommended Specialist:</strong> {specialty || (isFracture ? 'Orthopedic Surgeon' : 'General Physician')}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Right Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/resultchat')}
            className="border-blue-500/40 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 text-xs font-semibold"
          >
            <MessageSquare className="mr-1.5 h-3.5 w-3.5 text-cyan-400" /> Chat with AI
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/search-doctor')}
            className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 text-xs font-semibold"
          >
            <Stethoscope className="mr-1.5 h-3.5 w-3.5 text-emerald-400" /> Find {isFracture ? 'Orthopedic' : 'Doctor'}
          </Button>

          <Button
            size="sm"
            onClick={() => navigate('/insurance/claims/create', {
              state: {
                diagnosis: diagnosis,
                confidence: confidence,
                specialty: specialty || (isFracture ? 'Orthopedic Surgeon' : 'General Physician'),
                report: detailedReport,
                hospital: 'MediVision Partner Trauma Network',
                doctor: `Specialist (${specialty || (isFracture ? 'Orthopedics' : 'General')})`
              }
            })}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20"
          >
            <Shield className="mr-1.5 h-3.5 w-3.5" /> Prepare Insurance Report
          </Button>
        </div>

      </CardFooter>
    </Card>
  );
};

export default ReportCard;
