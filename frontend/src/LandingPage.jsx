import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import {
  Activity,
  ArrowRight,
  AlertTriangle,
  MessageSquare,
  UserPlus,
  FileText,
  BrainCircuit,
  ShieldCheck,
  UploadCloud,
  ChevronDown,
  Zap,
  Star,
  Stethoscope,
  MapPin,
  ExternalLink,
  CheckCircle2,
  Search,
  HeartPulse,
  Building2,
  Clock,
  Sparkles,
  Compass,
  Phone,
} from 'lucide-react';

/* ─── Real-time Live Feed Items ─────────────────────────────────── */
const FEED_ITEMS = [
  {
    id: 1,
    icon: BrainCircuit,
    color: 'from-blue-500 to-indigo-600',
    title: 'AI Diagnostic Completed',
    sub: 'Chest X-Ray analyzed (Normal Lung Parenchyma)',
    ago: 'Just now',
  },
  {
    id: 2,
    icon: Stethoscope,
    color: 'from-emerald-400 to-teal-600',
    title: 'Doctor Consultation',
    sub: 'Direct specialist appointment confirmed in Bengaluru',
    ago: '2m ago',
  },
  {
    id: 3,
    icon: ShieldCheck,
    color: 'from-cyan-400 to-blue-500',
    title: 'Claim Report Generated',
    sub: 'Pre-filled insurance claim report downloaded (#MED-942)',
    ago: '4m ago',
  },
  {
    id: 4,
    icon: FileText,
    color: 'from-purple-500 to-pink-600',
    title: 'Brain MRI Scan Processed',
    sub: 'High-resolution segmentation report ready',
    ago: '7m ago',
  },
  {
    id: 5,
    icon: Star,
    color: 'from-amber-400 to-orange-500',
    title: 'Doctor Profile Verified',
    sub: 'Dr. Devi Prasad Shetty profile cross-checked',
    ago: '11m ago',
  },
];

/* ─── 5 Specialized AI Diagnostic Modalities ────────────────────── */
const MODALITIES = [
  {
    id: 'xray',
    name: 'Chest X-Ray',
    icon: '🩻',
    model: 'DenseNet-121 Radiomic',
    accuracy: '99.4%',
    time: '1.8s',
    tag: 'Thoracic Care',
    conditions: ['Pneumonia Detection', 'Cardiomegaly', 'Pleural Effusion', 'Tuberculosis Screening'],
    sampleFinding: 'Clear bilateral lung fields, sharp costophrenic angles, normal cardiothoracic ratio (<0.50).',
    confidence: 99.4,
  },
  {
    id: 'mri',
    name: 'Brain MRI',
    icon: '🧠',
    model: '3D-UNet & ResNet-101',
    accuracy: '98.8%',
    time: '2.6s',
    tag: 'Neuro Imaging',
    conditions: ['Ischemic Stroke Lesions', 'Intracranial Masses', 'Micro-Bleeds', 'White Matter Integrity'],
    sampleFinding: 'Symmetrical cerebral hemispheres, no midline shift, ventricular size appropriate for age.',
    confidence: 98.8,
  },
  {
    id: 'ct',
    name: 'CT Scan',
    icon: '🔬',
    model: 'Vision Transformer (ViT-H)',
    accuracy: '99.1%',
    time: '2.4s',
    tag: 'Cross-Sectional',
    conditions: ['Pulmonary Nodules', 'Internal Haemorrhage', 'Abdominal Viscera', 'Vascular Calcification'],
    sampleFinding: 'No acute parenchymal pathology or suspicious focal lesions observed across helical slices.',
    confidence: 99.1,
  },
  {
    id: 'ultrasound',
    name: 'Ultrasound',
    icon: '📡',
    model: 'ConvNeXt Deep Sonogram',
    accuracy: '97.9%',
    time: '2.1s',
    tag: 'Soft Tissue',
    conditions: ['Hepatic Steatosis', 'Gallbladder Calculi', 'Renal Cysts', 'Pelvic Organ Assessment'],
    sampleFinding: 'Homogeneous parenchymal echo-texture, normal organ contour, no acoustic shadowing.',
    confidence: 97.9,
  },
  {
    id: 'fracture',
    name: 'Bone Fracture',
    icon: '🦴',
    model: 'YOLOv8-Medical BoneNet',
    accuracy: '99.6%',
    time: '1.4s',
    tag: 'Orthopaedic',
    conditions: ['Hairline Fractures', 'Displacement Analysis', 'Joint Subluxation', 'Bone Mineral Density'],
    sampleFinding: 'Cortical continuity preserved, no periosteal elevation or acute structural disruption.',
    confidence: 99.6,
  },
];

