import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user session is saved in localStorage
    const savedUser = localStorage.getItem('medivision_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Error parsing stored user:', e);
        localStorage.removeItem('medivision_user');
      }
    }
    setLoading(false);
  }, []);

  // Standard Email/Password Login
  const login = async (email, password) => {
    // Simulate auth API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!email || !password) {
          reject(new Error('Please provide both email and password.'));
          return;
        }

        // Demo user or dynamic login
        const loggedUser = {
          id: 'usr_' + Math.random().toString(36).substring(2, 9),
          name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          email: email,
          role: 'Healthcare Professional',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          provider: 'email',
          createdAt: new Date().toISOString()
        };

        setUser(loggedUser);
        localStorage.setItem('medivision_user', JSON.stringify(loggedUser));
        resolve(loggedUser);
      }, 700);
    });
  };

  // User Registration
  const register = async (name, email, password, role = 'Physician / Radiologist') => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!name || !email || !password) {
          reject(new Error('Please fill in all required fields.'));
          return;
        }

        const newUser = {
          id: 'usr_' + Math.random().toString(36).substring(2, 9),
          name: name,
          email: email,
          role: role,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
          provider: 'email',
          createdAt: new Date().toISOString()
        };

        setUser(newUser);
        localStorage.setItem('medivision_user', JSON.stringify(newUser));
        resolve(newUser);
      }, 800);
    });
  };

  // Google OAuth / Google One-Tap Login
  const loginWithGoogle = async (googleUserObj = null) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const googleUser = googleUserObj || {
          id: 'goog_' + Math.random().toString(36).substring(2, 9),
          name: 'Dr. Alex Vance',
          email: 'alex.vance@medivision.ai',
          role: 'Clinical Radiologist',
          avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
          provider: 'google',
          createdAt: new Date().toISOString()
        };

        setUser(googleUser);
        localStorage.setItem('medivision_user', JSON.stringify(googleUser));
        resolve(googleUser);
      }, 600);
    });
  };

  // Logout
  const logout = () => {
    setUser(null);
    localStorage.removeItem('medivision_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
