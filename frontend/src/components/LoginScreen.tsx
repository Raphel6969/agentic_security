import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Lock, 
  Key, 
  Terminal, 
  Sparkles, 
  Eye, 
  EyeOff, 
  User, 
  Zap, 
  Radio, 
  CheckCircle2, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { UserRole, UserSession } from '../types';
import { loginDemoRole } from '../services/api';

interface LoginScreenProps {
  onLoginSuccess: (session: UserSession) => void;
  onBackToLanding?: () => void;
  reducedMotion?: boolean;
}

interface RoleOption {
  role: UserRole;
  name: string;
  displayTitle: string;
  email: string;
  icon: string;
  themeColor: string;
  borderClass: string;
  bgClass: string;
  textClass: string;
  shadowClass: string;
  permissions: string[];
}

const ROLES: RoleOption[] = [
  {
    role: 'admin',
    name: 'Saswat',
    displayTitle: 'Admin (Saswat)',
    email: 'saswat.admin@sentinel.sec',
    icon: '👑',
    themeColor: '#F59E0B',
    borderClass: 'border-amber-500/40 hover:border-amber-400',
    bgClass: 'bg-amber-500/10 hover:bg-amber-500/20',
    textClass: 'text-amber-300',
    shadowClass: 'shadow-[0_0_20px_rgba(245,158,11,0.25)]',
    permissions: ['ALL_PERMISSIONS', 'POLICY_OVERRIDE', 'SOC_SUPERVISOR', 'EXECUTE_ANY']
  },
  {
    role: 'developer',
    name: 'Dev Engineer',
    displayTitle: 'Developer',
    email: 'dev.ai@sentinel.sec',
    icon: '💻',
    themeColor: '#10B981',
    borderClass: 'border-emerald-500/40 hover:border-emerald-400',
    bgClass: 'bg-emerald-500/10 hover:bg-emerald-500/20',
    textClass: 'text-emerald-300',
    shadowClass: 'shadow-[0_0_20px_rgba(16,185,129,0.25)]',
    permissions: ['SDK_INTEGRATE', 'TEST_ATTACK_LAB', 'VIEW_TRACES', 'SIMULATE_AGENT']
  },
  {
    role: 'intern',
    name: 'Junior Analyst',
    displayTitle: 'Intern (Restricted)',
    email: 'intern.temp@sentinel.sec',
    icon: '🪪',
    themeColor: '#8B5CF6',
    borderClass: 'border-purple-500/40 hover:border-purple-400',
    bgClass: 'bg-purple-500/10 hover:bg-purple-500/20',
    textClass: 'text-purple-300',
    shadowClass: 'shadow-[0_0_20px_rgba(139,92,246,0.25)]',
    permissions: ['READ_AUDIT_LOGS', 'RESTRICTED_ACCESS']
  },
  {
    role: 'tech_lead',
    name: 'Alex Vance',
    displayTitle: 'Tech Lead',
    email: 'alex.lead@sentinel.sec',
    icon: '🛡️',
    themeColor: '#3B82F6',
    borderClass: 'border-blue-500/40 hover:border-blue-400',
    bgClass: 'bg-blue-500/10 hover:bg-blue-500/20',
    textClass: 'text-blue-300',
    shadowClass: 'shadow-[0_0_20px_rgba(59,130,246,0.25)]',
    permissions: ['POLICY_ENGINE_EDIT', 'CASCADE_THRESHOLD_CONTROL', 'AUDIT_APPROVE']
  }
];

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onBackToLanding, reducedMotion = false }) => {
  const [authMode, setAuthMode] = useState<'role' | 'credentials'>('role');
  const [accountNumber, setAccountNumber] = useState('SENTINEL-SEC-8809');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStageText, setAuthStageText] = useState('Initiating cryptographic handshake...');
  const [activeBounceBoost, setActiveBounceBoost] = useState(false);
  const [activeNodeName, setActiveNodeName] = useState<string | null>(null);

  const triggerSecurityBounce = () => {
    setActiveBounceBoost(true);
    setTimeout(() => setActiveBounceBoost(false), 2000);
  };

  const handleRoleLogin = async (roleOption: RoleOption) => {
    setIsAuthenticating(true);
    setAuthStageText(`Authenticating as ${roleOption.displayTitle}...`);

    try {
      // Call real backend demo login to obtain signed JWT token
      const authResult = await loginDemoRole(roleOption.role).catch(() => null);
      
      setAuthStageText('Verifying JWT HS256 & Stage 0 RBAC claims...');
      await new Promise(r => setTimeout(r, 350));

      setAuthStageText('Handshake approved! Connecting to Sentinel Gateway...');
      await new Promise(r => setTimeout(r, 350));

      const session: UserSession = {
        id: authResult?.user?.id || `usr_${Math.random().toString(36).substring(2, 9)}`,
        name: authResult?.user?.name || roleOption.name,
        role: (authResult?.user?.role as UserRole) || roleOption.role,
        roleTitle: roleOption.displayTitle,
        badge: roleOption.icon,
        email: authResult?.user?.email || roleOption.email,
        avatarColor: roleOption.themeColor,
        authMethod: 'one_click',
        loginTime: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
        permissions: roleOption.permissions
      };
      onLoginSuccess(session);
    } catch (err) {
      const session: UserSession = {
        id: `usr_${Math.random().toString(36).substring(2, 9)}`,
        name: roleOption.name,
        role: roleOption.role,
        roleTitle: roleOption.displayTitle,
        badge: roleOption.icon,
        email: roleOption.email,
        avatarColor: roleOption.themeColor,
        authMethod: 'one_click',
        loginTime: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
        permissions: roleOption.permissions
      };
      onLoginSuccess(session);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleOAuthLogin = (provider: 'Google' | 'GitHub') => {
    setIsAuthenticating(true);
    setAuthStageText(`Connecting via ${provider} Identity Provider...`);

    setTimeout(() => {
      setAuthStageText(`Received ${provider} OAuth Token → Mapping to Sentinel RBAC...`);
    }, 550);

    setTimeout(() => {
      const session: UserSession = {
        id: `oauth_${Math.random().toString(36).substring(2, 9)}`,
        name: provider === 'Google' ? 'Saswat (Google)' : 'Saswat (GitHub)',
        role: 'admin',
        roleTitle: `Admin (${provider})`,
        badge: '👑',
        email: provider === 'Google' ? 'saswat@google.dev' : 'saswat@github.dev',
        avatarColor: provider === 'Google' ? '#4285F4' : '#24292F',
        authMethod: provider === 'Google' ? 'oauth_google' : 'oauth_github',
        loginTime: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
        permissions: ['ALL_PERMISSIONS', 'POLICY_OVERRIDE', 'SOC_SUPERVISOR']
      };
      onLoginSuccess(session);
    }, 1250);
  };

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setAuthStageText(`Verifying account ${accountNumber}...`);

    setTimeout(() => {
      setAuthStageText('Decrypting password hash & checking Sentinel security posture...');
    }, 500);

    setTimeout(() => {
      const session: UserSession = {
        id: `acc_${Math.random().toString(36).substring(2, 9)}`,
        name: accountNumber.replace('SENTINEL-SEC-', 'Operator '),
        role: 'tech_lead',
        roleTitle: 'Security Operator',
        badge: '🛡️',
        email: `${accountNumber.toLowerCase()}@sentinel.internal`,
        avatarColor: '#0EA5E9',
        authMethod: 'credentials',
        loginTime: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
        permissions: ['POLICY_ENGINE_EDIT', 'CASCADE_THRESHOLD_CONTROL', 'AUDIT_APPROVE']
      };
      onLoginSuccess(session);
    }, 1200);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#020617] text-slate-100 flex items-center justify-center overflow-x-hidden p-4 sm:p-6 lg:p-8 selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Background Starry Cyber Grids & Neon Blue Volumetric Glows */}
      <div className="absolute inset-0 bg-tech-grid opacity-60 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-[650px] h-[650px] bg-cyan-600/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[650px] h-[650px] bg-blue-600/15 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-indigo-950/30 rounded-full blur-[180px] pointer-events-none" />

      {/* Floating Animated Cyber Dust Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(22)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-cyan-400"
            style={{
              top: `${(i * 17) % 100}%`,
              left: `${(i * 23) % 100}%`,
              width: `${(i % 3) + 2}px`,
              height: `${(i % 3) + 2}px`,
              opacity: 0.35 + ((i % 5) * 0.1),
            }}
            animate={reducedMotion ? {} : {
              y: [0, -32 - (i * 3), 0],
              x: [0, (i % 2 === 0 ? 12 : -12), 0],
              opacity: [0.2, 0.8, 0.2]
            }}
            transition={{
              duration: 4 + (i % 3),
              repeat: Infinity,
              ease: "easeInOut",
              delay: (i * 0.2)
            }}
          />
        ))}
      </div>

      {/* Main Stage Grid Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center min-h-[85vh]">

        {/* ========================================================================= */}
        {/* LEFT COLUMN: 3D CYBER SECURITY PLATFORM (ELECTRIC BLUE & CYAN THEME)      */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 xl:col-span-7 relative flex flex-col items-center justify-center order-2 lg:order-1 pt-6 lg:pt-0">
          
          {/* Eyebrow Header & Resonator Trigger */}
          <div className="w-full flex items-center justify-between mb-3 px-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] animate-pulse" />
              <span className="text-[11px] font-mono tracking-widest text-cyan-300 font-bold uppercase">
                Active Holographic Security Matrix
              </span>
            </div>
            
            <button
              type="button"
              onClick={triggerSecurityBounce}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono bg-cyan-500/10 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-400/40 transition-all hover:scale-105 cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.25)]"
              title="Trigger bouncing visual effect across all security components"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-300 animate-bounce" />
              <span>Bounce Resonator Pulse</span>
            </button>
          </div>

          {/* 3D Isometric Cyber Security Stage Canvas */}
          <div className="relative w-full max-w-[620px] aspect-[1.15/1] sm:aspect-[1.25/1] flex items-center justify-center">
            
            {/* Concentric Neon Rings & Perspective Floor Grid */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              
              {/* Outer Large Neon Ring */}
              <div className="w-[380px] sm:w-[480px] h-[210px] sm:h-[260px] rounded-[100%] border-2 border-cyan-500/30 shadow-[0_0_60px_rgba(6,182,212,0.25)] relative transform rotate-[-6deg] flex items-center justify-center">
                <div className="absolute top-2 left-1/4 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee] animate-ping" />
                <div className="absolute bottom-3 right-1/4 w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_12px_#60a5fa]" />
                <div className="absolute top-1/2 right-1 w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-[0_0_12px_#818cf8]" />
              </div>

              {/* Middle Rotating Laser Orbit Ring */}
              <motion.div 
                className="absolute w-[260px] sm:w-[340px] h-[140px] sm:h-[190px] rounded-[100%] border border-cyan-400/50 shadow-[0_0_35px_rgba(34,211,238,0.4)] transform rotate-[-6deg]"
                animate={reducedMotion ? {} : { rotate: [-6, 354] }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              />

              {/* Floor Ambient Blue Glow */}
              <div className="w-[280px] h-[140px] rounded-[100%] bg-cyan-500/20 blur-2xl" />
            </div>

            {/* Connecting Neon Blue Laser Rays */}
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible" 
              viewBox="0 0 600 500"
            >
              <defs>
                <linearGradient id="rayGradientBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.9" />
                  <stop offset="60%" stopColor="#3B82F6" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.2" />
                </linearGradient>
                <filter id="glowBlue">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* 6 Radiant Rays from Center (300, 250) */}
              <line x1="300" y1="250" x2="170" y2="130" stroke="url(#rayGradientBlue)" strokeWidth="2.5" filter="url(#glowBlue)" strokeDasharray="4 3" />
              <line x1="300" y1="250" x2="100" y2="250" stroke="url(#rayGradientBlue)" strokeWidth="2.5" filter="url(#glowBlue)" strokeDasharray="4 3" />
              <line x1="300" y1="250" x2="170" y2="370" stroke="url(#rayGradientBlue)" strokeWidth="2.5" filter="url(#glowBlue)" strokeDasharray="4 3" />
              <line x1="300" y1="250" x2="430" y2="130" stroke="url(#rayGradientBlue)" strokeWidth="2.5" filter="url(#glowBlue)" strokeDasharray="4 3" />
              <line x1="300" y1="250" x2="500" y2="250" stroke="url(#rayGradientBlue)" strokeWidth="2.5" filter="url(#glowBlue)" strokeDasharray="4 3" />
              <line x1="300" y1="250" x2="430" y2="370" stroke="url(#rayGradientBlue)" strokeWidth="2.5" filter="url(#glowBlue)" strokeDasharray="4 3" />

              {/* Laser Energy Nodes traveling on rays */}
              <circle cx="235" cy="190" r="3" fill="#67E8F9" filter="url(#glowBlue)">
                <animate attributeName="opacity" values="0.2;1;0.2" dur="1.8s" repeatCount="indefinite" />
              </circle>
              <circle cx="200" cy="250" r="3" fill="#67E8F9" filter="url(#glowBlue)">
                <animate attributeName="opacity" values="0.3;1;0.3" dur="2.2s" repeatCount="indefinite" />
              </circle>
              <circle cx="235" cy="310" r="3" fill="#67E8F9" filter="url(#glowBlue)">
                <animate attributeName="opacity" values="0.1;0.9;0.1" dur="2.0s" repeatCount="indefinite" />
              </circle>
              <circle cx="365" cy="190" r="3" fill="#67E8F9" filter="url(#glowBlue)">
                <animate attributeName="opacity" values="0.2;1;0.2" dur="2.1s" repeatCount="indefinite" />
              </circle>
              <circle cx="400" cy="250" r="3" fill="#67E8F9" filter="url(#glowBlue)">
                <animate attributeName="opacity" values="0.4;1;0.4" dur="2.4s" repeatCount="indefinite" />
              </circle>
              <circle cx="365" cy="310" r="3" fill="#67E8F9" filter="url(#glowBlue)">
                <animate attributeName="opacity" values="0.1;1;0.1" dur="1.9s" repeatCount="indefinite" />
              </circle>
            </svg>


            {/* ========================================================================= */}
            {/* CENTRAL PODIUM: 3D GLOWING ELECTRIC BLUE / CYAN SHIELD (BOUNCING)         */}
            {/* ========================================================================= */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center">
              
              {/* Circular Pedestal Disc with Concentric Blue Laser LED Slots */}
              <div className="relative flex flex-col items-center justify-center">
                
                {/* Volumetric Under-glow halo */}
                <div className="absolute -bottom-4 w-48 h-18 rounded-[100%] bg-cyan-500/40 blur-xl" />
                
                {/* 3D Isometric Center Disc Base */}
                <div className="w-36 sm:w-44 h-14 sm:h-16 rounded-[100%] bg-gradient-to-b from-slate-800 via-slate-900 to-black border-2 border-cyan-400/70 shadow-[0_15px_35px_rgba(0,0,0,0.9),0_0_30px_rgba(6,182,212,0.4),inset_0_2px_4px_rgba(255,255,255,0.3)] flex items-center justify-center relative">
                  {/* Inner illuminated blue ring */}
                  <div className="w-3/4 h-3/4 rounded-[100%] border border-cyan-300/80 bg-cyan-950/60 shadow-[0_0_25px_rgba(34,211,238,0.5)] flex items-center justify-center" />
                </div>

                {/* Floating 3D Glowing Electric Cyan Shield Model */}
                <motion.div
                  className="absolute -top-14 sm:-top-18 cursor-pointer group"
                  animate={reducedMotion ? {} : {
                    y: activeBounceBoost ? [-15, -45, 0, -18, 0] : [0, -14, 0],
                    scale: activeBounceBoost ? [1, 1.15, 0.95, 1.05, 1] : [1, 1.02, 1],
                  }}
                  transition={{
                    duration: activeBounceBoost ? 1.2 : 3.0,
                    repeat: activeBounceBoost ? 0 : Infinity,
                    ease: "easeInOut"
                  }}
                  onClick={() => {
                    setActiveNodeName('RUNTIME_SHIELD');
                    triggerSecurityBounce();
                  }}
                >
                  <div className="relative w-26 h-30 sm:w-34 sm:h-38 flex items-center justify-center">
                    
                    {/* Glowing Back Cyan Aura */}
                    <div className="absolute inset-0 rounded-[28px] bg-cyan-400 blur-xl opacity-75 group-hover:opacity-100 transition-opacity" />

                    {/* 3D Glassmorphic Cyan Shield SVG with Beveled Edges & Glowing Checkmark */}
                    <svg viewBox="0 0 100 120" className="w-full h-full filter drop-shadow-[0_12px_28px_rgba(0,0,0,0.9)]">
                      <defs>
                        {/* Outer Bevel Rim Gradient */}
                        <linearGradient id="blueShieldRim" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#E0F2FE" />
                          <stop offset="25%" stopColor="#67E8F9" />
                          <stop offset="60%" stopColor="#0284C7" />
                          <stop offset="100%" stopColor="#0C4A6E" />
                        </linearGradient>

                        {/* Inner Shield Body Gradient */}
                        <linearGradient id="blueShieldBody" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#0284C7" stopOpacity="0.95" />
                          <stop offset="40%" stopColor="#0369A1" stopOpacity="0.95" />
                          <stop offset="100%" stopColor="#082F49" stopOpacity="0.98" />
                        </linearGradient>

                        {/* Specular Highlight Gradient */}
                        <linearGradient id="blueCheckmark" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#FFFFFF" />
                          <stop offset="40%" stopColor="#A5F3FC" />
                          <stop offset="100%" stopColor="#38BDF8" />
                        </linearGradient>
                      </defs>

                      {/* Shield Outer 3D Extruded Bevel Rim */}
                      <path 
                        d="M50 8 C75 8, 92 18, 92 38 C92 72, 68 98, 50 112 C32 98, 8 72, 8 38 C8 18, 25 8, 50 8 Z" 
                        fill="url(#blueShieldRim)"
                        stroke="#F0F9FF"
                        strokeWidth="1.6"
                      />

                      {/* Shield Inner Face Recess */}
                      <path 
                        d="M50 16 C70 16, 84 24, 84 41 C84 69, 64 92, 50 103 C36 92, 16 69, 16 41 C16 24, 30 16, 50 16 Z" 
                        fill="url(#blueShieldBody)"
                      />

                      {/* Specular Highlight Streak */}
                      <path 
                        d="M26 30 C30 22, 42 19, 50 19 C35 25, 23 40, 23 58 C23 66, 26 74, 30 82 C22 72, 19 56, 19 42 C19 36, 22 32, 26 30 Z" 
                        fill="#FFFFFF" 
                        opacity="0.4" 
                      />

                      {/* 3D Bold Glowing Checkmark Glyph in Center */}
                      <path 
                        d="M36 56 L47 67 L68 44 L73 49 L47 77 L31 61 Z" 
                        fill="url(#blueCheckmark)"
                        stroke="#0369A1"
                        strokeWidth="1"
                        filter="drop-shadow(0 0 8px rgba(34,211,238,0.9))"
                      />
                    </svg>

                  </div>
                </motion.div>
              </div>
            </div>


            {/* ========================================================================= */}
            {/* NODE 1 (TOP-LEFT): 3D CODE EDITOR WINDOW (< / >) - BLUE THEME             */}
            {/* ========================================================================= */}
            <div className="absolute top-[8%] left-[16%] sm:left-[18%] z-10 flex flex-col items-center">
              
              {/* Pedestal Base */}
              <div className="w-18 sm:w-22 h-7 sm:h-8 rounded-[100%] bg-gradient-to-b from-slate-800 via-slate-900 to-black border border-cyan-500/40 shadow-[0_8px_20px_rgba(0,0,0,0.8),0_0_15px_rgba(6,182,212,0.2)] relative flex items-center justify-center">
                <div className="w-3/4 h-3/4 rounded-[100%] border border-cyan-400/40 bg-cyan-950/40" />
              </div>

              {/* Floating 3D Code Window */}
              <motion.div
                className="absolute -top-11 sm:-top-13 cursor-pointer group"
                animate={reducedMotion ? {} : {
                  y: activeBounceBoost ? [-12, -35, 4, -15, 0] : [0, -15, 0],
                  rotate: [0, -2, 0, 2, 0]
                }}
                transition={{
                  duration: activeBounceBoost ? 1.1 : 2.8,
                  repeat: activeBounceBoost ? 0 : Infinity,
                  ease: "easeInOut",
                  delay: 0.1
                }}
                onClick={() => {
                  setActiveNodeName('SANDBOX_IDE');
                  triggerSecurityBounce();
                }}
              >
                <div className="relative w-16 h-14 sm:w-20 sm:h-16 rounded-xl bg-gradient-to-br from-slate-800 via-slate-900 to-cyan-950 border-2 border-cyan-400/80 shadow-[0_10px_25px_rgba(0,0,0,0.7),0_0_20px_rgba(6,182,212,0.35),inset_0_1px_2px_rgba(255,255,255,0.4)] p-1.5 flex flex-col justify-between backdrop-blur-md group-hover:border-cyan-300 transition-colors">
                  
                  {/* Top Bar with 3 Neon Dots */}
                  <div className="flex items-center gap-1 pb-1 border-b border-cyan-500/30">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  </div>

                  {/* Body: Left Code Lines + Right < / > */}
                  <div className="flex items-center justify-between gap-1 mt-0.5">
                    <div className="flex flex-col gap-1 flex-1">
                      <div className="w-full h-1 rounded bg-cyan-300/80 shadow-[0_0_4px_#22d3ee]" />
                      <div className="w-3/4 h-1 rounded bg-blue-300/60" />
                      <div className="w-5/6 h-1 rounded bg-cyan-400/60" />
                    </div>

                    <div className="px-1.5 py-0.5 rounded bg-cyan-950/90 border border-cyan-400 text-[10px] sm:text-xs font-mono font-bold text-cyan-200 shadow-[0_0_10px_rgba(34,211,238,0.4)]">
                      &lt;/&gt;
                    </div>
                  </div>
                </div>

                <div className="mt-1 text-center text-[9px] font-mono text-cyan-300 font-semibold">
                  Sandbox IDE
                </div>
              </motion.div>
            </div>


            {/* ========================================================================= */}
            {/* NODE 2 (MIDDLE-LEFT): 3D DATA GRID & MAGNIFYING GLASS - BLUE THEME        */}
            {/* ========================================================================= */}
            <div className="absolute top-[48%] left-[2%] sm:left-[6%] -translate-y-1/2 z-10 flex flex-col items-center">
              
              {/* Pedestal Base */}
              <div className="w-18 sm:w-22 h-7 sm:h-8 rounded-[100%] bg-gradient-to-b from-slate-800 via-slate-900 to-black border border-cyan-500/40 shadow-[0_8px_20px_rgba(0,0,0,0.8),0_0_15px_rgba(6,182,212,0.2)] relative flex items-center justify-center">
                <div className="w-3/4 h-3/4 rounded-[100%] border border-cyan-400/40 bg-cyan-950/40" />
              </div>

              {/* Floating 3D Table & Magnifier */}
              <motion.div
                className="absolute -top-11 sm:-top-13 cursor-pointer group"
                animate={reducedMotion ? {} : {
                  y: activeBounceBoost ? [-14, -38, 2, -18, 0] : [0, -16, 0],
                  rotate: [0, 3, 0, -3, 0]
                }}
                transition={{
                  duration: activeBounceBoost ? 1.25 : 3.2,
                  repeat: activeBounceBoost ? 0 : Infinity,
                  ease: "easeInOut",
                  delay: 0.25
                }}
                onClick={() => {
                  setActiveNodeName('THREAT_INSPECTOR');
                  triggerSecurityBounce();
                }}
              >
                <div className="relative w-16 h-14 sm:w-20 sm:h-16 rounded-xl bg-gradient-to-br from-slate-800 via-slate-900 to-cyan-950 border-2 border-cyan-400/80 shadow-[0_10px_25px_rgba(0,0,0,0.7),0_0_20px_rgba(6,182,212,0.35),inset_0_1px_2px_rgba(255,255,255,0.4)] p-1.5 flex flex-col justify-between group-hover:border-cyan-300 transition-colors">
                  
                  {/* Top Bar */}
                  <div className="flex items-center justify-between pb-1 border-b border-cyan-500/30">
                    <div className="w-4 h-1 rounded bg-cyan-300/80" />
                    <div className="w-2 h-1 rounded bg-blue-300/80" />
                  </div>

                  {/* Grid Cells */}
                  <div className="grid grid-cols-3 gap-0.5 my-auto">
                    <div className="h-2 rounded-[2px] bg-cyan-900/60 border border-cyan-500/30" />
                    <div className="h-2 rounded-[2px] bg-cyan-900/60 border border-cyan-500/30" />
                    <div className="h-2 rounded-[2px] bg-cyan-900/60 border border-cyan-500/30" />
                    <div className="h-2 rounded-[2px] bg-cyan-900/60 border border-cyan-500/30" />
                    <div className="h-2 rounded-[2px] bg-cyan-900/60 border border-cyan-500/30" />
                    <div className="h-2 rounded-[2px] bg-cyan-900/60 border border-cyan-500/30" />
                  </div>

                  {/* 3D Magnifying Glass with Glowing Cyan Lens */}
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center">
                    <div className="relative flex items-center justify-center">
                      <div className="w-5 h-5 rounded-full border-2 border-cyan-200 bg-cyan-400/30 backdrop-blur-sm shadow-[0_0_12px_#22d3ee] flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
                      </div>
                      <div className="absolute bottom-0 right-0 w-2.5 h-1 rounded-sm bg-cyan-200 transform rotate-45 translate-x-1 translate-y-1 shadow-md" />
                    </div>
                  </div>
                </div>

                <div className="mt-1 text-center text-[9px] font-mono text-cyan-300 font-semibold">
                  Threat Inspector
                </div>
              </motion.div>
            </div>


            {/* ========================================================================= */}
            {/* NODE 3 (BOTTOM-LEFT): 3D PADLOCK WITH PASSWORD STARS - BLUE THEME         */}
            {/* ========================================================================= */}
            <div className="absolute bottom-[8%] left-[16%] sm:left-[18%] z-10 flex flex-col items-center">
              
              {/* Pedestal Base */}
              <div className="w-18 sm:w-22 h-7 sm:h-8 rounded-[100%] bg-gradient-to-b from-slate-800 via-slate-900 to-black border border-cyan-500/40 shadow-[0_8px_20px_rgba(0,0,0,0.8),0_0_15px_rgba(6,182,212,0.2)] relative flex items-center justify-center">
                <div className="w-3/4 h-3/4 rounded-[100%] border border-cyan-400/40 bg-cyan-950/40" />
              </div>

              {/* Floating 3D Padlock & Stars */}
              <motion.div
                className="absolute -top-12 sm:-top-15 cursor-pointer group flex flex-col items-center"
                animate={reducedMotion ? {} : {
                  y: activeBounceBoost ? [-13, -36, 3, -16, 0] : [0, -15, 0],
                  rotate: [0, -3, 0, 3, 0]
                }}
                transition={{
                  duration: activeBounceBoost ? 1.2 : 3.4,
                  repeat: activeBounceBoost ? 0 : Infinity,
                  ease: "easeInOut",
                  delay: 0.4
                }}
                onClick={() => {
                  setActiveNodeName('KEY_VAULT');
                  triggerSecurityBounce();
                }}
              >
                <div className="relative flex flex-col items-center">
                  
                  {/* Metallic Cyan Shackle */}
                  <div className="w-6 h-5 rounded-t-full border-2 border-cyan-300 border-b-0 bg-transparent shadow-[0_0_8px_rgba(34,211,238,0.4)]" />
                  
                  {/* Lock Body with Keyhole */}
                  <div className="w-10 h-8 rounded-lg bg-gradient-to-b from-slate-800 via-cyan-950 to-slate-900 border-2 border-cyan-400 shadow-[0_6px_15px_rgba(0,0,0,0.8),0_0_15px_rgba(6,182,212,0.4),inset_0_1px_2px_rgba(255,255,255,0.4)] flex flex-col items-center justify-center group-hover:border-cyan-300 transition-colors">
                    <div className="w-2 h-2.5 rounded-t-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] flex flex-col items-center justify-end pb-0.5">
                      <div className="w-0.5 h-1 bg-slate-950" />
                    </div>
                  </div>

                  {/* Password Star Input Bar (★ ★ ★ ★) */}
                  <div className="mt-1 px-2.5 py-0.5 rounded-full bg-cyan-950/90 border border-cyan-400/80 shadow-[0_0_12px_rgba(34,211,238,0.3)] flex items-center gap-1">
                    <span className="text-[11px] font-bold text-cyan-300 leading-none">★</span>
                    <span className="text-[11px] font-bold text-cyan-300 leading-none">★</span>
                    <span className="text-[11px] font-bold text-cyan-300 leading-none">★</span>
                    <span className="text-[11px] font-bold text-cyan-300 leading-none">★</span>
                  </div>
                </div>

                <div className="mt-1 text-center text-[9px] font-mono text-cyan-300 font-semibold">
                  Key Vault
                </div>
              </motion.div>
            </div>


            {/* ========================================================================= */}
            {/* NODE 4 (TOP-RIGHT): 3D CLOUD WITH PADLOCK - BLUE THEME                    */}
            {/* ========================================================================= */}
            <div className="absolute top-[8%] right-[16%] sm:right-[18%] z-10 flex flex-col items-center">
              
              {/* Pedestal Base */}
              <div className="w-18 sm:w-22 h-7 sm:h-8 rounded-[100%] bg-gradient-to-b from-slate-800 via-slate-900 to-black border border-cyan-500/40 shadow-[0_8px_20px_rgba(0,0,0,0.8),0_0_15px_rgba(6,182,212,0.2)] relative flex items-center justify-center">
                <div className="w-3/4 h-3/4 rounded-[100%] border border-cyan-400/40 bg-cyan-950/40" />
              </div>

              {/* Floating 3D Cloud with Padlock */}
              <motion.div
                className="absolute -top-11 sm:-top-13 cursor-pointer group flex flex-col items-center"
                animate={reducedMotion ? {} : {
                  y: activeBounceBoost ? [-15, -40, 5, -17, 0] : [0, -16, 0],
                  rotate: [0, 3, 0, -3, 0]
                }}
                transition={{
                  duration: activeBounceBoost ? 1.15 : 3.1,
                  repeat: activeBounceBoost ? 0 : Infinity,
                  ease: "easeInOut",
                  delay: 0.18
                }}
                onClick={() => {
                  setActiveNodeName('CLOUD_GATEWAY');
                  triggerSecurityBounce();
                }}
              >
                <div className="relative w-16 h-12 sm:w-20 sm:h-14 flex items-center justify-center">
                  
                  {/* Cloud Silhouette SVG */}
                  <svg viewBox="0 0 100 70" className="w-full h-full filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.85)]">
                    <defs>
                      <linearGradient id="cloudGradBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#38BDF8" />
                        <stop offset="40%" stopColor="#0284C7" />
                        <stop offset="100%" stopColor="#082F49" />
                      </linearGradient>
                    </defs>

                    <path 
                      d="M25 55 C12 55 5 44 10 32 C12 25 20 20 28 22 C34 10 52 8 62 18 C70 14 82 18 86 28 C95 32 95 48 84 55 Z" 
                      fill="url(#cloudGradBlue)"
                      stroke="#BAE6FD"
                      strokeWidth="2"
                    />
                  </svg>

                  {/* 3D Cyan Padlock in Center of Cloud */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative flex flex-col items-center">
                      <div className="w-3.5 h-3 rounded-t-full border border-cyan-200 border-b-0" />
                      <div className="w-6 h-5 rounded-md bg-gradient-to-b from-cyan-900 to-slate-950 border border-cyan-300 flex items-center justify-center shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                        <div className="w-1.5 h-2 rounded-t-full bg-cyan-300" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-1 text-center text-[9px] font-mono text-cyan-300 font-semibold">
                  Cloud Gateway
                </div>
              </motion.div>
            </div>


            {/* ========================================================================= */}
            {/* NODE 5 (MIDDLE-RIGHT): 3D STACKED ISOMETRIC CUBES - BLUE THEME            */}
            {/* ========================================================================= */}
            <div className="absolute top-[48%] right-[2%] sm:right-[6%] -translate-y-1/2 z-10 flex flex-col items-center">
              
              {/* Pedestal Base */}
              <div className="w-18 sm:w-22 h-7 sm:h-8 rounded-[100%] bg-gradient-to-b from-slate-800 via-slate-900 to-black border border-cyan-500/40 shadow-[0_8px_20px_rgba(0,0,0,0.8),0_0_15px_rgba(6,182,212,0.2)] relative flex items-center justify-center">
                <div className="w-3/4 h-3/4 rounded-[100%] border border-cyan-400/40 bg-cyan-950/40" />
              </div>

              {/* Floating 3D Stack of 3 Isometric Cubes */}
              <motion.div
                className="absolute -top-11 sm:-top-13 cursor-pointer group flex flex-col items-center"
                animate={reducedMotion ? {} : {
                  y: activeBounceBoost ? [-14, -39, 4, -18, 0] : [0, -17, 0],
                  rotate: [0, -2, 0, 2, 0]
                }}
                transition={{
                  duration: activeBounceBoost ? 1.2 : 3.3,
                  repeat: activeBounceBoost ? 0 : Infinity,
                  ease: "easeInOut",
                  delay: 0.35
                }}
                onClick={() => {
                  setActiveNodeName('AGENT_BLOCKS');
                  triggerSecurityBounce();
                }}
              >
                <div className="relative w-14 h-14 sm:w-18 sm:h-18 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-[0_8px_18px_rgba(0,0,0,0.85)]">
                    <defs>
                      <linearGradient id="cubeTopBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#BAE6FD" />
                        <stop offset="100%" stopColor="#38BDF8" />
                      </linearGradient>
                      <linearGradient id="cubeLeftBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0284C7" />
                        <stop offset="100%" stopColor="#0369A1" />
                      </linearGradient>
                      <linearGradient id="cubeRightBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0C4A6E" />
                        <stop offset="100%" stopColor="#082F49" />
                      </linearGradient>
                    </defs>

                    {/* TOP CUBE */}
                    <g transform="translate(0, -14)">
                      <polygon points="50,15 72,27 50,39 28,27" fill="url(#cubeTopBlue)" stroke="#E0F2FE" strokeWidth="1" />
                      <polygon points="28,27 50,39 50,62 28,50" fill="url(#cubeLeftBlue)" stroke="#E0F2FE" strokeWidth="1" />
                      <polygon points="50,39 72,27 72,50 50,62" fill="url(#cubeRightBlue)" stroke="#E0F2FE" strokeWidth="1" />
                    </g>

                    {/* BOTTOM-LEFT CUBE */}
                    <g transform="translate(-20, 18)">
                      <polygon points="50,15 72,27 50,39 28,27" fill="url(#cubeTopBlue)" stroke="#E0F2FE" strokeWidth="1" />
                      <polygon points="28,27 50,39 50,62 28,50" fill="url(#cubeLeftBlue)" stroke="#E0F2FE" strokeWidth="1" />
                      <polygon points="50,39 72,27 72,50 50,62" fill="url(#cubeRightBlue)" stroke="#E0F2FE" strokeWidth="1" />
                    </g>

                    {/* BOTTOM-RIGHT CUBE */}
                    <g transform="translate(20, 18)">
                      <polygon points="50,15 72,27 50,39 28,27" fill="url(#cubeTopBlue)" stroke="#E0F2FE" strokeWidth="1" />
                      <polygon points="28,27 50,39 50,62 28,50" fill="url(#cubeLeftBlue)" stroke="#E0F2FE" strokeWidth="1" />
                      <polygon points="50,39 72,27 72,50 50,62" fill="url(#cubeRightBlue)" stroke="#E0F2FE" strokeWidth="1" />
                    </g>
                  </svg>
                </div>

                <div className="mt-1 text-center text-[9px] font-mono text-cyan-300 font-semibold">
                  Agent Blocks
                </div>
              </motion.div>
            </div>


            {/* ========================================================================= */}
            {/* NODE 6 (BOTTOM-RIGHT): 3D AUDIT DOCUMENT WITH SHIELD BADGE - BLUE THEME   */}
            {/* ========================================================================= */}
            <div className="absolute bottom-[8%] right-[16%] sm:right-[18%] z-10 flex flex-col items-center">
              
              {/* Pedestal Base */}
              <div className="w-18 sm:w-22 h-7 sm:h-8 rounded-[100%] bg-gradient-to-b from-slate-800 via-slate-900 to-black border border-cyan-500/40 shadow-[0_8px_20px_rgba(0,0,0,0.8),0_0_15px_rgba(6,182,212,0.2)] relative flex items-center justify-center">
                <div className="w-3/4 h-3/4 rounded-[100%] border border-cyan-400/40 bg-cyan-950/40" />
              </div>

              {/* Floating 3D Document & Shield */}
              <motion.div
                className="absolute -top-11 sm:-top-14 cursor-pointer group flex flex-col items-center"
                animate={reducedMotion ? {} : {
                  y: activeBounceBoost ? [-13, -37, 3, -16, 0] : [0, -15, 0],
                  rotate: [0, 3, 0, -3, 0]
                }}
                transition={{
                  duration: activeBounceBoost ? 1.25 : 3.5,
                  repeat: activeBounceBoost ? 0 : Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
                onClick={() => {
                  setActiveNodeName('AUDIT_REPORT');
                  triggerSecurityBounce();
                }}
              >
                <div className="relative w-14 h-16 sm:w-18 sm:h-20 rounded-xl bg-gradient-to-br from-slate-800 via-slate-900 to-cyan-950 border-2 border-cyan-400/80 shadow-[0_10px_25px_rgba(0,0,0,0.7),0_0_20px_rgba(6,182,212,0.35),inset_0_1px_2px_rgba(255,255,255,0.4)] p-2 flex flex-col justify-between group-hover:border-cyan-300 transition-colors">
                  
                  {/* Folded Corner */}
                  <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-slate-950 border-b border-l border-cyan-400 rounded-bl" />

                  {/* Checklist & Bullet Rows */}
                  <div className="space-y-1.5 mt-0.5">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
                      <div className="w-3/4 h-1 rounded bg-cyan-200" />
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
                      <div className="w-1/2 h-1 rounded bg-blue-300" />
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
                      <div className="w-2/3 h-1 rounded bg-cyan-200" />
                    </div>
                  </div>

                  {/* Docked Miniature 3D Blue Shield Badge at Bottom-Right */}
                  <div className="self-end -mb-1 -mr-1">
                    <div className="w-5 h-6 rounded-b-full bg-gradient-to-b from-cyan-400 to-blue-600 border border-cyan-200 shadow-[0_0_10px_rgba(34,211,238,0.6)] flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-950 fill-cyan-100" />
                    </div>
                  </div>
                </div>

                <div className="mt-1 text-center text-[9px] font-mono text-cyan-300 font-semibold">
                  Audit Report
                </div>
              </motion.div>
            </div>

          </div>

          {/* Interactive Status Footer */}
          <div className="mt-2 text-center text-xs font-mono text-slate-400">
            <span className="text-cyan-400 font-bold">● HOLOGRAPHIC BLUE MATRIX:</span> Click any node or the central shield to trigger physics feedback!
          </div>

        </div>


        {/* ========================================================================= */}
        {/* RIGHT COLUMN: SENTINEL LAYER AUTHENTICATION CONSOLE                       */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 xl:col-span-5 relative w-full flex justify-center order-1 lg:order-2">
          
          {/* Glassmorphic Card Container with Electric Cyan & Blue Border Glow */}
          <div className="relative w-full max-w-[460px] rounded-3xl p-6 sm:p-8 bg-slate-950/85 border border-cyan-500/30 backdrop-blur-2xl shadow-[0_20px_80px_rgba(0,0,0,0.8),0_0_40px_rgba(6,182,212,0.15)] overflow-hidden">
            
            {/* Authenticating Screen Overlay */}
            <AnimatePresence>
              {isAuthenticating && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,211,238,0.5)]"
                  >
                    <Shield className="w-7 h-7 text-cyan-300" />
                  </motion.div>

                  <h3 className="text-lg font-display font-bold text-white mb-2">
                    Authorizing Sentinel Session
                  </h3>
                  
                  <p className="text-xs font-mono text-cyan-300 max-w-xs h-10 flex items-center justify-center animate-pulse">
                    {authStageText}
                  </p>

                  <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-6">
                    <motion.div
                      className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
                      initial={{ width: "10%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1.2, ease: "easeInOut" }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Card Header Top Icon (Shield Check) */}
            <div className="flex flex-col items-center text-center relative">
              {onBackToLanding && (
                <button
                  type="button"
                  onClick={onBackToLanding}
                  className="absolute left-0 top-0 text-xs font-mono text-cyan-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                >
                  ← Back
                </button>
              )}
              <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center mb-4 shadow-[0_0_25px_rgba(6,182,212,0.3)]">
                <Shield className="w-6 h-6 text-cyan-300" />
              </div>

              {/* Main Title */}
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight">
                Sentinel Layer
              </h2>

              {/* Subtitle Badge */}
              <div className="mt-1 text-[11px] font-mono tracking-widest text-cyan-400 font-bold uppercase">
                RUNTIME AI SECURITY PLATFORM
              </div>

              {/* Subtext */}
              <p className="mt-2 text-xs sm:text-sm text-slate-400 font-normal">
                Sign in to access the agentic security console
              </p>
            </div>

            {/* Auth Mode Tabs (1-Click Roles vs Account Credentials) */}
            <div className="mt-6 flex items-center justify-center p-1 rounded-xl bg-white/5 border border-white/10">
              <button
                type="button"
                onClick={() => setAuthMode('role')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                  authMode === 'role'
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white border border-cyan-500/30 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                1-Click Quick Roles
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('credentials')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                  authMode === 'credentials'
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white border border-cyan-500/30 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Account Credentials
              </button>
            </div>

            {/* SECTION A: 1-CLICK ROLE LOGIN (FAST TEST) */}
            {authMode === 'role' && (
              <div className="mt-5">
                <div className="text-[10px] font-mono text-center text-slate-400 uppercase tracking-wider mb-3">
                  1-CLICK ROLE LOGIN (FAST TEST)
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  {ROLES.map((role) => (
                    <button
                      key={role.role}
                      type="button"
                      onClick={() => handleRoleLogin(role)}
                      className={`relative flex items-center justify-center gap-2 p-3 rounded-xl border transition-all text-xs font-mono font-bold cursor-pointer hover:scale-[1.02] ${role.borderClass} ${role.bgClass} ${role.textClass} ${role.shadowClass}`}
                    >
                      <span className="text-sm">{role.icon}</span>
                      <span>{role.displayTitle}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION B: ACCOUNT NUMBER & PASSWORD FORM */}
            {authMode === 'credentials' && (
              <form onSubmit={handleCredentialsSubmit} className="mt-5 space-y-3.5">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    ACCOUNT NUMBER
                  </label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      required
                      placeholder="e.g. SENTINEL-SEC-8809"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    PASSWORD
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 mt-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-mono font-bold shadow-lg shadow-cyan-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Key className="w-4 h-4" />
                  <span>Authenticate Operator</span>
                </button>
              </form>
            )}

            {/* OR SIGN IN WITH OAUTH DIVIDER */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <div className="text-[10px] font-mono text-center text-slate-400 uppercase tracking-wider mb-3">
                OR SIGN IN WITH OAUTH
              </div>

              <div className="space-y-2.5">
                {/* Google OAuth */}
                <button
                  type="button"
                  onClick={() => handleOAuthLogin('Google')}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-200 hover:text-white transition-all text-xs font-mono font-semibold cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                {/* GitHub OAuth */}
                <button
                  type="button"
                  onClick={() => handleOAuthLogin('GitHub')}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-200 hover:text-white transition-all text-xs font-mono font-semibold cursor-pointer"
                >
                  <Terminal className="w-4 h-4 text-slate-300" />
                  <span>Continue with GitHub</span>
                </button>
              </div>
            </div>

            {/* Bottom Security Architecture Badges */}
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-center gap-4 text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1 text-slate-300">
                <span>🔒</span> JWT Auth
              </span>
              <span className="flex items-center gap-1 text-slate-300">
                <span>🛡️</span> Stage 0 RBAC
              </span>
              <span className="flex items-center gap-1 text-slate-300">
                <span>⚡</span> Real-time SSE
              </span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
