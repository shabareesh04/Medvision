import React from 'react';

// 1. MRI Scanner Machine Watermark
export const MriWatermark = () => (
  <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full object-contain">
    <defs>
      <radialGradient id="mriGlow" cx="60%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#818cf8" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#312e81" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="mriMetal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#475569" stopOpacity="0.4" />
        <stop offset="50%" stopColor="#1e293b" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#0f172a" stopOpacity="0.6" />
      </linearGradient>
    </defs>
    <ellipse cx="120" cy="80" rx="65" ry="60" fill="url(#mriGlow)" />
    {/* Outer Gantry Ring */}
    <ellipse cx="125" cy="80" rx="55" ry="50" stroke="#64748b" strokeWidth="2.5" strokeOpacity="0.3" fill="url(#mriMetal)" />
    <ellipse cx="125" cy="80" rx="42" ry="38" stroke="#818cf8" strokeWidth="1.5" strokeOpacity="0.4" />
    <ellipse cx="125" cy="80" rx="30" ry="27" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.5" fill="#020617" />
    {/* Bore Inner Tunnel Grid */}
    <path d="M95 80 Q125 60 155 80" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="3 3" />
    <path d="M95 80 Q125 100 155 80" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="3 3" />
    <ellipse cx="125" cy="80" rx="16" ry="14" fill="#0369a1" fillOpacity="0.2" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.6" />
    {/* Patient Bed / Table */}
    <path d="M40 108 L115 88 L135 93 L60 114 Z" fill="#334155" fillOpacity="0.5" stroke="#64748b" strokeWidth="1.2" strokeOpacity="0.6" />
    <path d="M40 108 L40 125 L60 131 L60 114 Z" fill="#1e293b" fillOpacity="0.6" stroke="#475569" strokeWidth="1" strokeOpacity="0.5" />
    <path d="M60 114 L135 93 L135 100 L60 122 Z" fill="#0f172a" fillOpacity="0.6" stroke="#334155" strokeWidth="1" strokeOpacity="0.4" />
    {/* Scanning laser beam */}
    <line x1="125" y1="35" x2="125" y2="125" stroke="#c084fc" strokeWidth="1" strokeOpacity="0.6" strokeDasharray="4 2" />
  </svg>
);

// 2. Chest X-Ray Ribcage Watermark
export const XrayWatermark = () => (
  <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full object-contain">
    <defs>
      <linearGradient id="boneGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
        <stop offset="50%" stopColor="#fed7aa" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#ea580c" stopOpacity="0.3" />
      </linearGradient>
    </defs>
    {/* Spine */}
    <rect x="96" y="20" width="8" height="120" rx="3" fill="#cbd5e1" fillOpacity="0.25" stroke="#94a3b8" strokeWidth="1" strokeOpacity="0.3" />
    {[30, 42, 54, 66, 78, 90, 102, 114, 126].map((y, i) => (
      <rect key={i} x="94" y={y} width="12" height="7" rx="2" fill="#e2e8f0" fillOpacity="0.3" stroke="#f97316" strokeWidth="0.8" strokeOpacity="0.4" />
    ))}
    {/* Clavicles */}
    <path d="M100 28 Q60 22 35 34" stroke="#e2e8f0" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.35" />
    <path d="M100 28 Q140 22 165 34" stroke="#e2e8f0" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.35" />
    {/* Ribs Left & Right */}
    {[
      { l: "M96 42 Q50 38 42 60 Q48 76 96 74", r: "M104 42 Q150 38 158 60 Q152 76 104 74" },
      { l: "M96 54 Q40 52 32 75 Q42 94 96 90", r: "M104 54 Q160 52 168 75 Q158 94 104 90" },
      { l: "M96 66 Q35 66 28 90 Q38 110 96 104", r: "M104 66 Q165 66 172 90 Q162 110 104 104" },
      { l: "M96 78 Q35 80 28 104 Q40 122 96 116", r: "M104 78 Q165 80 172 104 Q160 122 104 116" },
      { l: "M96 90 Q42 95 38 116 Q52 130 96 126", r: "M104 90 Q158 95 162 116 Q148 130 104 126" },
      { l: "M96 102 Q55 108 50 126 Q65 138 96 134", r: "M104 102 Q145 108 150 126 Q135 138 104 134" },
    ].map((rib, i) => (
      <g key={i}>
        <path d={rib.l} stroke="#fed7aa" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.25" fill="none" />
        <path d={rib.r} stroke="#fed7aa" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.25" fill="none" />
      </g>
    ))}
    {/* Diaphragm Dome */}
    <path d="M30 140 Q65 110 100 125 Q135 110 170 140" stroke="#f97316" strokeWidth="2" strokeOpacity="0.3" fill="none" />
  </svg>
);