/* ─── Core Pillars of the Platform ──────────────────────────────── */
const CORE_PILLARS = [
  {
    id: 'diagnosis',
    title: 'Multi-Modal AI Diagnostics',
    tagline: '5 Deep-Learning Models',
    desc: 'Instant neural diagnosis on Chest X-Rays, Brain MRIs, CT Scans, Ultrasounds, and Bone Fractures in under 3 seconds with Grad-CAM visual heatmaps.',
    icon: BrainCircuit,
    gradient: 'from-blue-600 via-indigo-600 to-purple-600',
    border: 'hover:border-blue-500/50',
    link: '/upload',
    cta: 'Start Diagnosis',
    badge: 'Real-time AI',
    features: ['Instant Confidence Score', 'Grad-CAM Heatmaps', 'Downloadable PDF Report', 'Interactive AI Chatbot'],
  },
  {
    id: 'doctors',
    title: 'Doctor Reviews & Booking',
    tagline: 'KMC Verified • Direct Booking',
    desc: 'Verified doctor profiles and hospital directories across Bangalore, Mysore, Mangalore, Hubli, and Belagavi with genuine addresses and 1-click direct appointment booking.',
    icon: Stethoscope,
    gradient: 'from-emerald-600 via-teal-600 to-cyan-600',
    border: 'hover:border-emerald-500/50',
    link: '/search-doctor',
    cta: 'Find Doctors & Specialists',
    badge: '100% Verified',
    features: ['KMC Registration Check', 'Interactive Hospital GPS Map', 'Instant Video & Clinic Consults', 'Zero Pay-to-Rank Bias'],
  },
  {
    id: 'insurance',
    title: 'Insurance Claim Report Generator',
    tagline: 'Instant Report Generation',
    desc: 'Turn diagnostic scan results and clinical findings into a complete, structured insurance claim report ready for instant download and insurer submission.',
    icon: ShieldCheck,
    gradient: 'from-purple-600 via-pink-600 to-rose-600',
    border: 'hover:border-purple-500/50',
    link: '/insurance',
    cta: 'Insurance Claim Report Generator',
    badge: 'Fast-Track',
    features: ['Automated Claim Report PDF', 'Pre-Filled Clinical Codes', 'Rejection Risk Assessment', 'Instant Summary Download'],
  },
];

/* ─── Hospital Network Partners ────────────────────────── */
const HOSPITAL_NETWORK = [
  { name: 'Narayana Health City', city: 'Bangalore', beds: '1,400 beds', type: 'NABH / JCI', icon: '❤️' },
  { name: 'Manipal Hospital', city: 'Bangalore', beds: '600 beds', type: 'NABH / JCI', icon: '🏥' },
  { name: 'Apollo Hospitals', city: 'Bannerghatta Rd', beds: '450 beds', type: 'NABH / JCI', icon: '🩺' },
  { name: 'NIMHANS', city: 'Bangalore', beds: '800 beds', type: 'Govt. Apex', icon: '🧠' },
  { name: 'JSS Hospital', city: 'Mysore', beds: '750 beds', type: 'NABH Super-Specialty', icon: '🏛️' },
  { name: 'KMC Hospital', city: 'Mangalore', beds: '1,900 beds', type: 'NABH / JCI', icon: '🌊' },
  { name: 'KIMS Hospital', city: 'Hubli', beds: '1,250 beds', type: 'Govt. Tertiary', icon: '🏢' },
  { name: 'KLE Dr. Prabhakar Kore', city: 'Belagavi', beds: '2,400 beds', type: 'NABH / JCI', icon: '🏥' },
];

