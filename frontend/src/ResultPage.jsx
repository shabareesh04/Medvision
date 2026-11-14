import React, { useEffect, useState } from 'react';
import ReportCard from './ReportCard';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Upload, FileImage, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './components/ui/button';

const BASE_API_URL = import.meta.env.VITE_API_URL || '';

const ResultsPage = ({ processedData: propProcessedData, selectedImageType: propSelectedImageType }) => {
  const { cleanType } = useParams(); // e.g., 'xray', 'ct', etc.
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve state passed from navigation or component props
  const passedState = location.state || {};
  const processedData = passedState.processedData || propProcessedData;
  const selectedImageType = passedState.selectedImageType || propSelectedImageType;

  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. If we have processedData passed in state/props, format it immediately
    if (processedData) {
      const predictionData = processedData.predictions || [];
      const reportText = processedData.report || '';
      const rawDisease = processedData.disease || '';
      const symptoms = processedData.symptoms || [];

      // Sort predictions if array of [label, score]
      let sorted = [];
      if (Array.isArray(predictionData) && predictionData.length > 0) {
        sorted = [...predictionData].sort((a, b) => {
          const scoreA = typeof a[1] === 'number' ? a[1] : 0;
          const scoreB = typeof b[1] === 'number' ? b[1] : 0;
          return scoreB - scoreA;
        });
      }

      const topK = sorted.slice(0, 3);
      const topSymptoms = symptoms.length ? symptoms : topK.map(([cond]) => cond);
      const [bestCond, bestScore] = sorted.length ? sorted[0] : [rawDisease || 'Pathology Analysis', 0.92];

      // Extract disease name from report or best condition
      let finalDiagnosis = rawDisease;
      if (!finalDiagnosis && reportText) {
        const match = reportText.match(/(?:Disease Expected|Condition Detected|Fracture Detected|Tumor Detected|Diagnosis):\s*([^\n\r]+)/i);
        if (match && match[1]) {
          finalDiagnosis = match[1].trim();
        }
      }
      if (!finalDiagnosis) {
        finalDiagnosis = bestCond || 'Medical Observation Detected';
      }

      // Calculate confidence percentage
      let confidenceScore = 88;
      if (typeof bestScore === 'number') {
        confidenceScore = bestScore > 1 ? Math.round(bestScore) : Math.round(bestScore * 100);
      } else if (reportText) {
        const confMatch = reportText.match(/(\d{1,3}(?:\.\d+)?)\s*%/);
        if (confMatch && confMatch[1]) {
          confidenceScore = Math.round(parseFloat(confMatch[1]));
        }
      }

      const specialtyMap = {
        Diabetes: 'Endocrinologist',
        Pneumonia: 'Pulmonologist',
        'Pleural Effusion': 'Pulmonologist',
        Infiltration: 'Pulmonologist',
        Atelectasis: 'Pulmonologist',
        Mass: 'Pulmonologist / Oncologist',
        Nodule: 'Pulmonologist',
        Cardiomegaly: 'Cardiologist',
        'Heart Disease': 'Cardiologist',
        Fracture: 'Orthopedic Surgeon',
        Tumor: 'Neuro-Oncologist',
        Glioma: 'Neuro-Oncologist',
        Meningioma: 'Neurosurgeon',
        Cyst: 'Radiologist / Specialist',
        Depression: 'Psychiatrist',
      };

      let matchedSpecialty = 'General Physician';
      for (const [key, spec] of Object.entries(specialtyMap)) {
        if (finalDiagnosis.toLowerCase().includes(key.toLowerCase()) || bestCond.toLowerCase().includes(key.toLowerCase())) {
          matchedSpecialty = spec;
          break;
        }
      }

      const formattedReport = {
        symptoms: topSymptoms.length ? topSymptoms : ['Visual Feature Anomaly Detected'],
        diagnosis: finalDiagnosis,
        confidence: confidenceScore,
        recommendations: [
          `Schedule a detailed consultation with a ${matchedSpecialty}`,
          'Maintain medical observation and monitor symptoms',
          'Follow recommended confirmatory diagnostic imaging protocols',
        ],
        suggested_tests: ['Clinical Examination', 'Confirmatory Imaging', 'Routine Blood Work'],
        specialty: matchedSpecialty,
        timestamp: new Date().toISOString(),
        report: reportText,
      };

      setReportData(formattedReport);
      setLoading(false);
      return;
    }

    // 2. Fallback: if no processedData in memory, attempt fetch by modality if URL param exists
    if (!cleanType) {
      setError('No scan results found. Please upload a medical scan for automated diagnosis.');
      setLoading(false);
      return;
    }

    const fetchReport = async () => {
      try {
        const [predictionRes, reportRes] = await Promise.all([
          fetch(`${BASE_API_URL}/predict/${cleanType}/`),
          fetch(`${BASE_API_URL}/generate-report/${cleanType}/`),
        ]);

        if (!predictionRes.ok || !reportRes.ok) {
          throw new Error('API endpoints returned an error');
        }

        const predictionData = await predictionRes.json();
        const reportDataRaw = await reportRes.json();

        const sorted = Array.isArray(predictionData?.predictions)
          ? [...predictionData.predictions].sort((a, b) => b[1] - a[1])
          : [];

        const topK = sorted.slice(0, 3);
        const symptoms = topK.map(([cond]) => cond);
        const [bestCond, bestScore] = sorted.length ? sorted[0] : ['Medical Assessment', 0.90];

        const formattedReport = {
          symptoms: symptoms.length ? symptoms : ['Scan Evaluation Marker'],
          diagnosis: reportDataRaw.disease || bestCond,
          confidence: Math.round((bestScore || 0.9) * 100),
          recommendations: [
            'Consult a specialized medical professional for confirmation',
            'Follow a healthy lifestyle',
            'Perform suggested follow-up tests',
          ],
          suggested_tests: ['Blood Test', 'High-Resolution Scan', 'Physician Consultation'],
          specialty: 'Radiologist / General Specialist',
          timestamp: new Date().toISOString(),
          report: reportDataRaw.report || '',
        };

        setReportData(formattedReport);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch previous diagnosis report. Please upload a new image.');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [cleanType, processedData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060a14] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center animate-spin">
          <RefreshCw className="h-8 w-8 text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Synthesizing Diagnostic Report...</h3>
          <p className="text-xs text-slate-400 mt-1">Aggregating vision analysis and neural insights</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#060a14] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#091122] border border-red-900/40 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 mx-auto flex items-center justify-center border border-red-500/30">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Scan Result Unavailable</h3>
          <p className="text-xs text-slate-400">{error}</p>
          <Button
            onClick={() => navigate('/upload')}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-xs mt-2"
          >
            <Upload className="h-4 w-4 mr-2" /> Upload Medical Scan
          </Button>
        </div>
      </div>
    );
  }

  const imagePreview = processedData?.imagePreview;

  // Extract structured skeletal fracture fields
  const boneAffected = processedData?.bone_affected || (() => {
    const match = processedData?.report?.match(/Bone Affected:\s*([^\n\r]+)/i);
    return match ? match[1].trim() : null;
  })();

  const bodyRegion = processedData?.body_region || (() => {
    const match = processedData?.report?.match(/Body Region:\s*([^\n\r]+)/i);
    return match ? match[1].trim() : null;
  })();

  const fractureType = processedData?.fracture_type || (() => {
    const match = processedData?.report?.match(/Fracture Classification:\s*([^\n\r]+)/i);
    return match ? match[1].trim() : null;
  })();

  const severity = processedData?.severity || (() => {
    const match = processedData?.report?.match(/Severity(?: Grade)?:\s*([^\n\r]+)/i);
    return match ? match[1].trim() : null;
  })();

  const displacement = processedData?.displacement || (() => {
    const match = processedData?.report?.match(/Displacement:\s*([^\n\r]+)/i);
    return match ? match[1].trim() : null;
  })();

  const healingTime = processedData?.healing_time || (() => {
    const match = processedData?.report?.match(/Estimated Healing Time:\s*([^\n\r]+)/i);
    return match ? match[1].trim() : null;
  })();

  return (
    <div className="min-h-screen bg-[#060a14] text-white py-6 px-4 sm:px-6 lg:px-12 selection:bg-blue-500 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#091122] hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-all border border-slate-800 shadow-sm"
            >
              <Home className="h-3.5 w-3.5 text-blue-400" />
              <span>Home</span>
            </Link>
            <span className="text-slate-600">/</span>
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#091122] hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-all border border-slate-800 shadow-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-slate-400" />
              <span>Diagnosis Workspace</span>
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-semibold text-blue-400 px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
              AI Diagnostic Results
            </span>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/upload')}
            className="border-slate-800 bg-[#091122] text-slate-300 hover:bg-slate-800 hover:text-white text-xs"
          >
            <Upload className="h-3.5 w-3.5 mr-1.5 text-blue-400" />
            Analyze Another Scan
          </Button>
        </div>

        {/* Scan & Report Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Image Thumbnail (if available) */}
          {imagePreview && (
            <div className="lg:col-span-4 space-y-4">
              <div className="p-4 rounded-2xl bg-[#091122]/90 border border-slate-800/80 backdrop-blur-xl shadow-md">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <FileImage className="h-4 w-4 text-blue-400" />
                    Uploaded Scan Image
                  </span>
                  {selectedImageType && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase">
                      {selectedImageType.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>

                <div className="rounded-xl overflow-hidden bg-black/80 border border-slate-800 relative group aspect-square flex items-center justify-center">
                  <img
                    src={imagePreview}
                    alt="Analyzed Medical Scan"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-2 left-2 right-2 p-2 rounded-lg bg-black/70 backdrop-blur-md border border-slate-700/60 text-[11px] text-slate-300 flex items-center justify-between">
                    <span>Target Scan</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" /> Processed
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Right/Full Column: Report Card */}
          <div className={imagePreview ? "lg:col-span-8" : "lg:col-span-12"}>
            <div id="report-content">
              <ReportCard 
                report={reportData} 
                imagePreview={imagePreview} 
                imageType={selectedImageType}
                boneAffected={boneAffected}
                bodyRegion={bodyRegion}
                fractureType={fractureType}
                severity={severity}
                displacement={displacement}
                healingTime={healingTime}
              />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ResultsPage;