// 3. CT Scan 2D Coronal Skull/Brain Watermark
export const Ct2dWatermark = () => (
  <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full object-contain">
    <defs>
      <radialGradient id="ctSliceGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
      </radialGradient>
    </defs>
    <ellipse cx="100" cy="80" rx="55" ry="65" fill="url(#ctSliceGlow)" />
    {/* Cranium / Skull Contour */}
    <path d="M100 20 C60 20 45 45 45 80 C45 110 65 135 85 142 C95 145 105 145 115 142 C135 135 155 110 155 80 C155 45 140 20 100 20 Z" 
      stroke="#38bdf8" strokeWidth="3" strokeOpacity="0.45" fill="#0f172a" fillOpacity="0.3" />
    <path d="M100 26 C66 26 53 48 53 80 C53 106 70 128 88 135 C96 138 104 138 112 135 C130 128 147 106 147 80 C147 48 134 26 100 26 Z" 
      stroke="#60a5fa" strokeWidth="1" strokeOpacity="0.3" fill="none" strokeDasharray="3 2" />
    {/* Brain Ventricles (Butterfly shape) */}
    <path d="M96 55 C90 65 75 70 76 80 C77 90 92 88 96 98 L100 98 L104 98 C108 88 123 90 124 80 C125 70 110 65 104 55 Z" 
      fill="#38bdf8" fillOpacity="0.25" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.6" />
    {/* Sulci / Gyri brain tissue curves */}
    <path d="M60 60 Q75 68 65 85 Q75 95 62 105" stroke="#93c5fd" strokeWidth="1.2" strokeOpacity="0.3" fill="none" />
    <path d="M140 60 Q125 68 135 85 Q125 95 138 105" stroke="#93c5fd" strokeWidth="1.2" strokeOpacity="0.3" fill="none" />
    <path d="M80 38 Q100 45 120 38" stroke="#93c5fd" strokeWidth="1" strokeOpacity="0.35" fill="none" />
    {/* Crosshair Target Scan Lines */}
    <line x1="25" y1="80" x2="175" y2="80" stroke="#0284c7" strokeWidth="0.8" strokeOpacity="0.3" strokeDasharray="5 3" />
    <line x1="100" y1="10" x2="100" y2="150" stroke="#0284c7" strokeWidth="0.8" strokeOpacity="0.3" strokeDasharray="5 3" />
  </svg>
);

