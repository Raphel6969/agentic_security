import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

function parseJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for token in URL (post-OAuth redirect)
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      localStorage.setItem('sentinel_token', urlToken);
      localStorage.setItem('sentinel_jwt', urlToken);
      // Clean URL without reload
      window.history.replaceState({}, '', '/');
    }

    const token = localStorage.getItem('sentinel_token') || localStorage.getItem('sentinel_jwt');
    if (token) {
      const payload = parseJwt(token);
      if (payload && payload.exp * 1000 > Date.now()) {
        setUser({ token, ...payload });
      } else {
        localStorage.removeItem('sentinel_token');
        localStorage.removeItem('sentinel_jwt');
      }
    }
    setLoading(false);
  }, []);

  const login = (token) => {
    localStorage.setItem('sentinel_token', token);
    localStorage.setItem('sentinel_jwt', token);
    const payload = parseJwt(token);
    setUser({ token, ...payload });
  };

  const logout = () => {
    localStorage.removeItem('sentinel_token');
    localStorage.removeItem('sentinel_jwt');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