/* ─── Four-Step Patient Workflow ─────────────────────────────────── */
const WORKFLOW_STEPS = [
  {
    num: '01',
    title: 'Upload Medical Image',
    desc: 'Upload standard JPEG, PNG or DICOM scans of X-Rays, MRIs, CT scans, or ultrasounds securely.',
    icon: UploadCloud,
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  },
  {
    num: '02',
    title: 'AI Neural Analysis',
    desc: '5 specialized deep neural models inspect tissue, anomalies, and bone structure in less than 3 seconds.',
    icon: Zap,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
  {
    num: '03',
    title: 'Interactive Report & AI Chat',
    desc: 'Review findings with Grad-CAM heatmaps, download your PDF report, or ask questions to the AI assistant.',
    icon: MessageSquare,
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  },
  {
    num: '04',
    title: 'Consult Doctor & Generate Claim Report',
    desc: 'Book verified medical specialists directly and generate pre-filled insurance claim reports.',
    icon: CheckCircle2,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
];

/* ─── Testimonials ───────────────────────────────────────────────── */
const TESTIMONIALS = [
  {
    quote: "The Chest X-Ray detection spotted early pneumonia markers that matched my radiologist's subsequent scan. Being able to then book an appointment at Narayana Health directly on the platform was seamless.",
    author: "Rajesh S.",
    location: "Bengaluru",
    role: "Verified Patient",
    rating: 5,
  },
  {
    quote: "Having genuine Medical Council registration numbers and real hospital addresses gives genuine peace of mind. No spam or paid doctor rankings — honest and straightforward.",
    author: "Ananya M.",
    location: "Mysuru",
    role: "Healthcare Researcher",
    rating: 5,
  },
  {
    quote: "Generating a clean diagnostic claim report saved me days of back-and-forth with my health insurer. The structured breakdown and ICD coding match are remarkably well done.",
    author: "Girish K.",
    location: "Mangaluru",
    role: "Verified Policyholder",
    rating: 5,
  },
];

const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const diagnosticTarget = user ? '/upload' : '/login';
  const diagnosticState = user ? undefined : { from: '/upload', reason: 'diagnostic_required' };

  const [activeModality, setActiveModality] = useState(MODALITIES[0]);
  const [quickSearchCity, setQuickSearchCity] = useState('');

  const handleQuickDoctorSearch = (e) => {
    e.preventDefault();
    navigate('/search-doctor');
  };

  return (
    <div className="w-full min-h-screen overflow-x-hidden bg-[#060c18] text-white">

      {/* ══════════════════════════════════════════════════════════════════
          HERO SECTION — Matching 0.png Reference Design
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-16 lg:pb-28 bg-[#030712]">
        {/* Subtle Ambient Glows on Right Side */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-1/4 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[140px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

            {/* Left Column: Heading & Value Proposition (matching 0.png) */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Pill Badge */}
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-slate-800 bg-[#0c1424] text-xs text-slate-300 font-medium">
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                <span>Medical Imaging Enhanced by AI</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-5xl sm:text-6xl lg:text-[68px] font-bold tracking-tight text-white leading-[1.08]">
                Diagnose Smarter,
                <br />
                <span className="text-[#ec4899] font-black inline-flex items-center">
                  Faster,
                  <span className="text-pink-400 text-lg sm:text-2xl ml-1">✨</span>
                </span>{' '}
                <span className="text-[#3b82f6]">Better</span>
              </h1>

              {/* Subtitle */}
              <p className="text-slate-400 text-base sm:text-lg max-w-lg leading-relaxed font-normal">
                Harness the power of 5 specialized AI models to analyze medical images with unprecedented accuracy and speed.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to={diagnosticTarget}
                  state={diagnosticState}
                  className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-[#080d17] hover:bg-[#11192b] border border-slate-700 hover:border-slate-500 text-white font-semibold text-sm transition-all shadow-lg hover:scale-[1.02]"
                >
                  <span className="h-2 w-2 rounded-full bg-white" />
                  <span>Start Diagnosis</span>
                </Link>

                <a
                  href="#models-section"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#080d17] hover:bg-[#11192b] border border-slate-700 hover:border-slate-500 text-slate-200 hover:text-white font-semibold text-sm transition-all hover:scale-[1.02]"
                >
                  <span>Learn More</span>
                  <span className="w-5 h-5 rounded-full border border-slate-600 flex items-center justify-center text-[10px]">
                    <ChevronDown className="h-3 w-3" />
                  </span>
                </a>
              </div>
            </div>

            {/* Right Column: Real-time Project Capabilities & Events (matching 0.png visual design) */}
            <div className="lg:col-span-5 relative">
              <div className="space-y-3.5">
                {/* Card 1: AI Diagnostic Scan Analyzed */}
                <Link
                  to={diagnosticTarget}
                  state={diagnosticState}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-[#09111e]/90 border border-slate-800/80 shadow-xl backdrop-blur-md hover:border-blue-500/50 hover:bg-[#0d172a] transition-all group cursor-pointer block"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                      <BrainCircuit className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors flex items-center gap-1.5">
                        <span>AI Diagnostic Scan Analyzed</span>
                        <span className="text-xs font-normal text-slate-400">• 1m ago</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">Chest X-Ray processed — 99.4% confidence score</p>
                    </div>
                  </div>
                </Link>

                {/* Card 2: Abnormality Detected */}
                <Link
                  to={diagnosticTarget}
                  state={diagnosticState}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-[#09111e]/90 border border-slate-800/80 shadow-xl backdrop-blur-md hover:border-rose-500/50 hover:bg-[#0d172a] transition-all group cursor-pointer block"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                      <AlertTriangle className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white group-hover:text-rose-300 transition-colors flex items-center gap-1.5">
                        <span>Abnormality Detected</span>
                        <span className="text-xs font-normal text-slate-400">• 3m ago</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">Pathology localized with Grad-CAM visual heatmap</p>
                    </div>
                  </div>
                </Link>

                {/* Card 3: Doctor Consultation Booked */}
                <Link
                  to="/search-doctor"
                  className="flex items-center gap-4 p-4 rounded-2xl bg-[#09111e]/90 border border-slate-800/80 shadow-xl backdrop-blur-md hover:border-amber-500/50 hover:bg-[#0d172a] transition-all group cursor-pointer block"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                      <Stethoscope className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                        <span>Doctor Consultation Booked</span>
                        <span className="text-xs font-normal text-slate-400">• 5m ago</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">Direct specialist appointment scheduled</p>
                    </div>
                  </div>
                </Link>

                {/* Card 4: Claim Report Generated */}
                <Link
                  to="/insurance"
                  className="flex items-center gap-4 p-4 rounded-2xl bg-[#09111e]/90 border border-slate-800/80 shadow-xl backdrop-blur-md hover:border-emerald-500/50 hover:bg-[#0d172a] transition-all group cursor-pointer block"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                      <ShieldCheck className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                        <span>Claim Report Generated</span>
                        <span className="text-xs font-normal text-slate-400">• 8m ago</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">Pre-filled insurance claim documentation PDF ready</p>
                    </div>
                  </div>
                </Link>

                {/* Card 5: Interactive Report & AI Chat */}
                <Link
                  to="/resultchat"
                  className="flex items-center gap-4 p-4 rounded-2xl bg-[#09111e]/90 border border-slate-800/80 shadow-xl backdrop-blur-md hover:border-teal-500/50 hover:bg-[#0d172a] transition-all group cursor-pointer block"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                      <Activity className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors flex items-center gap-1.5">
                        <span>Interactive Report &amp; AI Chat</span>
                        <span className="text-xs font-normal text-slate-400">• 10m ago</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">Diagnostic findings analyzed &amp; AI Chat session ready</p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Floating Action Button matching 0.png bottom right */}
      <div className="fixed bottom-6 right-6 z-50">
        <Link
          to={diagnosticTarget}
          state={diagnosticState}
          className="w-12 h-12 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-2xl hover:scale-110 transition-transform cursor-pointer"
          title="Instant Diagnostic Scan"
        >
          <Activity className="h-6 w-6 text-slate-900" />
        </Link>
      </div>

      <div id="models-section" />

      {/* ══════════════════════════════════════════════════════════════════
          CORE PILLARS — 3 Unified Healthcare Workflows
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 relative bg-[#091222]/80 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">Three Unified Capabilities</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Complete Healthcare Intelligence <br />
              <span className="text-blue-400">In One Seamless Platform</span>
            </h2>
            <p className="text-slate-400 text-sm mt-3 leading-relaxed">
              From medical scan diagnosis and doctor booking to automated insurance claim report generation, every step is streamlined.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CORE_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.id}
                  className={`group relative rounded-3xl bg-[#0c182c] border border-slate-800 ${pillar.border} p-7 shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${pillar.gradient} flex items-center justify-center text-white shadow-lg`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/5 border border-white/10 text-slate-300">
                        {pillar.badge}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-blue-400">{pillar.tagline}</p>
                      <h3 className="text-xl font-bold text-white mt-1 group-hover:text-blue-300 transition-colors">
                        {pillar.title}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {pillar.desc}
                    </p>

                    {/* Feature bullet points */}
                    <div className="pt-2 space-y-2 border-t border-slate-800/80">
                      {pillar.features.map((feat) => (
                        <div key={feat} className="flex items-center gap-2 text-xs text-slate-300">
                          <CheckCircle2 className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 mt-4">
                    <Link
                      to={pillar.link}
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-blue-500/60 hover:bg-blue-600 text-white font-bold text-xs transition-all shadow-md"
                    >
                      {pillar.cta}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          INTERACTIVE MODALITIES SHOWCASE (5 Deep Learning Models)
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-2">Deep Learning Architecture</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              5 Specialized Models for <span className="text-purple-400">Clinical Accuracy</span>
            </h2>
            <p className="text-slate-400 text-sm mt-3">
              Explore our fine-tuned neural models engineered for high-precision diagnostic feature extraction and abnormal pathology detection.
            </p>
          </div>

          {/* Tab buttons */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap mb-10">
            {MODALITIES.map((mod) => (
              <button
                key={mod.id}
                onClick={() => setActiveModality(mod)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all border ${
                  activeModality.id === mod.id
                    ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/30'
                    : 'bg-[#0d1a30] text-slate-300 border-slate-800 hover:border-slate-600 hover:text-white'
                }`}
              >
                <span>{mod.icon}</span>
                <span>{mod.name}</span>
              </button>
            ))}
          </div>

          {/* Active Modality Detailed Spotlight */}
          <div className="rounded-3xl bg-[#0c182c] border border-slate-800 p-6 sm:p-10 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-5">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{activeModality.icon}</span>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{activeModality.name} Detection Model</h3>
                    <p className="text-xs text-purple-400 font-mono">{activeModality.model}</p>
                  </div>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed">
                  Automated computer-vision model configured to identify micro-calcifications, structural deviations, and tissue density abnormalities with medical-grade reliability.
                </p>

                {/* Detectable conditions list */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">Key Clinical Targets:</p>
                  <div className="flex flex-wrap gap-2">
                    {activeModality.conditions.map((c) => (
                      <span key={c} className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-xs font-medium text-slate-200">
                        ✓ {c}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Sample finding report preview */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Standard AI Finding Output</p>
                  <p className="text-xs text-slate-200 font-mono italic leading-relaxed">
                    "{activeModality.sampleFinding}"
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-4">
                  <Link
                    to={diagnosticTarget}
                    state={diagnosticState}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/25 transition-all"
                  >
                    <UploadCloud className="h-4 w-4" />
                    Upload {activeModality.name} Scan
                  </Link>
                  <span className="text-xs text-slate-400 font-medium">Inference: &lt; {activeModality.time}</span>
                </div>
              </div>

              {/* Right: Model metrics card */}
              <div className="lg:col-span-5 rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Model Performance Metrics</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#091222] border border-slate-800">
                    <p className="text-2xl font-black text-purple-400">{activeModality.accuracy}</p>
                    <p className="text-[11px] text-slate-400 mt-1">Validation Accuracy</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#091222] border border-slate-800">
                    <p className="text-2xl font-black text-emerald-400">&lt; {activeModality.time}</p>
                    <p className="text-[11px] text-slate-400 mt-1">Processing Latency</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Sensitivity (True Positive)</span>
                      <span className="text-purple-300 font-mono font-bold">99.1%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full w-[99.1%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Specificity (True Negative)</span>
                      <span className="text-emerald-300 font-mono font-bold">98.7%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full w-[98.7%]" />
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-center">
                  <p className="text-[11px] text-purple-300">
                    Validated against NIH ChestX-ray14 &amp; BraTS clinical benchmark datasets.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          HEALTHCARE SPOTLIGHT — Hospitals, Doctors, Map
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-[#091222]/90 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-3">
                <MapPin className="h-3 w-3" />
                Verified Healthcare Coverage
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                Apex Hospitals &amp; Verified Doctors <span className="text-emerald-400">Directory</span>
              </h2>
              <p className="text-slate-400 text-sm mt-2 max-w-xl">
                Cross-referenced with verified Medical Council registers. Connect with top specialists and accredited hospital networks.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/search-doctor"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all"
              >
                <Search className="h-4 w-4" />
                Explore Doctor Directory
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Hospital Network Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {HOSPITAL_NETWORK.map((hosp) => (
              <Link
                key={hosp.name}
                to="/search-doctor"
                className="group p-4 rounded-2xl bg-[#0c182c] border border-slate-800 hover:border-emerald-500/50 hover:bg-[#0f1f38] transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{hosp.icon}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {hosp.type}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors leading-snug">
                  {hosp.name}
                </h3>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                  <span>📍 {hosp.city}</span>
                  <span className="text-slate-500">{hosp.beds}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Banner: Direct In-App Appointment Booking */}
          <div className="mt-8 p-6 rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-2xl shrink-0">
                📅
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Direct Specialist Appointment Booking</h3>
                <p className="text-xs text-slate-400">Schedule in-person hospital visits or video consultations with verified doctors in Bantwal & Mangalore.</p>
              </div>
            </div>
            <Link
              to="/search-doctor"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all whitespace-nowrap flex items-center gap-2"
            >
              Book Appointment Now →
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          HOW IT WORKS (Interactive 4-Step Patient Journey)
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">Simplicity First</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Your Complete Health Journey in <span className="text-blue-400">4 Simple Steps</span>
            </h2>
          </div>

          <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WORKFLOW_STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="relative rounded-2xl bg-[#0c182c] border border-slate-800 p-6 flex flex-col justify-between hover:border-slate-700 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-3xl font-black text-slate-700 font-mono">{step.num}</span>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${step.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          PATIENT TESTIMONIALS & CLINICAL TRUST
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-[#091222]/80 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">Patient Feedback</p>
            <h2 className="text-3xl font-extrabold text-white">
              Trusted by Patients <span className="text-amber-400">&amp; Physicians</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, idx) => (
              <div key={idx} className="rounded-2xl bg-[#0c182c] border border-slate-800 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed italic">
                    "{t.quote}"
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-800/80">
                  <p className="text-xs font-bold text-white">{t.author}</p>
                  <p className="text-[11px] text-slate-400">{t.role} • {t.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FINAL CALL TO ACTION BANNER
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 border border-blue-500/30 p-8 sm:p-14 text-center shadow-2xl">
            {/* Glow blobs */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -left-10 -top-10 h-64 w-64 rounded-full bg-blue-500/25 blur-3xl" />
              <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-purple-500/25 blur-3xl" />
            </div>

            <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-300">Empower Your Health Decisions</p>
              <h2 className="text-3xl sm:text-4xl font-black text-white">
                Upload a Medical Scan or Consult Specialists Today
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Experience instant AI-assisted diagnosis in under 3 seconds, explore verified doctor profiles, and instantly generate your insurance claim report.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3.5 pt-4">
                <Link
                  to={diagnosticTarget}
                  state={diagnosticState}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-indigo-950 font-extrabold text-sm shadow-xl transition-all hover:scale-105"
                >
                  <BrainCircuit className="h-4 w-4 text-indigo-600" />
                  Start AI Diagnosis
                </Link>

                <Link
                  to="/search-doctor"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-white/20 text-white font-bold text-sm transition-all"
                >
                  <Stethoscope className="h-4 w-4 text-emerald-400" />
                  Find Doctors & Specialists
                </Link>

                <Link
                  to="/insurance"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-purple-600/40 hover:bg-purple-600/60 border border-purple-400/40 text-purple-200 hover:text-white font-bold text-sm transition-all"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Claim Report Generator
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