// 4. CT Scan (Tumor) / 3D Brain with Glowing Red Tumor Watermark
export const CtTumor3dWatermark = () => (
  <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full object-contain">
    <defs>
      <radialGradient id="tumorGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
        <stop offset="40%" stopColor="#dc2626" stopOpacity="0.6" />
        <stop offset="80%" stopColor="#991b1b" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="brainWire" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.6" />
        <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.1" />
      </linearGradient>
    </defs>
    
    {/* Holographic Radar / Perspective Ground Rings */}
    <ellipse cx="110" cy="125" rx="80" ry="22" stroke="#3b82f6" strokeWidth="1.2" strokeOpacity="0.35" fill="none" />
    <ellipse cx="110" cy="125" rx="60" ry="16" stroke="#60a5fa" strokeWidth="1" strokeOpacity="0.45" strokeDasharray="4 3" fill="none" />
    <ellipse cx="110" cy="125" rx="35" ry="9" stroke="#93c5fd" strokeWidth="1" strokeOpacity="0.6" fill="none" />
    
    {/* 3D Brain Mesh Wireframe Silhouette */}
    <g transform="translate(10, 5)">
      {/* Brain Outer Cortex Contour */}
      <path d="M40 70 C35 50 50 30 75 22 C95 16 125 18 145 32 C160 42 165 60 160 78 C155 95 145 105 130 110 C110 115 85 112 65 105 C45 98 40 85 40 70 Z" 
        stroke="#60a5fa" strokeWidth="1.8" strokeOpacity="0.5" fill="url(#brainWire)" />
      
      {/* Frontal / Parietal / Occipital Lobes Structural Curves */}
      <path d="M75 22 C85 40 85 65 70 85 C55 100 65 105 65 105" stroke="#93c5fd" strokeWidth="1" strokeOpacity="0.35" fill="none" />
      <path d="M110 19 C115 38 120 60 115 85 C110 105 125 110 130 110" stroke="#93c5fd" strokeWidth="1" strokeOpacity="0.35" fill="none" />
      <path d="M145 32 C135 50 135 70 145 88" stroke="#93c5fd" strokeWidth="1" strokeOpacity="0.35" fill="none" />
      
      {/* Horizontal Latitude Slices */}
      <path d="M45 50 Q100 40 155 50" stroke="#3b82f6" strokeWidth="0.8" strokeOpacity="0.3" strokeDasharray="3 2" fill="none" />
      <path d="M40 70 Q100 60 160 70" stroke="#3b82f6" strokeWidth="1" strokeOpacity="0.4" fill="none" />
      <path d="M48 90 Q100 80 150 90" stroke="#3b82f6" strokeWidth="0.8" strokeOpacity="0.3" strokeDasharray="3 2" fill="none" />

      {/* Brainstem / Cerebellum */}
      <path d="M85 108 C80 120 85 130 95 132 C105 130 108 120 105 108" stroke="#60a5fa" strokeWidth="1.5" strokeOpacity="0.4" fill="none" />

      {/* GLOWING RED TUMOR HIGHLIGHT (Volumetric Focus) */}
      <g transform="translate(130, 72)">
        {/* Glow halo */}
        <circle cx="0" cy="0" r="22" fill="url(#tumorGlow)" />
        {/* Core sphere with specular highlight */}
        <circle cx="0" cy="0" r="10" fill="#ef4444" stroke="#fca5a5" strokeWidth="1.5" />
        <circle cx="-3" cy="-3" r="3" fill="#ffffff" fillOpacity="0.8" />
        {/* Scanning Target Rings around Tumor */}
        <circle cx="0" cy="0" r="15" stroke="#f87171" strokeWidth="1" strokeDasharray="3 2" strokeOpacity="0.8" className="animate-spin" style={{ animationDuration: '8s' }} />
        <line x1="-18" y1="0" x2="18" y2="0" stroke="#ef4444" strokeWidth="0.8" strokeOpacity="0.7" />
        <line x1="0" y1="-18" x2="0" y2="18" stroke="#ef4444" strokeWidth="0.8" strokeOpacity="0.7" />
      </g>
    </g>
  </svg>
);

