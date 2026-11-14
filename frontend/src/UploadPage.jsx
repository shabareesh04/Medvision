import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from './context/AuthContext';
import { Button } from "./components/ui/button";
import { Progress } from './components/ui/progress';
import { Alert, AlertDescription } from './components/ui/alert';
import { UploadCloud, X, Check, AlertCircle, FolderPlus, FileImage, Sparkles, RefreshCw, Home, ArrowLeft, ShieldCheck, UserCheck } from 'lucide-react';
import ImageTypeSelector from './components/ImageTypeSelector';
import SegmentedImageViewer from './components/SegmentedImageViewer';

const UploadPage = ({ selectedImageType, setSelectedImageType, setProcessedData }) => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setError(null);
    setFile(selectedFile);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const BASE_API_URL = import.meta.env.VITE_API_URL || '';

  const handleUpload = async () => {
    if (!file) return setError('Please select a file first.');
    if (!selectedImageType) return setError('Please select an image type from the options above.');

    let predictionEndpoint = '';
    let reportEndpoint = '';

    try {
      if (selectedImageType === 'xray') {
        predictionEndpoint = `${BASE_API_URL}/predict/xray/`;
        reportEndpoint = `${BASE_API_URL}/generate-report/xray/`;
      } else if (selectedImageType === 'ct_2d') {
        predictionEndpoint = `${BASE_API_URL}/predict/ct/2d/`;
        reportEndpoint = '';
      } else if (selectedImageType === 'ct_3d') {
        predictionEndpoint = `${BASE_API_URL}/predict/ct/3d/`;
        reportEndpoint = '';
      } else if (selectedImageType === 'mri_2d') {
        predictionEndpoint = `${BASE_API_URL}/predict/mri/2d/`;
        reportEndpoint = '';
      } else if (selectedImageType === 'mri_3d') {
        predictionEndpoint = `${BASE_API_URL}/predict/mri/3d/`;
        reportEndpoint = '';
      } else if (selectedImageType === 'ultrasound') {
        predictionEndpoint = `${BASE_API_URL}/predict/ultrasound/`;
        reportEndpoint = '';
      } else if (selectedImageType === 'fracture') {
        predictionEndpoint = `${BASE_API_URL}/predict/fracture/`;
        reportEndpoint = '';
      } else if (selectedImageType === 'brain_tumor') {
        predictionEndpoint = `${BASE_API_URL}/predict/brain-tumor/`;
        reportEndpoint = '';
      } else {
        return setError('Unsupported image type selected.');
      }
    } catch {
      return setError('Invalid image type format.');
    }

    try {
      setUploading(true);
      setError(null);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', file);

      const predictionRes = await axios.post(predictionEndpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });

      let reportData = {};
      if (selectedImageType === 'xray') {
        const reportRes = await axios.post(reportEndpoint, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        reportData = reportRes.data;
      } else {
        reportData = predictionRes.data;
      }

      const consolidatedData = {
        predictions: predictionRes.data.predictions || null,
        report: reportData.report,
        disease: reportData.disease,
        symptoms: reportData.symptoms || [],
        fracture_detected: reportData.fracture_detected || predictionRes.data.fracture_detected,
        bone_affected: reportData.bone_affected || predictionRes.data.bone_affected,
        body_region: reportData.body_region || predictionRes.data.body_region,
        fracture_type: reportData.fracture_type || predictionRes.data.fracture_type,
        severity: reportData.severity || predictionRes.data.severity,
        displacement: reportData.displacement || predictionRes.data.displacement,
        healing_time: reportData.healing_time || predictionRes.data.healing_time,
        confidence: reportData.confidence || predictionRes.data.confidence,
        imagePreview: preview,
        imageType: selectedImageType
      };

      setProcessedData(consolidatedData);

      navigate('/results', {
        state: {
          selectedImageType,
          processedData: consolidatedData,
        },
      });
    } catch (err) {
      console.error(err);
      const detailMsg = err.response?.data?.detail || err.message;
      setError(detailMsg ? `Analysis notice: ${detailMsg}` : 'An error occurred during upload or analysis. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060a14] text-white py-6 px-4 sm:px-6 lg:px-12 selection:bg-blue-500 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Navigation Breadcrumb / Clinician Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#091122] hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-all border border-slate-800 hover:border-slate-700 shadow-sm"
          >
            <Home className="h-3.5 w-3.5 text-blue-400" />
            <span>Home</span>
            <span className="text-slate-600">/</span>
            <span className="text-blue-400">Diagnosis Workspace</span>
          </Link>

          {user && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium shadow-sm">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Diagnostic Permission Granted: <strong className="text-white">{user.name}</strong> ({user.role || 'Authorized Clinician'})</span>
            </div>
          )}
        </div>

        {/* Error Alert if any */}
        {error && (
          <Alert variant="destructive" className="bg-red-950/80 border-red-800 text-red-200 backdrop-blur-md rounded-xl">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <AlertDescription className="ml-2 font-medium">{error}</AlertDescription>
          </Alert>
        )}

        {/* 1. Image Type Selector Grid */}
        <ImageTypeSelector
          selectedImageType={selectedImageType}
          setSelectedImageType={setSelectedImageType}
        />

        {/* 2. Drag & Drop Upload Container */}
        <div
          className={`
            relative rounded-2xl p-7 transition-all duration-300 ease-out
            bg-[#091122]/90 backdrop-blur-xl
            border border-dashed
            ${preview
              ? 'border-blue-500/80 shadow-[0_0_30px_rgba(59,130,246,0.25)]'
              : 'border-blue-500/30 hover:border-blue-400/60 hover:shadow-[0_0_25px_rgba(59,130,246,0.15)]'
            }
          `}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();

            const droppedFile = e.dataTransfer.files[0];
            if (!droppedFile) return;

            setFile(droppedFile);
            setError(null);

            const reader = new FileReader();
            reader.onloadend = () => {
              setPreview(reader.result);
            };
            reader.readAsDataURL(droppedFile);
          }}
        >
          {/* Hidden file input */}
          <input
            type="file"
            onChange={handleFileChange}
            accept="image/*,.nii,.nii.gz,.dcm"
            className="hidden"
            ref={fileInputRef}
          />

          {!preview ? (
            /* Empty state: 3-column split exactly matching reference screenshot */
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-3">
              
              {/* Left Column: Folder icon + text */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-4 cursor-pointer group"
              >
                <div className="p-3.5 rounded-2xl bg-[#111a33] border border-slate-700/60 text-slate-300 group-hover:border-blue-500/50 group-hover:text-blue-400 transition-all shadow-inner">
                  <FolderPlus className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">
                    Drag & drop your medical image here
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Supports: DICOM, PNG, JPG, JPEG
                  </p>
                </div>
              </div>

              {/* Center Column: Glowing circular upload button */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center cursor-pointer group my-2 md:my-0"
              >
                <div className="w-16 h-16 rounded-full bg-blue-500/20 shadow-[0_0_35px_rgba(59,130,246,0.55)] flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_45px_rgba(99,102,241,0.75)]">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-lg">
                    <UploadCloud className="h-6 w-6 transition-transform duration-300 group-hover:-translate-y-0.5" />
                  </div>
                </div>
              </div>

              {/* Right Column: Browse link & file size info */}
              <div className="text-center md:text-right">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm font-semibold text-blue-400 hover:text-blue-300 hover:underline transition-colors cursor-pointer"
                >
                  or click to browse
                </button>
                <p className="text-xs text-slate-400 mt-0.5">
                  Maximum file size: 50MB
                </p>
              </div>

            </div>
          ) : (
            /* File Preview state */
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-2">
              
              {/* Preview thumbnail & file details */}
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative group/thumb w-20 h-20 rounded-xl overflow-hidden bg-slate-900 border border-slate-700/80 shadow-md flex-shrink-0">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                    <FileImage className="h-6 w-6 text-white" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white truncate max-w-[240px] sm:max-w-sm">
                      {file?.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Ready
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {(file.size / 1024).toFixed(1)} KB • {file.type || 'Medical Scan'}
                  </p>
                  <p className="text-xs text-blue-400 mt-0.5 font-medium">
                    Selected Scan: {selectedImageType ? selectedImageType.replace(/_/g, ' ').toUpperCase() : 'None'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                    setError(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white"
                >
                  <X className="h-4 w-4 mr-1.5 text-red-400" />
                  Remove
                </Button>

                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold px-6 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300"
                >
                  {uploading ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Analyzing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-cyan-300" />
                      Upload & Analyze
                    </span>
                  )}
                </Button>
              </div>

            </div>
          )}

          {/* Upload Progress Bar */}
          {uploading && (
            <div className="space-y-2 mt-5 pt-4 border-t border-slate-800">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Uploading to AI pipeline...</span>
                <span className="text-blue-400 font-bold">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-1.5 bg-slate-800" />
            </div>
          )}
        </div>

        {/* 3. Segmented Image Viewer (if preview exists) */}
        {preview && (
          <div className="mt-8">
            <SegmentedImageViewer imageUrl={preview} imageType={selectedImageType} />
          </div>
        )}

      </div>
    </div>
  );
};

export default UploadPage;
