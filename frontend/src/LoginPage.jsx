import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Button } from './components/ui/button';
import { 
  Activity, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Brain,
  Stethoscope,
  Home
} from 'lucide-react';

const GoogleIcon = () => (
  <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

const LoginPage = () => {
  const { user, login, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSignUp, setIsSignUp] = useState(location.pathname === '/signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Doctor / Radiologist');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // Sync tab with route if user navigates between /login and /signup
  useEffect(() => {
    if (location.pathname === '/signup') {
      setIsSignUp(true);
    } else if (location.pathname === '/login') {
      setIsSignUp(false);
    }
  }, [location.pathname]);

  // If already logged in and visiting auth page, redirect to home
  useEffect(() => {
    if (user && (location.pathname === '/login' || location.pathname === '/signup')) {
      navigate('/', { replace: true });
    }
  }, [user, location.pathname, navigate]);

  // Always take user to the home page first after sign in / login
  const redirectPath = '/';

  // Handle standard login / register submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (!name.trim()) throw new Error('Please enter your full name.');
        if (!email.trim()) throw new Error('Please enter your email address.');
        if (password.length < 6) throw new Error('Password must be at least 6 characters.');
        
        await register(name, email, password, role);
        setSuccessMsg('Account created successfully! Redirecting...');
      } else {
        if (!email.trim() || !password) throw new Error('Please enter both email and password.');
        await login(email, password);
        setSuccessMsg('Signed in successfully! Redirecting...');
      }

      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 700);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      setSuccessMsg('Signed in with Google! Redirecting...');
      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 700);
    } catch {
      setError('Google Sign-In was cancelled or failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Quick Demo Account Login helper
  const handleDemoLogin = (demoRole) => {
    const demoAccounts = {
      doctor: { email: 'dr.sarah.patel@hospital.org', name: 'Dr. Sarah Patel', role: 'DOCTOR' },
      patient: { email: 'john.miller@patient.medivision.ai', name: 'John Miller', role: 'PATIENT' },
      reviewer: { email: 'marcus.chen@insurance.medivision.ai', name: 'Marcus Chen', role: 'INSURANCE_REVIEWER' }
    };
    const acc = demoAccounts[demoRole] || demoAccounts.doctor;
    loginWithGoogle({
      id: 'demo_' + Math.random().toString(36).substring(2, 7),
      name: acc.name,
      email: acc.email,
      role: acc.role,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${acc.name}`,
      provider: 'demo',
      createdAt: new Date().toISOString()
    }).then(() => {
      setSuccessMsg(`Welcome, ${acc.name}! Redirecting...`);
      setTimeout(() => navigate(redirectPath, { replace: true }), 600);
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#060a14] text-white flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left Side: Medical AI Branding & Highlights (Visible on lg screens) */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between space-y-8 p-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Next-Gen Medical Diagnostic Suite</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
              Clinical Intelligence <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                Powered by AI
              </span>
            </h1>

            <p className="text-slate-400 text-sm mt-4 leading-relaxed">
              Experience instant, high-precision multimodal analysis for MRI, CT Scans, X-Rays, Bone Fractures, and Ultrasound images.
            </p>
          </div>

          {/* Key Feature Badges */}
          <div className="space-y-3.5">
            {[
              { icon: Brain, title: "Deep Neural Segmentation", desc: "Specialized models trained on 100K+ clinical scans" },
              { icon: ShieldCheck, title: "HIPAA Compliant & Secure", desc: "Encrypted image processing and confidential diagnostic reports" },
              { icon: Stethoscope, title: "Clinician Collaboration", desc: "Interactive AI consultation and doctor recommendation" }
            ].map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div key={i} className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#091122]/80 border border-slate-800/80 backdrop-blur-md">
                  <div className="p-2 rounded-xl bg-blue-600/15 border border-blue-500/30 text-blue-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{feat.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Demo Login Pill */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900/90 to-[#0c162d]/90 border border-slate-800">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              Quick One-Click Test Accounts:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('doctor')}
                className="py-1.5 px-2 rounded-lg text-[11px] font-semibold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 transition-colors truncate"
              >
                🩺 Doctor
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('patient')}
                className="py-1.5 px-2 rounded-lg text-[11px] font-semibold bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 transition-colors truncate"
              >
                👤 Patient
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('reviewer')}
                className="py-1.5 px-2 rounded-lg text-[11px] font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 transition-colors truncate"
              >
                🛡️ Reviewer
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form Card */}
        <div className="lg:col-span-7">
          <div className="bg-[#091122]/95 border border-slate-800/90 rounded-3xl p-7 sm:p-9 shadow-2xl backdrop-blur-xl relative">
            
            {/* Top Back to Home Button (only visible if logged in) */}
            {user && (
              <div className="flex items-center justify-between mb-4">
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-blue-400 transition-colors px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 shadow-sm"
                >
                  <Home className="h-3.5 w-3.5" />
                  <span>Back to Home</span>
                </Link>
              </div>
            )}

            {/* Header / Logo */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 p-2 rounded-2xl bg-blue-600/10 border border-blue-500/30 text-blue-400 mb-3 shadow-inner">
                <Activity className="h-7 w-7 text-blue-400 stroke-[2.5]" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {isSignUp ? 'Create your MediVision Account' : 'Welcome back to MediVision'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {isSignUp 
                  ? 'Join thousands of medical specialists & patients worldwide' 
                  : 'Sign in to access your clinical dashboard and scans'
                }
              </p>
            </div>

            {/* Diagnostic Permission Requirement Notice */}
            {(location.state?.reason === 'diagnostic_required' || location.state?.from?.includes('/upload')) && (
              <div className="mb-6 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-blue-500/10 to-indigo-500/10 border border-amber-500/30 flex items-start gap-3 shadow-sm animate-in fade-in duration-300">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 mt-0.5 shrink-0">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-amber-300">Permission Required to Start Diagnostics</p>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                    You need to be signed in to upload medical scans (X-Ray, CT, MRI, Ultrasound, Fractures) and run AI diagnostic reports.
                  </p>
                </div>
              </div>
            )}

            {/* Tab Switcher (Sign In / Sign Up) */}
            <div className="grid grid-cols-2 p-1 bg-[#060a14] rounded-xl border border-slate-800 mb-6">
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setError(''); }}
                className={`py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                  !isSignUp 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsSignUp(true); setError(''); }}
                className={`py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                  isSignUp 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error & Success Alerts */}
            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-950/70 border border-red-800/80 text-red-200 text-xs sm:text-sm flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800/80 text-emerald-200 text-xs sm:text-sm flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center py-3 px-4 rounded-xl border border-slate-700/80 bg-slate-900/90 hover:bg-slate-800/90 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:border-slate-600 active:scale-[0.99] disabled:opacity-50"
            >
              {googleLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Connecting to Google...</span>
                </div>
              ) : (
                <>
                  <GoogleIcon />
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* Or Divider */}
            <div className="relative my-6 flex items-center justify-center">
              <div className="border-t border-slate-800 w-full"></div>
              <span className="bg-[#091122] px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider relative">
                Or continue with email
              </span>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name (Sign Up only) */}
              {isSignUp && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Dr. Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={isSignUp}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#060a14] border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder-slate-600 text-sm outline-none transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    placeholder="doctor@hospital.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#060a14] border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder-slate-600 text-sm outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Password
                  </label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-xs font-semibold text-blue-400 hover:text-blue-300 hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#060a14] border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder-slate-600 text-sm outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Role Selection (Sign Up only) */}
              {isSignUp && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Account Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#060a14] border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white text-sm outline-none transition-colors"
                  >
                    <option value="Doctor / Radiologist">Physician / Radiologist</option>
                    <option value="Medical Researcher">Medical Researcher / Scientist</option>
                    <option value="Healthcare Provider">Clinic / Hospital Administrator</option>
                    <option value="Patient / Individual">Patient / Individual</option>
                  </select>
                </div>
              )}

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-[#060a14] text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                  />
                  <span className="text-xs text-slate-400">Keep me signed in</span>
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 transition-all duration-300 active:scale-[0.99] mt-2"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>{isSignUp ? 'Create Free Account' : 'Sign In to MediVision'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </form>

            {/* Footer switcher */}
            <div className="text-center mt-6 pt-4 border-t border-slate-800/80">
              <p className="text-xs text-slate-400">
                {isSignUp ? 'Already have an account?' : "Don't have an account yet?"}{' '}
                <button
                  type="button"
                  onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                  className="font-bold text-blue-400 hover:text-blue-300 hover:underline ml-1"
                >
                  {isSignUp ? 'Sign In' : 'Create an Account'}
                </button>
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#091122] border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <h3 className="text-xl font-bold text-white mb-2">Reset Password</h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter your account email and we'll send you a password reset verification link.
            </p>

            {forgotSubmitted ? (
              <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-xs">
                <p className="font-semibold">Reset instructions sent!</p>
                <p className="mt-1 text-slate-300">If an account exists for {forgotEmail}, you will receive a reset link shortly.</p>
                <Button 
                  onClick={() => { setShowForgotModal(false); setForgotSubmitted(false); }}
                  className="mt-4 w-full bg-slate-800 hover:bg-slate-700 text-white text-xs"
                >
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setForgotSubmitted(true); }}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#060a14] border border-slate-800 text-white text-sm outline-none focus:border-blue-500 mb-4"
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForgotModal(false)}
                    className="border-slate-700 bg-slate-800/80 text-slate-300 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs"
                  >
                    Send Reset Link
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default LoginPage;
