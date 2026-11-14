import React, { useState, useMemo } from 'react';
import { 
  Bone, 
  Activity, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  Crosshair, 
  ChevronRight, 
  Info,
  Sparkles,
  HeartPulse,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

// Comprehensive anatomical skeletal zones mapping
const BODY_ZONES = {
  cranium: {
    name: 'Cranium & Facial Bones',
    region: 'Head & Face',
    bones: ['Frontal', 'Parietal', 'Temporal', 'Occipital', 'Mandible', 'Maxilla', 'Zygomatic', 'Nasal'],
    cx: 150, cy: 45, r: 24,
    color: '#f97316'
  },
  cervical: {
    name: 'Cervical Spine',
    region: 'Neck & Upper Spine',
    bones: ['C1 (Atlas)', 'C2 (Axis)', 'C3-C7 Vertebrae'],
    cx: 150, cy: 75, r: 12,
    color: '#eab308'
  },
  shoulder_left: {
    name: 'Left Shoulder & Clavicle',
    region: 'Upper Left Torso',
    bones: ['Left Clavicle', 'Left Scapula', 'Acromion', 'Glenohumeral Joint'],
    cx: 110, cy: 92, r: 16,
    color: '#ef4444'
  },
  shoulder_right: {
    name: 'Right Shoulder & Clavicle',
    region: 'Upper Right Torso',
    bones: ['Right Clavicle', 'Right Scapula', 'Acromion', 'Glenohumeral Joint'],
    cx: 190, cy: 92, r: 16,
    color: '#ef4444'
  },
  chest: {
    name: 'Thoracic Cage & Ribs',
    region: 'Thorax & Ribcage',
    bones: ['Ribs 1-12 (Left/Right)', 'Sternum (Breastbone)', 'Xiphoid Process', 'T1-T12 Spine'],
    cx: 150, cy: 120, r: 28,
    color: '#06b6d4'
  },
  spine: {
    name: 'Lumbar Spine',
    region: 'Lower Back',
    bones: ['L1-L5 Lumbar Vertebrae', 'Sacrum', 'Coccyx (Tailbone)'],
    cx: 150, cy: 165, r: 16,
    color: '#8b5cf6'
  },
  arm_left: {
    name: 'Left Upper Arm (Humerus)',
    region: 'Left Upper Extremity',
    bones: ['Left Humerus Shaft', 'Greater Tuberosity', 'Surgical Neck'],
    cx: 90, cy: 125, r: 14,
    color: '#f43f5e'
  },
  arm_right: {
    name: 'Right Upper Arm (Humerus)',
    region: 'Right Upper Extremity',
    bones: ['Right Humerus Shaft', 'Greater Tuberosity', 'Surgical Neck'],
    cx: 210, cy: 125, r: 14,
    color: '#f43f5e'
  },
  elbow_left: {
    name: 'Left Elbow Joint',
    region: 'Left Arm',
    bones: ['Left Olecranon', 'Radial Head', 'Medial Epicondyle'],
    cx: 80, cy: 160, r: 12,
    color: '#ec4899'
  },
  elbow_right: {
    name: 'Right Elbow Joint',
    region: 'Right Arm',
    bones: ['Right Olecranon', 'Radial Head', 'Medial Epicondyle'],
    cx: 220, cy: 160, r: 12,
    color: '#ec4899'
  },
  forearm_left: {
    name: 'Left Forearm (Radius & Ulna)',
    region: 'Left Forearm',
    bones: ['Left Radius', 'Left Ulna', 'Distal Radius (Colles/Smith)'],
    cx: 70, cy: 195, r: 14,
    color: '#f97316'
  },
  forearm_right: {
    name: 'Right Forearm (Radius & Ulna)',
    region: 'Right Forearm',
    bones: ['Right Radius', 'Right Ulna', 'Distal Radius (Colles/Smith)'],
    cx: 230, cy: 195, r: 14,
    color: '#f97316'
  },
  hand_left: {
    name: 'Left Wrist & Hand',
    region: 'Left Hand & Fingers',
    bones: ['Scaphoid', 'Lunate', 'Metacarpals 1-5', 'Proximal/Distal Phalanges'],
    cx: 60, cy: 235, r: 15,
    color: '#eab308'
  },
  hand_right: {
    name: 'Right Wrist & Hand',
    region: 'Right Hand & Fingers',
    bones: ['Scaphoid', 'Lunate', 'Metacarpals 1-5', 'Proximal/Distal Phalanges'],
    cx: 240, cy: 235, r: 15,
    color: '#eab308'
  },
  pelvis: {
    name: 'Pelvic Girdle & Hip Joint',
    region: 'Pelvis & Hips',
    bones: ['Ilium', 'Ischium', 'Pubis', 'Acetabulum', 'Femoral Head / Neck'],
    cx: 150, cy: 200, r: 24,
    color: '#3b82f6'
  },
  thigh_left: {
    name: 'Left Femur (Thigh Bone)',
    region: 'Left Upper Leg',
    bones: ['Left Femur Shaft', 'Femoral Neck', 'Intertrochanteric Region', 'Distal Condyle'],
    cx: 130, cy: 250, r: 18,
    color: '#6366f1'
  },
  thigh_right: {
    name: 'Right Femur (Thigh Bone)',
    region: 'Right Upper Leg',
    bones: ['Right Femur Shaft', 'Femoral Neck', 'Intertrochanteric Region', 'Distal Condyle'],
    cx: 170, cy: 250, r: 18,
    color: '#6366f1'
  },
  knee_left: {
    name: 'Left Knee Joint & Patella',
    region: 'Left Knee',
    bones: ['Left Patella (Kneecap)', 'Tibial Plateau', 'Femoral Condyles'],
    cx: 128, cy: 295, r: 13,
    color: '#10b981'
  },
  knee_right: {
    name: 'Right Knee Joint & Patella',
    region: 'Right Knee',
    bones: ['Right Patella (Kneecap)', 'Tibial Plateau', 'Femoral Condyles'],
    cx: 172, cy: 295, r: 13,
    color: '#10b981'
  },
  shin_left: {
    name: 'Left Lower Leg (Tibia & Fibula)',
    region: 'Left Lower Leg / Shin',
    bones: ['Left Tibia (Shin bone)', 'Left Fibula (Calf bone)', 'Tibial Shaft'],
    cx: 125, cy: 340, r: 16,
    color: '#14b8a6'
  },
  shin_right: {
    name: 'Right Lower Leg (Tibia & Fibula)',
    region: 'Right Lower Leg / Shin',
    bones: ['Right Tibia (Shin bone)', 'Right Fibula (Calf bone)', 'Tibial Shaft'],
    cx: 175, cy: 340, r: 16,
    color: '#14b8a6'
  },
  foot_left: {
    name: 'Left Ankle & Foot',
    region: 'Left Foot & Ankle',
    bones: ['Left Malleolus', 'Talus', 'Calcaneus (Heel)', '5th Metatarsal (Jones)', 'Phalanges'],
    cx: 120, cy: 385, r: 15,
    color: '#f59e0b'
  },
  foot_right: {
    name: 'Right Ankle & Foot',
    region: 'Right Foot & Ankle',
    bones: ['Right Malleolus', 'Talus', 'Calcaneus (Heel)', '5th Metatarsal (Jones)', 'Phalanges'],
    cx: 180, cy: 385, r: 15,
    color: '#f59e0b'
  }
};

/**
 * Intelligent helper to resolve target body zone from bone name / text
 */
function matchBodyZone(boneName = '', bodyRegion = '', fullText = '') {
  const combined = `${boneName} ${bodyRegion} ${fullText}`.toLowerCase();
  
  if (combined.includes('skull') || combined.includes('cranium') || combined.includes('mandible') || combined.includes('jaw') || combined.includes('maxilla') || combined.includes('nasal') || combined.includes('face') || combined.includes('orbital')) {
    return 'cranium';
  }
  if (combined.includes('cervical') || combined.includes('neck') || combined.includes('c1') || combined.includes('c2') || combined.includes('c3') || combined.includes('c4') || combined.includes('c5') || combined.includes('c6') || combined.includes('c7')) {
    return 'cervical';
  }
  if (combined.includes('clavicle') || combined.includes('collarbone') || combined.includes('scapula') || combined.includes('shoulder')) {
    if (combined.includes('left')) return 'shoulder_left';
    return 'shoulder_right';
  }
  if (combined.includes('rib') || combined.includes('sternum') || combined.includes('chest') || combined.includes('thorax') || combined.includes('thoracic cage')) {
    return 'chest';
  }
  if (combined.includes('lumbar') || combined.includes('spine') || combined.includes('sacrum') || combined.includes('coccyx') || combined.includes('l1') || combined.includes('l2') || combined.includes('l3') || combined.includes('l4') || combined.includes('l5')) {
    return 'spine';
  }
  if (combined.includes('humerus') || combined.includes('upper arm')) {
    if (combined.includes('left')) return 'arm_left';
    return 'arm_right';
  }
  if (combined.includes('elbow') || combined.includes('olecranon')) {
    if (combined.includes('left')) return 'elbow_left';
    return 'elbow_right';
  }
  if (combined.includes('radius') || combined.includes('ulna') || combined.includes('forearm') || combined.includes('colles') || combined.includes('smith')) {
    if (combined.includes('left')) return 'forearm_left';
    return 'forearm_right';
  }
  if (combined.includes('hand') || combined.includes('wrist') || combined.includes('finger') || combined.includes('scaphoid') || combined.includes('metacarpal') || combined.includes('boxer') || combined.includes('carpal')) {
    if (combined.includes('left')) return 'hand_left';
    return 'hand_right';
  }
  if (combined.includes('pelvis') || combined.includes('hip') || combined.includes('acetabulum') || combined.includes('ilium') || combined.includes('ischium') || combined.includes('pubis')) {
    return 'pelvis';
  }
  if (combined.includes('femur') || combined.includes('thigh') || combined.includes('intertrochanteric') || combined.includes('femoral')) {
    if (combined.includes('left')) return 'thigh_left';
    return 'thigh_right';
  }
  if (combined.includes('knee') || combined.includes('patella')) {
    if (combined.includes('left')) return 'knee_left';
    return 'knee_right';
  }
  if (combined.includes('tibia') || combined.includes('fibula') || combined.includes('shin') || combined.includes('calf') || combined.includes('lower leg')) {
    if (combined.includes('left')) return 'shin_left';
    return 'shin_right';
  }
  if (combined.includes('ankle') || combined.includes('foot') || combined.includes('heel') || combined.includes('calcaneus') || combined.includes('metatarsal') || combined.includes('talus') || combined.includes('toe') || combined.includes('jones')) {
    if (combined.includes('left')) return 'foot_left';
    return 'foot_right';
  }

  // Default fallback zone
  return 'forearm_left';
}

const SkeletalBodyMap = ({
  boneAffected = 'Left Distal Radius',
  bodyRegion = 'Forearm & Wrist',
  fractureType = 'Hairline Fracture',
  severity = 'Moderate',
  displacement = 'Minimally Displaced',
  healingTime = '6 to 8 Weeks',
  confidence = 94,
  isFracture = true
}) => {
  // Auto-detect active zone
  const targetZoneKey = useMemo(() => {
    return matchBodyZone(boneAffected, bodyRegion);
  }, [boneAffected, bodyRegion]);

  const [selectedZoneKey, setSelectedZoneKey] = useState(targetZoneKey);

  const activeZone = BODY_ZONES[selectedZoneKey] || BODY_ZONES[targetZoneKey] || BODY_ZONES.forearm_left;
  const targetZone = BODY_ZONES[targetZoneKey] || BODY_ZONES.forearm_left;

  const getSeverityBadge = (sev = '') => {
    const s = sev.toLowerCase();
    if (s.includes('mild') || s.includes('hairline') || s.includes('stable')) {
      return { bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', label: 'Mild (Stable)' };
    }
    if (s.includes('moderate') || s.includes('displaced')) {
      return { bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40', label: 'Moderate (Displaced)' };
    }
    if (s.includes('severe') || s.includes('comminuted')) {
      return { bg: 'bg-orange-500/20 text-orange-300 border-orange-500/40', label: 'Severe (Comminuted)' };
    }
    if (s.includes('critical') || s.includes('compound') || s.includes('open')) {
      return { bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40', label: 'Critical / Emergency' };
    }
    return { bg: 'bg-blue-500/20 text-blue-300 border-blue-500/40', label: sev || 'Moderate' };
  };

  const sevBadge = getSeverityBadge(severity);

  return (
    <div className="rounded-2xl bg-[#091122]/95 border border-slate-800/90 backdrop-blur-xl shadow-2xl p-5 sm:p-7 text-white space-y-6">
      
      {/* Header Title with Live Pulse */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.2)]">
            <Bone className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-white via-slate-100 to-orange-300 bg-clip-text text-transparent">
              Full-Body Skeletal Anatomical Map
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Trauma localization & anatomical bone identification across all 206 bones
            </p>
          </div>
        </div>

        {/* Live Status Pill */}
        <div className="flex items-center gap-2">
          {isFracture ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold shadow-[0_0_15px_rgba(244,63,94,0.25)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              Fracture Detected ({confidence}% match)
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Bone Cortex Intact
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Left Skeletal SVG Vector + Right Telemetry HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Left Side: Interactive Human Skeleton Vector Graphic (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 rounded-2xl bg-[#060a14] border border-slate-800/90 relative overflow-hidden shadow-inner min-h-[440px]">
          
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
          
          {/* Target Zone Radar Background Sweep */}
          <div 
            className="absolute rounded-full pointer-events-none transition-all duration-700 opacity-20 blur-xl"
            style={{
              left: `${(targetZone.cx / 300) * 100}%`,
              top: `${(targetZone.cy / 420) * 100}%`,
              width: '120px',
              height: '120px',
              transform: 'translate(-50%, -50%)',
              backgroundColor: '#ef4444'
            }}
          />

          {/* SVG Human Skeleton Figure */}
          <svg
            viewBox="0 0 300 420"
            className="w-full max-w-[280px] sm:max-w-[300px] h-[390px] select-none"
          >
            <defs>
              {/* Radial glow for fracture point */}
              <radialGradient id="fracturePing" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
                <stop offset="60%" stopColor="#f97316" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="skeletalBone" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#64748b" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#334155" stopOpacity="0.5" />
              </linearGradient>
            </defs>

            {/* 1. ANATOMICAL SKELETON BASE LINES (Anterior View) */}
            <g stroke="#475569" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.75">
              {/* Cranium Skull Outline */}
              <ellipse cx="150" cy="45" rx="20" ry="24" fill="#1e293b" fillOpacity="0.6" stroke="#94a3b8" strokeWidth="2" />
              {/* Eye sockets & Nasal */}
              <circle cx="143" cy="44" r="3.5" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
              <circle cx="157" cy="44" r="3.5" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
              <path d="M150 49 L150 54" stroke="#64748b" strokeWidth="1.5" />
              {/* Jaw / Mandible */}
              <path d="M140 58 Q150 67 160 58" stroke="#94a3b8" strokeWidth="1.8" />

              {/* Cervical Spine (Neck) */}
              <line x1="150" y1="69" x2="150" y2="82" stroke="#94a3b8" strokeWidth="3" />

              {/* Clavicles (Collarbones) */}
              <path d="M150 82 Q125 78 110 88" stroke="#94a3b8" strokeWidth="3" />
              <path d="M150 82 Q175 78 190 88" stroke="#94a3b8" strokeWidth="3" />

              {/* Sternum (Breastbone) */}
              <line x1="150" y1="84" x2="150" y2="135" stroke="#cbd5e1" strokeWidth="4" />

              {/* Ribcage Structure (Left & Right) */}
              {[94, 104, 114, 124, 134].map((y, idx) => (
                <g key={idx}>
                  <path d={`M150 ${y} Q${125 - idx * 2} ${y - 4} ${116 - idx * 2} ${y + 10} Q${130} ${y + 16} 150 ${y + 12}`} stroke="#64748b" strokeWidth="1.8" opacity="0.6" />
                  <path d={`M150 ${y} Q${175 + idx * 2} ${y - 4} ${184 + idx * 2} ${y + 10} Q${170} ${y + 16} 150 ${y + 12}`} stroke="#64748b" strokeWidth="1.8" opacity="0.6" />
                </g>
              ))}

              {/* Thoracic & Lumbar Spine Column */}
              <line x1="150" y1="135" x2="150" y2="185" stroke="#cbd5e1" strokeWidth="4" strokeDasharray="5 3" />

              {/* Left Arm: Humerus, Elbow, Radius/Ulna, Hand */}
              <line x1="110" y1="88" x2="80" y2="160" stroke="#94a3b8" strokeWidth="3.5" />
              <circle cx="80" cy="160" r="4" fill="#475569" />
              <line x1="80" y1="160" x2="60" y2="235" stroke="#94a3b8" strokeWidth="3" />
              {/* Hand/Fingers */}
              <path d="M60 235 L55 250 M60 235 L60 252 M60 235 L65 250" stroke="#94a3b8" strokeWidth="2" />

              {/* Right Arm: Humerus, Elbow, Radius/Ulna, Hand */}
              <line x1="190" y1="88" x2="220" y2="160" stroke="#94a3b8" strokeWidth="3.5" />
              <circle cx="220" cy="160" r="4" fill="#475569" />
              <line x1="220" y1="160" x2="240" y2="235" stroke="#94a3b8" strokeWidth="3" />
              {/* Hand/Fingers */}
              <path d="M240 235 L235 250 M240 235 L240 252 M240 235 L245 250" stroke="#94a3b8" strokeWidth="2" />

              {/* Pelvis & Sacrum Girdle */}
              <path d="M125 185 C115 195 125 215 150 215 C175 215 185 195 175 185 Z" fill="#1e293b" fillOpacity="0.5" stroke="#94a3b8" strokeWidth="3" />
              <circle cx="135" cy="205" r="5" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />
              <circle cx="165" cy="205" r="5" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />

              {/* Left Leg: Femur, Patella, Tibia/Fibula, Foot */}
              <line x1="135" y1="205" x2="128" y2="295" stroke="#94a3b8" strokeWidth="4" />
              <ellipse cx="128" cy="295" rx="5" ry="4" fill="#475569" stroke="#cbd5e1" strokeWidth="1.5" />
              <line x1="128" y1="295" x2="120" y2="385" stroke="#94a3b8" strokeWidth="3.5" />
              {/* Left Foot */}
              <path d="M120 385 L108 402 L125 402" stroke="#94a3b8" strokeWidth="2.5" strokeLinejoin="round" />

              {/* Right Leg: Femur, Patella, Tibia/Fibula, Foot */}
              <line x1="165" y1="205" x2="172" y2="295" stroke="#94a3b8" strokeWidth="4" />
              <ellipse cx="172" cy="295" rx="5" ry="4" fill="#475569" stroke="#cbd5e1" strokeWidth="1.5" />
              <line x1="172" y1="295" x2="180" y2="385" stroke="#94a3b8" strokeWidth="3.5" />
              {/* Right Foot */}
              <path d="M180 385 L192 402 L175 402" stroke="#94a3b8" strokeWidth="2.5" strokeLinejoin="round" />
            </g>

            {/* 2. INTERACTIVE CLICKABLE ANATOMICAL TARGET ZONES */}
            {Object.entries(BODY_ZONES).map(([key, zone]) => {
              const isTarget = key === targetZoneKey;
              const isSelected = key === selectedZoneKey;

              return (
                <g 
                  key={key} 
                  className="cursor-pointer transition-all duration-300"
                  onClick={() => setSelectedZoneKey(key)}
                >
                  {/* Outer subtle click zone */}
                  <circle
                    cx={zone.cx}
                    cy={zone.cy}
                    r={zone.r}
                    fill={isSelected ? zone.color : 'transparent'}
                    fillOpacity={isSelected ? 0.25 : 0}
                    stroke={isSelected ? zone.color : isTarget ? '#ef4444' : '#64748b'}
                    strokeWidth={isSelected ? 2 : isTarget ? 1.5 : 0}
                    strokeDasharray={isTarget && !isSelected ? '3 2' : 'none'}
                    className="hover:stroke-blue-400 hover:stroke-2 hover:fill-blue-500/20 transition-all"
                  />

                  {/* ACTIVE FRACTURE BEACON / RADAR PING (For Target Zone) */}
                  {isTarget && isFracture && (
                    <g>
                      {/* Radiating Expanding Pulse Circle */}
                      <circle
                        cx={zone.cx}
                        cy={zone.cy}
                        r={zone.r + 8}
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="1.5"
                        opacity="0.8"
                        className="animate-ping"
                        style={{ transformOrigin: `${zone.cx}px ${zone.cy}px` }}
                      />
                      {/* Secondary glowing ring */}
                      <circle
                        cx={zone.cx}
                        cy={zone.cy}
                        r={zone.r + 4}
                        fill="url(#fracturePing)"
                      />
                      {/* Central Crosshair target pin */}
                      <circle
                        cx={zone.cx}
                        cy={zone.cy}
                        r={4}
                        fill="#fef08a"
                        stroke="#ef4444"
                        strokeWidth="2"
                        className="animate-pulse"
                      />
                      {/* Glowing jagged fracture indicator */}
                      <path
                        d={`M${zone.cx - 7} ${zone.cy} L${zone.cx - 2} ${zone.cy - 5} L${zone.cx + 2} ${zone.cy + 5} L${zone.cx + 7} ${zone.cy}`}
                        stroke="#ffffff"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Quick Body Map Instructions */}
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-2 z-10 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800">
            <Info className="h-3 w-3 text-blue-400" />
            <span>Click any bone or region on the skeleton to inspect anatomy</span>
          </div>

        </div>

        {/* Right Side: Comprehensive Diagnostic HUD & Fracture Telemetry (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* 1. Target Fractured Bone Identified Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0c162d] via-[#091122] to-[#120f26] border border-orange-500/40 shadow-[0_0_30px_rgba(249,115,22,0.15)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                <Crosshair className="h-4 w-4 text-orange-400 animate-spin" style={{ animationDuration: '10s' }} />
                Target Anatomical Structure
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${sevBadge.bg}`}>
                {sevBadge.label}
              </span>
            </div>

            <h4 className="text-2xl font-black text-white tracking-tight">
              {boneAffected}
            </h4>

            <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
              <span className="font-semibold text-blue-300">Anatomical Region:</span>
              <span>{bodyRegion}</span>
            </p>

            {/* Classification & Displacement Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-800">
              <div className="p-3 rounded-xl bg-[#060a14]/80 border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Classification</span>
                <p className="text-sm font-bold text-orange-300 mt-0.5">{fractureType}</p>
              </div>

              <div className="p-3 rounded-xl bg-[#060a14]/80 border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Displacement Status</span>
                <p className="text-sm font-bold text-slate-200 mt-0.5">{displacement}</p>
              </div>
            </div>
          </div>

          {/* 2. Selected Anatomical Region Bones Breakdown */}
          <div className="p-4 rounded-2xl bg-[#060a14]/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Bone className="h-3.5 w-3.5 text-cyan-400" />
                Skeletal Inventory for {activeZone.name}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {activeZone.region}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {activeZone.bones.map((bone, i) => (
                <span 
                  key={i}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                    boneAffected.toLowerCase().includes(bone.toLowerCase().split(' ')[0])
                      ? 'bg-orange-500/20 border-orange-500/50 text-orange-300 shadow-[0_0_10px_rgba(249,115,22,0.3)] font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  {bone}
                </span>
              ))}
            </div>
          </div>

          {/* 3. Clinical Recovery & Emergency Protocol HUD */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Healing Timeline */}
            <div className="p-4 rounded-xl bg-[#0c162d]/80 border border-blue-500/30 flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Estimated Recovery</span>
                <h5 className="text-base font-bold text-white mt-0.5">{healingTime}</h5>
                <p className="text-[10px] text-slate-400">With adequate orthopedic immobilization</p>
              </div>
            </div>

            {/* Immobilization Recommendation */}
            <div className="p-4 rounded-xl bg-[#0c162d]/80 border border-emerald-500/30 flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Orthopedic Protocol</span>
                <h5 className="text-base font-bold text-emerald-300 mt-0.5">Rigid Immobilization</h5>
                <p className="text-[10px] text-slate-400">Cast / Splint / Surgical ORIF assessment</p>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default SkeletalBodyMap;
