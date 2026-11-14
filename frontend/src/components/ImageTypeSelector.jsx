import React from 'react';
import { Brain, Bone, ScanHeart, AudioWaveform, ArrowRight, ShieldCheck, Check, Activity } from 'lucide-react';
import { MriWatermark, XrayWatermark, Ct2dWatermark, CtTumor3dWatermark, UltrasoundWatermark, FractureWatermark } from './MedicalWatermarks';

const imageTypes = [
  {
    id: 'fracture',
    name: 'Bone Fracture (Full Body)',
    description: 'AI detection across all 206 bones with anatomical body localization',
    icon: Bone,
    iconBg: 'bg-[#ea580c]',
    iconShadow: 'shadow-orange-500/30',
    accentColor: 'text-[#fb923c]',
    btnBorder: 'border-orange-500/40 text-orange-400 group-hover:border-orange-400 group-hover:bg-orange-500/10',
    Watermark: FractureWatermark,
  },
  {
    id: 'xray',
    name: 'Chest & General X-Ray',
    description: 'Pulmonary conditions, thoracic trauma, and general radiography',
    icon: Activity,
    iconBg: 'bg-[#0284c7]',
    iconShadow: 'shadow-sky-500/30',
    accentColor: 'text-[#38bdf8]',
    btnBorder: 'border-sky-500/40 text-sky-400 group-hover:border-sky-400 group-hover:bg-sky-500/10',
    Watermark: XrayWatermark,
  },
  {
    id: 'mri_3d',
    name: 'MRI (Soft Tissue)',
    description: '3D MRI scans for volumetric soft tissue and neurology analysis',
    icon: Brain,
    iconBg: 'bg-[#9333ea]',
    iconShadow: 'shadow-purple-500/30',
    accentColor: 'text-[#c084fc]',
    btnBorder: 'border-purple-500/40 text-purple-400 group-hover:border-purple-400 group-hover:bg-purple-500/10',
    Watermark: MriWatermark,
  },
  {
    id: 'brain_tumor',
    name: 'Brain Tumor (Neuro)',
    description: 'Specialized MRI & CT analysis for brain neoplasm detection',
    icon: Brain,
    iconBg: 'bg-[#db2777]',
    iconShadow: 'shadow-pink-500/30',
    accentColor: 'text-[#f472b6]',
    btnBorder: 'border-pink-500/40 text-pink-400 group-hover:border-pink-400 group-hover:bg-pink-500/10',
    Watermark: CtTumor3dWatermark,
  },
  {
    id: 'ct_2d',
    name: 'CT Scan (2D)',
    description: '2D CT slices for cross-sectional internal anatomy',
    icon: ScanHeart,
    iconBg: 'bg-[#2563eb]',
    iconShadow: 'shadow-blue-500/30',
    accentColor: 'text-[#60a5fa]',
    btnBorder: 'border-blue-500/40 text-blue-400 group-hover:border-blue-400 group-hover:bg-blue-500/10',
    Watermark: Ct2dWatermark,
  },
  {
    id: 'ultrasound',
    name: 'Ultrasound',
    description: 'Real-time acoustic imaging for abdominal & soft tissue assessment',
    icon: AudioWaveform,
    iconBg: 'bg-[#059669]',
    iconShadow: 'shadow-emerald-500/30',
    accentColor: 'text-[#34d399]',
    btnBorder: 'border-emerald-500/40 text-emerald-400 group-hover:border-emerald-400 group-hover:bg-emerald-500/10',
    Watermark: UltrasoundWatermark,
  },
];

const ImageTypeSelector = ({ selectedImageType, setSelectedImageType }) => {
  return (
    <div className="space-y-6">
      {/* Top Header Row with Title & AI Analysis Widget */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Select Scan Type</h1>
          <p className="text-slate-400 text-sm mt-1.5 font-normal">Choose the type of medical scan you want to analyze</p>
          <div className="w-12 h-1 bg-[#2563eb] rounded-full mt-3"></div>
        </div>

        {/* AI-Powered Analysis Widget */}
        <div className="flex items-center gap-4 bg-[#0a1020]/95 border border-slate-800/90 rounded-2xl px-5 py-3.5 shadow-xl backdrop-blur-md">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-400">AI-Powered Analysis</p>
            <p className="text-xs text-slate-400 max-w-[240px] leading-snug">
              Advanced AI models for accurate and fast medical image analysis
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Medical Scan Cards (2 rows of 3 on large screens) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {imageTypes.map((type) => {
          const IconComponent = type.icon;
          const WatermarkComponent = type.Watermark;
          const isSelected = selectedImageType === type.id;

          return (
            <div
              key={type.id}
              onClick={() => setSelectedImageType(type.id)}
              className={`
                relative group cursor-pointer rounded-2xl overflow-hidden
                transition-all duration-300 ease-out select-none
                flex flex-col justify-between p-6
                ${isSelected
                  ? 'border-2 border-[#3b82f6] bg-[#091226] shadow-[0_0_30px_rgba(59,130,246,0.35)] ring-1 ring-blue-400/40'
                  : 'border border-slate-800/80 bg-[#0a1020]/90 hover:border-slate-700/80 hover:bg-[#0c1429] hover:shadow-xl hover:shadow-black/40'
                }
              `}
              style={{ minHeight: '190px' }}
            >
              {/* Background Watermark Illustration on the Right */}
              <div className="absolute right-0 top-0 bottom-0 w-[52%] pointer-events-none overflow-hidden flex items-center justify-end pr-2">
                <div className={`w-full h-full transition-all duration-300 ${isSelected ? 'opacity-90 scale-105' : 'opacity-45 group-hover:opacity-75 group-hover:scale-102'}`}>
                  <WatermarkComponent />
                </div>
              </div>

              {/* Top Row: Icon + Selected Badge */}
              <div className="relative z-10 flex items-start justify-between">
                {/* Glowing Colored Icon Badge */}
                <div className={`w-12 h-12 rounded-2xl ${type.iconBg} text-white shadow-lg ${type.iconShadow} flex items-center justify-center transition-transform duration-300 group-hover:scale-105`}>
                  <IconComponent className="h-6 w-6" />
                </div>

                {/* 'Selected' Pill Badge on Top-Right */}
                {isSelected && (
                  <span className="px-3 py-1 rounded-lg bg-[#2563eb] text-white text-xs font-bold shadow-md tracking-wide">
                    Selected
                  </span>
                )}
              </div>

              {/* Middle Section: Title & Description */}
              <div className="relative z-10 mt-4">
                <h2 className="text-xl font-bold text-white tracking-tight">{type.name}</h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-[200px]">
                  {type.description}
                </p>
              </div>

              {/* Bottom Footer: Selection State / Action Link */}
              <div className="relative z-10 flex items-center justify-between mt-5 pt-1">
                {isSelected ? (
                  <div className="flex items-center gap-2 text-blue-400">
                    <div className="w-5 h-5 rounded-full bg-[#2563eb] flex items-center justify-center text-white shadow-sm">
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </div>
                    <span className="text-xs font-bold text-blue-400">
                      Currently selected
                    </span>
                  </div>
                ) : (
                  <>
                    <span className={`text-xs font-semibold ${type.accentColor} group-hover:underline`}>
                      Click to select
                    </span>
                    <div className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all duration-300 ${type.btnBorder} group-hover:scale-110`}>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ImageTypeSelector;
