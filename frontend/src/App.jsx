import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Home } from './pages/Home.jsx';
import { Login } from './pages/Login.jsx';
import { Register } from './pages/Register.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { Editor } from './pages/Editor.jsx';
import { ShareView } from './pages/ShareView.jsx';

function App() {
  const [authenticated, setAuthenticated] = useState(() =>
    Boolean(localStorage.getItem('accessToken'))
  );
  const navigate = useNavigate();

  function handleAuthSuccess(tokens) {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    setAuthenticated(true);
    navigate('/dashboard');
  }

  function handleLogout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setAuthenticated(false);
    navigate('/login');
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login onAuthSuccess={handleAuthSuccess} />} />
      <Route path="/register" element={<Register onAuthSuccess={handleAuthSuccess} />} />
      <Route
        path="/dashboard"
        element={authenticated ? <Dashboard onLogout={handleLogout} /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/editor/:id"
        element={authenticated ? <Editor /> : <Navigate to="/login" replace />}
      />
      <Route path="/share/:token" element={<ShareView />} />
      <Route path="*" element={<Navigate to={authenticated ? '/dashboard' : '/'} replace />} />
    </Routes>
  );
}

export default App;
