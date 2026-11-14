import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  Moon,
  Sun,
  Home,
  UploadCloud,
  Shield,
  Stethoscope,
  Mail,
  ChevronDown,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

/* tiny hook to drive theme toggle */
function useDarkMode() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle('dark', next);
    document.documentElement.classList.toggle('black', false);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    setDark(next);
  };
  return [dark, toggle];
}

const Header = () => {
  const { user, logout } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dark, toggleDark] = useDarkMode();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setProfileMenuOpen(false);
    navigate('/');
  };

  const diagnosticTarget = user ? '/upload' : '/login';
  const diagnosticState = user ? undefined : { from: '/upload', reason: 'diagnostic_required' };

  const navLinks = [
    { name: 'Home', path: '/', target: '/', icon: Home },
    { name: 'Diagnosis', path: '/upload', target: diagnosticTarget, state: diagnosticState, icon: UploadCloud },
    { name: 'Insurance', path: '/insurance', target: user ? '/insurance' : '/login', state: user ? undefined : { from: '/insurance', reason: 'insurance_required' }, icon: Shield },
    { name: 'Doctors', path: '/search-doctor', target: '/search-doctor', icon: Stethoscope },
    { name: 'Contact', path: '/contact', target: '/contact', icon: Mail },
  ];

  const isLanding = (location.pathname === '/' || location.pathname === '/home') && !!user;

  return (
    <header
      className="sticky top-0 z-50 transition-colors duration-200"
      style={isLanding ? { background: 'rgba(8,9,15,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.07)' } : undefined}
      data-non-landing={!isLanding || undefined}
    >
      {/* Fallback background for non-landing pages */}
      {!isLanding && (
        <style>{`header[data-non-landing] { background: hsl(var(--background) / 0.9); backdrop-filter: blur(12px); border-bottom: 1px solid hsl(var(--border)); }`}</style>
      )}

      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">

        {/* ── Logo (matching 0.png) ── */}
        <Link to="/" className="flex items-center gap-2.5">
          <Activity className="h-6 w-6 text-blue-500 shrink-0" />
          <span className="text-lg font-bold tracking-tight text-white">
            MediVision AI
          </span>
        </Link>

        {/* ── Desktop Nav (hidden on landing for minimalism, shown on inner pages) ── */}
        {!isLanding && (
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.target}
                  state={item.state}
                  aria-current={isActive ? 'page' : undefined}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Landing page: show nav links in center too */}
        {isLanding && (
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.target}
                  state={item.state}
                  aria-current={isActive ? 'page' : undefined}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-white/15 text-white'
                      : 'text-white/60 hover:bg-white/8 hover:text-white'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        )}

        {/* ── Right side actions ── */}
        <div className="flex items-center gap-2">

          {/* Dark-mode toggle (matching 0.png rounded-lg button) */}
          <button
            type="button"
            onClick={toggleDark}
            aria-label="Toggle dark mode"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-[#0d1320] text-slate-300 hover:text-white hover:border-slate-700 transition"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Start Diagnosis — dark outlined button (matching 0.png) */}
          <Link
            to={diagnosticTarget}
            state={diagnosticState}
            className="hidden sm:inline-flex items-center justify-center rounded-lg border border-slate-800 bg-[#0d1320] px-4 py-2 text-sm font-semibold text-white hover:border-slate-700 transition"
          >
            Start Diagnosis
          </Link>

          {/* Upload Image — blue filled button (matching 0.png) */}
          <Link
            to={diagnosticTarget}
            state={diagnosticState}
            className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-[#2563eb] hover:bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition"
          >
            Upload Image
          </Link>

          {/* User avatar dropdown (if logged in) */}
          {user && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                className={`flex items-center gap-2 rounded-full border px-2 py-1.5 text-sm font-medium transition ${
                  isLanding
                    ? 'border-white/12 bg-white/6 text-white hover:bg-white/12'
                    : 'border-border bg-card text-foreground hover:bg-muted'
                }`}
              >
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                  alt={user.name}
                  className="h-7 w-7 rounded-full object-cover"
                />
                <span className="hidden md:inline">{user.name.split(' ')[0]}</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-50" />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-border bg-popover p-2 shadow-xl">
                  <div className="border-b border-border px-2 pb-2 text-sm">
                    <p className="font-semibold text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="mt-2 space-y-1">
                    <Link to="/" className="block rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Home</Link>
                    <Link to="/upload" className="block rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">New Diagnosis</Link>
                    <Link to="/insurance" className="block rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Insurance</Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-red-500 hover:bg-red-500/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile menu button */}
          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((o) => !o)}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition md:hidden ${
              isLanding
                ? 'border-white/12 bg-white/6 text-white/70 hover:bg-white/12 hover:text-white'
                : 'border-border bg-card text-foreground hover:bg-muted'
            }`}
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      {mobileMenuOpen && (
        <nav
          className="border-t md:hidden"
          style={isLanding ? { background: 'rgba(8,9,15,0.97)', borderColor: 'rgba(255,255,255,0.08)' } : undefined}
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-3">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.target}
                  state={item.state}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    isActive
                      ? isLanding ? 'bg-white/12 text-white' : 'bg-primary/10 text-primary'
                      : isLanding ? 'text-white/60 hover:bg-white/8 hover:text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
            <Link
              to={diagnosticTarget}
              state={diagnosticState}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#6d28d9)' }}
            >
              Upload Image
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;