// 5. Ultrasound Sonogram Watermark
export const UltrasoundWatermark = () => (
  <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full object-contain">
    <defs>
      <radialGradient id="usBeam" cx="50%" cy="10%" r="90%">
        <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
        <stop offset="70%" stopColor="#059669" stopOpacity="0.08" />
        <stop offset="100%" stopColor="#047857" stopOpacity="0" />
      </radialGradient>
    </defs>
    {/* Ultrasound Sector Fan Beam */}
    <path d="M100 15 L30 145 A120 120 0 0 0 170 145 Z" fill="url(#usBeam)" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.4" />
    {/* Depth Arc Grids */}
    <path d="M78 60 A50 50 0 0 0 122 60" stroke="#34d399" strokeWidth="0.8" strokeOpacity="0.35" strokeDasharray="3 3" fill="none" />
    <path d="M58 95 A85 85 0 0 0 142 95" stroke="#34d399" strokeWidth="0.8" strokeOpacity="0.35" strokeDasharray="3 3" fill="none" />
    <path d="M42 125 A110 110 0 0 0 158 125" stroke="#34d399" strokeWidth="0.8" strokeOpacity="0.35" strokeDasharray="3 3" fill="none" />
    {/* Sonographic Silhouette / Fetus or Tissue mass contour */}
    <path d="M85 75 C75 80 72 92 80 100 C88 108 102 110 115 105 C125 100 130 88 124 80 C118 72 108 78 102 82 C96 86 92 72 85 75 Z" 
      fill="#6ee7b7" fillOpacity="0.2" stroke="#34d399" strokeWidth="1.2" strokeOpacity="0.5" />
    {/* Acoustic speckle markers */}
    <circle cx="95" cy="90" r="4" fill="#a7f3d0" fillOpacity="0.3" />
    <circle cx="112" cy="94" r="5" fill="#a7f3d0" fillOpacity="0.25" />
    {/* Transducer Probe at apex */}
    <path d="M88 15 Q100 10 112 15 L110 22 Q100 18 90 22 Z" fill="#10b981" fillOpacity="0.6" stroke="#34d399" strokeWidth="1" />
    {/* Depth Calibration Ruler on side */}
    {[30, 50, 70, 90, 110, 130].map((y, i) => (
      <line key={i} x1="175" y1={y} x2="182" y2={y} stroke="#34d399" strokeWidth="1.2" strokeOpacity="0.5" />
    ))}
  </svg>
);

// 6. Full Body Bone Fracture Watermark
export const FractureWatermark = () => (
  <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full object-contain">
    <defs>
      <radialGradient id="fractureGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="boneStructure" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fdba74" stopOpacity="0.6" />
        <stop offset="50%" stopColor="#fb923c" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#c2410c" stopOpacity="0.5" />
      </linearGradient>
    </defs>
    {/* Background Radar Glow */}
    <circle cx="100" cy="80" r="55" fill="url(#fractureGlow)" />
    <circle cx="100" cy="80" r="45" stroke="#f97316" strokeWidth="0.8" strokeDasharray="3 3" strokeOpacity="0.4" />

    {/* Long Bone Upper Epiphysis */}
    <path d="M78 30 C70 20 85 10 95 18 C100 15 110 15 115 20 C125 10 140 20 132 30 C126 38 122 45 120 58 L90 58 C88 45 84 38 78 30 Z" 
      fill="url(#boneStructure)" stroke="#fed7aa" strokeWidth="1.5" strokeOpacity="0.6" />
    
    {/* Upper Diaphysis (Shaft) */}
    <path d="M90 58 L90 74 L120 68 L120 58 Z" fill="url(#boneStructure)" stroke="#fed7aa" strokeWidth="1.2" strokeOpacity="0.5" />

    {/* JAGGED FRACTURE CRACK LINE WITH GLOW */}
    <g>
      <path d="M82 76 L93 72 L101 79 L112 69 L128 77" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M82 76 L93 72 L101 79 L112 69 L128 77" stroke="#fef08a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Fracture impact energy radiating rings */}
      <circle cx="105" cy="74" r="14" stroke="#ef4444" strokeWidth="1" strokeDasharray="2 2" strokeOpacity="0.8" />
      <circle cx="105" cy="74" r="22" stroke="#f97316" strokeWidth="0.8" strokeDasharray="3 2" strokeOpacity="0.5" />
    </g>

    {/* Lower Diaphysis (Shaft) */}
    <path d="M90 82 L90 102 L120 102 L120 78 Z" fill="url(#boneStructure)" stroke="#fed7aa" strokeWidth="1.2" strokeOpacity="0.5" />

    {/* Lower Bone Epiphysis */}
    <path d="M90 102 C85 115 72 120 78 132 C84 142 98 140 105 135 C112 140 126 142 132 132 C138 120 125 115 120 102 Z" 
      fill="url(#boneStructure)" stroke="#fed7aa" strokeWidth="1.5" strokeOpacity="0.6" />
  </svg>
);

