import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { Bell, CheckCircle2, Download, Fingerprint, LogOut, Moon, Sparkles, SunMedium, Users, X } from 'lucide-react';

const STORAGE_KEYS = {
  students: 'teamforge_students_v1',
  currentUser: 'teamforge_current_user_v1',
  theme: 'teamforge_theme_v1',
  notifications: 'teamforge_notifications_v1',
};

const defaultAvatar = '/logo.svg';
const API_BASE = import.meta.env.DEV ? 'http://localhost:5000' : '';

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function safeName(name) {
  return (name || 'Student').trim() || 'Student';
}

function asciiAvatar(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(safeName(name))}&background=0f172a&color=f8fafc&size=220`;
}

function buildStudent(input = {}) {
  const name = safeName(input.name);
  return {
    id: input.id || crypto.randomUUID(),
    name,
    email: String(input.email || '').toLowerCase(),
    password: input.password || 'teamforge123',
    department: input.department || 'CSE',
    year: input.year || 'II Year',
    skills: Array.isArray(input.skills) ? input.skills : String(input.skills || '').split(',').map((s) => s.trim()).filter(Boolean),
    interests: Array.isArray(input.interests) ? input.interests : String(input.interests || '').split(',').map((s) => s.trim()).filter(Boolean),
    performance: Number(input.performance || 0),
    projects: Array.isArray(input.projects) ? input.projects : String(input.projects || '').split(',').map((s) => s.trim()).filter(Boolean),
    bio: input.bio || 'Building solutions and collaborating with peers.',
    avatar: input.avatar || asciiAvatar(name),
    requests: Array.isArray(input.requests) ? input.requests : [],
    teamMembers: Array.isArray(input.teamMembers) ? input.teamMembers : [],
    biometricEnabled: Boolean(input.biometricEnabled),
  };
}

function scoreMatch(student, currentUser) {
  if (!student || !currentUser || student.id === currentUser.id) return 0;
  const sharedSkills = student.skills.filter((skill) => currentUser.skills.includes(skill)).length;
  const departmentBonus = student.department === currentUser.department ? 15 : 0;
  const interestBonus = student.interests.filter((interest) => currentUser.interests.includes(interest)).length * 10;
  const performanceGap = Math.max(0, 100 - Math.abs(student.performance - currentUser.performance));
  return Math.min(100, sharedSkills * 18 + departmentBonus + interestBonus + performanceGap * 0.4);
}

function App() {
  const [students, setStudents] = useState(() => readJson(STORAGE_KEYS.students, []));
  const [currentUser, setCurrentUser] = useState(() => readJson(STORAGE_KEYS.currentUser, null));
  const [theme, setTheme] = useState(() => readJson(STORAGE_KEYS.theme, 'light'));
  const [notifications, setNotifications] = useState(() => readJson(STORAGE_KEYS.notifications, []));
  const [installEvent, setInstallEvent] = useState(null);

  useEffect(() => {
    writeJson(STORAGE_KEYS.students, students);
  }, [students]);

  useEffect(() => {
    if (currentUser) writeJson(STORAGE_KEYS.currentUser, currentUser);
    else localStorage.removeItem(STORAGE_KEYS.currentUser);
  }, [currentUser]);

  useEffect(() => {
    const root = document.body;
    root.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
    writeJson(STORAGE_KEYS.theme, theme);
  }, [theme]);

  useEffect(() => {
    writeJson(STORAGE_KEYS.notifications, notifications);
  }, [notifications]);

  useEffect(() => {
    const onBeforeInstall = (event) => {
      event.preventDefault();
      setInstallEvent(event);
      window.deferredPrompt = event;
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  const totalRegisteredStudents = students.length;

  const addNotification = (studentId, title, message, targetPath = '/', type = 'info') => {
    const next = {
      id: crypto.randomUUID(),
      studentId,
      title,
      message,
      targetPath,
      type,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [next, ...prev]);
  };

  const onRegister = (studentData) => {
    const student = buildStudent(studentData);
    setStudents((prev) => [...prev, student]);
    setCurrentUser(student);
  };

  return (
    <BrowserRouter>
      <AppLayout
        currentUser={currentUser}
        students={students}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        notifications={notifications}
        totalRegisteredStudents={totalRegisteredStudents}
        installEvent={installEvent}
        setCurrentUser={setCurrentUser}
        setStudents={setStudents}
        addNotification={addNotification}
        onRegister={onRegister}
        onLogout={() => setCurrentUser(null)}
      />
    </BrowserRouter>
  );
}

function AppLayout({
  currentUser,
  students,
  theme,
  onToggleTheme,
  notifications,
  totalRegisteredStudents,
  installEvent,
  setCurrentUser,
  setStudents,
  addNotification,
  onRegister,
  onLogout,
}) {
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const installApp = async () => {
    const prompt = installEvent || window.deferredPrompt;
    if (!prompt) return;
    prompt.prompt();
    await prompt.userChoice;
    window.deferredPrompt = null;
  };

  return (
    <div className="app-shell">
      {currentUser && (
        <header className="navbar">
          <Link to="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="logo-wrap">
              <img src="/logo.svg" alt="TeamForge" className="logo-image" />
              <span>TeamForge</span>
            </div>
          </Link>

          <div className="nav-actions">
            <button className="install-button" onClick={installApp} title="Install app" aria-label="Install app">
              <Download size={18} />
            </button>
            <button className="theme-button" onClick={onToggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <SunMedium size={18} /> : <Moon size={18} />}
            </button>
            <div style={{ position: 'relative' }}>
              <button className="icon-button" onClick={() => setShowNotifications((prev) => !prev)} aria-label="Notifications">
                <Bell size={18} />
              </button>
              {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
            </div>
            <button className="button button-secondary" onClick={onLogout}>Logout</button>
          </div>
        </header>
      )}

      {showNotifications && currentUser && (
        <div className="notification-panel">
          <div className="spread" style={{ padding: 12 }}>
            <h4 style={{ margin: 0 }}>Notifications</h4>
            <button className="button button-secondary" onClick={() => setShowNotifications(false)}><X size={14} /></button>
          </div>
          {notifications.length === 0 ? (
            <div style={{ padding: '0 16px 16px', color: '#cbd5e1' }}>No notifications yet.</div>
          ) : (
            notifications.map((notification) => (
              <div className="notification-item" key={notification.id} onClick={() => { setShowNotifications(false); if (notification.targetPath) window.location.hash = notification.targetPath; }}>
                <strong>{notification.title}</strong>
                <div>{notification.message}</div>
                <small>{new Date(notification.createdAt).toLocaleString()}</small>
              </div>
            ))
          )}
        </div>
      )}

      <Routes>
        <Route path="/" element={<GuidancePage />} />
        <Route path="/login" element={<LoginPage onRegister={onRegister} setCurrentUser={setCurrentUser} />} />
        <Route
          path="/dashboard"
          element={
            currentUser ? (
              <DashboardPage
                currentUser={currentUser}
                students={students}
                notifications={notifications}
                totalRegisteredStudents={totalRegisteredStudents}
                setCurrentUser={setCurrentUser}
                setStudents={setStudents}
                addNotification={addNotification}
                onToggleTheme={onToggleTheme}
                installEvent={installEvent}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/profile"
          element={
            currentUser ? (
              <ProfilePage currentUser={currentUser} students={students} setCurrentUser={setCurrentUser} setStudents={setStudents} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/student/:studentId"
          element={
            currentUser ? (
              <StudentProfile currentUser={currentUser} students={students} setCurrentUser={setCurrentUser} setStudents={setStudents} addNotification={addNotification} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </div>
  );
}

function GuidancePage() {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <div className="hero">
        <div>
          <div className="row" style={{ marginBottom: 20 }}>
            <img src="/logo.svg" alt="TeamForge" className="logo-image" style={{ width: 68, height: 68 }} />
            <div style={{ fontSize: 30, fontWeight: 900 }}>TeamForge</div>
          </div>
          <h1 className="hero-title">Build your team with confidence.</h1>
          <p className="hero-subtitle">A private space for Sairam students to connect, collaborate, match skills, and work together on project ideas.</p>
          <ul className="feature-list">
            <li><CheckCircle2 size={18} color="#10b981" /> Sign up with your college email only.</li>
            <li><CheckCircle2 size={18} color="#10b981" /> Verify your account with a one-time email OTP.</li>
            <li><CheckCircle2 size={18} color="#10b981" /> Discover teammates, send requests, and build projects together.</li>
          </ul>
          <div className="row" style={{ marginTop: 24 }}>
            <button className="button button-primary" onClick={() => navigate('/login')}>Login</button>
          </div>
        </div>

        <div className="card glass" style={{ padding: 24 }}>
          <h3 style={{ marginTop: 0 }}>How it works</h3>
          <div className="grid" style={{ gap: 12 }}>
            <div className="notice">1. Create your profile with your college email.</div>
            <div className="notice">2. Receive a real OTP in your inbox and verify your account.</div>
            <div className="notice">3. Update your skills, projects, and profile picture.</div>
            <div className="notice">4. Explore students, match with teammates, and collaborate.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginPage({ onRegister, setCurrentUser }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState('signup');
  const [form, setForm] = useState({
    name: '', email: '', password: '', department: 'CSE', year: 'II Year', performance: '85', skills: 'React, Node', interests: 'AI, Web', projects: 'TeamForge App',
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const sendOtp = async () => {
    if (!form.email || !form.email.endsWith('@sairamtap.edu.in')) {
      setError('Only @sairamtap.edu.in emails are allowed.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/api/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim().toLowerCase() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'OTP request failed.');
      setOtpSent(true);
    } catch (err) {
      setError(err.message || 'Could not send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndCreate = async () => {
    if (!otp || otp.length !== 6) {
      setError('Enter the 6-digit OTP sent to your email.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const verificationResponse = await fetch(`${API_BASE}/api/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim().toLowerCase(), code: otp }),
      });
      const verificationData = await verificationResponse.json();
      if (!verificationResponse.ok) throw new Error(verificationData.message || 'OTP verification failed.');

      const students = readJson(STORAGE_KEYS.students, []);
      if (students.some((student) => student.email === form.email.trim().toLowerCase())) {
        throw new Error('An account with this email already exists. Please log in.');
      }

      const newStudent = buildStudent({
        id: crypto.randomUUID(),
        name: form.name,
        email: form.email.trim().toLowerCase(),
        password: form.password || 'teamforge123',
        department: form.department,
        year: form.year,
        skills: form.skills.split(',').map((v) => v.trim()).filter(Boolean),
        interests: form.interests.split(',').map((v) => v.trim()).filter(Boolean),
        performance: Number(form.performance || 0),
        projects: form.projects.split(',').map((v) => v.trim()).filter(Boolean),
        bio: 'Fresh TeamForge student ready to collaborate.',
        avatar: asciiAvatar(form.name),
      });

      onRegister(newStudent);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const loginUser = () => {
    const students = readJson(STORAGE_KEYS.students, []);
    const match = students.find((student) => student.email === form.email.trim().toLowerCase() && student.password === form.password);
    if (!match) {
      setError('Invalid email or password.');
      return;
    }
    setCurrentUser(match);
    navigate('/dashboard');
  };

  return (
    <div className="page-container">
      <div className="card glass auth-card">
        <div className="row" style={{ justifyContent: 'center', marginBottom: 24 }}>
          <img src="/logo.svg" alt="TeamForge" className="logo-image" style={{ width: 62, height: 62 }} />
          <div>
            <h2 style={{ margin: 0 }}>TeamForge</h2>
            <p className="muted" style={{ margin: 0 }}>Private student collaboration platform</p>
          </div>
        </div>

        <div className="row" style={{ justifyContent: 'center', marginBottom: 18 }}>
          <button className={`button ${mode === 'login' ? 'button-primary' : 'button-secondary'}`} onClick={() => setMode('login')}>Login</button>
          <button className={`button ${mode === 'signup' ? 'button-primary' : 'button-secondary'}`} onClick={() => setMode('signup')}>Sign Up</button>
        </div>

        {error && <div className="notice" style={{ marginBottom: 16 }}>{error}</div>}

        {mode === 'login' ? (
          <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
            <input className="input" name="email" value={form.email} onChange={updateField} placeholder="College Email" />
            <input className="input" type="password" name="password" value={form.password} onChange={updateField} placeholder="Password" />
            <button className="button button-primary" onClick={loginUser}>Login</button>
          </div>
        ) : (
          <div>
            <div className="form-grid">
              <input className="input" name="name" value={form.name} onChange={updateField} placeholder="Full Name" />
              <input className="input" name="email" value={form.email} onChange={updateField} placeholder="College Email (@sairamtap.edu.in)" />
              <input className="input" type="password" name="password" value={form.password} onChange={updateField} placeholder="Password" />
              <select className="input" name="department" value={form.department} onChange={updateField}>
                <option value="CSE">CSE</option>
                <option value="IT">IT</option>
                <option value="ECE">ECE</option>
                <option value="EEE">EEE</option>
                <option value="MECH">MECH</option>
                <option value="AI">AI & DS</option>
              </select>
              <select className="input" name="year" value={form.year} onChange={updateField}>
                <option value="I Year">I Year</option>
                <option value="II Year">II Year</option>
                <option value="III Year">III Year</option>
                <option value="IV Year">IV Year</option>
              </select>
              <input className="input" name="performance" value={form.performance} onChange={updateField} placeholder="Performance Score" />
              <input className="input" name="skills" value={form.skills} onChange={updateField} placeholder="Skills" />
              <input className="input" name="interests" value={form.interests} onChange={updateField} placeholder="Interests" />
              <input className="input" name="projects" value={form.projects} onChange={updateField} placeholder="Projects" />
            </div>

            {!otpSent ? (
              <button className="button button-primary" style={{ width: '100%', marginTop: 18 }} onClick={sendOtp} disabled={loading}>
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            ) : (
              <div style={{ marginTop: 18 }}>
                <input className="input" value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="Enter 6-digit OTP" />
                <div className="row" style={{ marginTop: 14, justifyContent: 'space-between' }}>
                  <button className="button button-secondary" onClick={sendOtp}>Resend</button>
                  <button className="button button-primary" onClick={verifyAndCreate} disabled={loading}>{loading ? 'Verifying...' : 'Verify & Register'}</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardPage({ currentUser, students, notifications, totalRegisteredStudents, setCurrentUser, setStudents, addNotification, onToggleTheme }) {
  const navigate = useNavigate();
  const matches = useMemo(() => {
    return students
      .filter((student) => student.id !== currentUser.id)
      .map((student) => ({ ...student, score: scoreMatch(student, currentUser) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }, [students, currentUser]);

  const acceptRequest = (requestId) => {
    const updated = students.map((student) => {
      if (student.id !== currentUser.id) return student;
      return {
        ...student,
        requests: (student.requests || []).map((request) => request.id === requestId ? { ...request, status: 'accepted' } : request),
      };
    });
    setStudents(updated);
    setCurrentUser((prev) => ({ ...prev, requests: (prev.requests || []).map((request) => request.id === requestId ? { ...request, status: 'accepted' } : request) }));
    addNotification(currentUser.id, 'Collaboration request accepted', 'Your connection was accepted successfully.', '/profile', 'success');
  };

  const rejectRequest = (requestId) => {
    const updated = students.map((student) => {
      if (student.id !== currentUser.id) return student;
      return {
        ...student,
        requests: (student.requests || []).map((request) => request.id === requestId ? { ...request, status: 'rejected' } : request),
      };
    });
    setStudents(updated);
    addNotification(currentUser.id, 'Collaboration request rejected', 'The request was rejected.', '/profile', 'warning');
  };

  return (
    <div className="page-container">
      <div className="spread" style={{ marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0 }}>Dashboard</h2>
          <p className="muted" style={{ margin: '8px 0 0' }}>Welcome back, {currentUser.name}</p>
        </div>
        <div className="row">
          <button className="button button-secondary" onClick={onToggleTheme}>Theme</button>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="row" style={{ marginBottom: 8 }}><Users size={18} color="#f59e0b" /> <strong>Total Students</strong></div>
          <h3 style={{ margin: 0 }}>Total Students Registered: {totalRegisteredStudents}</h3>
        </div>

        <div className="card">
          <div className="row" style={{ marginBottom: 8 }}><Fingerprint size={18} color="#3b82f6" /> <strong>Biometric Login</strong></div>
          <button className="button button-secondary" onClick={() => {
            const enabled = !currentUser.biometricEnabled;
            setCurrentUser((prev) => ({ ...prev, biometricEnabled: enabled }));
            alert(enabled ? 'Biometric login enabled.' : 'Biometric login disabled.');
          }}>
            {currentUser.biometricEnabled ? 'Disable Face ID / Fingerprint' : 'Enable Face ID / Fingerprint'}
          </button>
        </div>

        <div className="card">
          <div className="row" style={{ marginBottom: 8 }}><Sparkles size={18} color="#10b981" /> <strong>AI Matching</strong></div>
          <div className="muted">Your skill match score updates automatically.</div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="spread">
            <h3 style={{ margin: 0 }}>AI Matching</h3>
            <Sparkles color="#f59e0b" />
          </div>
          {matches.length === 0 ? <div className="empty-box">No matches available yet.</div> : matches.map((student) => (
            <div key={student.id} className="row" style={{ justifyContent: 'space-between', borderBottom: '1px solid rgba(148,163,184,0.2)', padding: '12px 0' }}>
              <div className="row">
                <img src={student.avatar || defaultAvatar} alt={student.name} className="avatar" />
                <div>
                  <strong>{student.name}</strong>
                  <div className="muted">{student.department} • {student.skills.slice(0, 2).join(', ')}</div>
                </div>
              </div>
              <span className="tag">{Math.round(student.score)}% match</span>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="spread">
            <h3 style={{ margin: 0 }}>Requests</h3>
            <Bell color="#3b82f6" />
          </div>
          {currentUser.requests && currentUser.requests.length ? currentUser.requests.map((request) => (
            <div key={request.id} style={{ border: '1px solid rgba(148,163,184,0.2)', borderRadius: 12, padding: 12, marginBottom: 12 }}>
              <div className="spread">
                <strong>{request.fromName}</strong>
                <span className="tag">{request.status}</span>
              </div>
              <div className="row" style={{ marginTop: 12 }}>
                <button className="button button-success" onClick={() => acceptRequest(request.id)}>Accept</button>
                <button className="button button-danger" onClick={() => rejectRequest(request.id)}>Reject</button>
              </div>
            </div>
          )) : <div className="empty-box">No incoming collaboration requests.</div>}
        </div>
      </div>

      <div className="spread" style={{ marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Student Directory</h3>
        <div className="row">
          <button className="button button-secondary" onClick={() => navigate('/profile')}>My Profile</button>
        </div>
      </div>

      <div className="grid grid-3">
        {students.map((student) => (
          <div className="student-card" key={student.id}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div className="row">
                <img src={student.avatar || defaultAvatar} alt={student.name} className="avatar" />
                <div>
                  <strong>{student.name}</strong>
                  <div className="muted">{student.department} • {student.year}</div>
                </div>
              </div>
              <span className="tag">{student.performance}%</span>
            </div>
            <div className="row">
              {student.skills.slice(0, 3).map((skill) => <span className="tag" key={skill}>{skill}</span>)}
            </div>
            <div className="muted">{student.bio}</div>
            <button className="button button-primary" onClick={() => navigate(`/student/${student.id}`)}>View Profile</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfilePage({ currentUser, students, setCurrentUser, setStudents }) {
  const [form, setForm] = useState({
    name: currentUser.name,
    department: currentUser.department,
    year: currentUser.year,
    skills: (currentUser.skills || []).join(', '),
    performance: currentUser.performance,
    projects: (currentUser.projects || []).join(', '),
    bio: currentUser.bio || '',
    interests: (currentUser.interests || []).join(', '),
  });
  const [avatarPreview, setAvatarPreview] = useState(currentUser.avatar || defaultAvatar);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatar = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const save = () => {
    const updated = {
      ...currentUser,
      name: form.name,
      department: form.department,
      year: form.year,
      skills: form.skills.split(',').map((v) => v.trim()).filter(Boolean),
      performance: Number(form.performance || 0),
      projects: form.projects.split(',').map((v) => v.trim()).filter(Boolean),
      interests: form.interests.split(',').map((v) => v.trim()).filter(Boolean),
      bio: form.bio,
      avatar: avatarPreview || defaultAvatar,
    };
    const nextStudents = students.map((student) => student.id === currentUser.id ? updated : student);
    setStudents(nextStudents);
    setCurrentUser(updated);
    alert('Profile updated successfully.');
  };

  return (
    <div className="page-container">
      <div className="card glass" style={{ maxWidth: 900, margin: '18px auto 0', padding: 24 }}>
        <div className="spread" style={{ marginBottom: 24 }}>
          <div>
            <h2 style={{ margin: 0 }}>Edit Profile</h2>
            <p className="muted" style={{ margin: '6px 0 0' }}>Update your details and profile picture.</p>
          </div>
          <img src={avatarPreview} alt={currentUser.name} className="avatar-lg" />
        </div>

        <div className="form-grid">
          <input className="input" name="name" value={form.name} onChange={updateField} placeholder="Full Name" />
          <input className="input" name="department" value={form.department} onChange={updateField} placeholder="Department" />
          <input className="input" name="year" value={form.year} onChange={updateField} placeholder="Year" />
          <input className="input" name="performance" value={form.performance} onChange={updateField} placeholder="Performance Score" />
          <input className="input" name="skills" value={form.skills} onChange={updateField} placeholder="Skills" />
          <input className="input" name="interests" value={form.interests} onChange={updateField} placeholder="Interests" />
          <input className="input" name="projects" value={form.projects} onChange={updateField} placeholder="Projects" />
          <div style={{ gridColumn: '1 / -1' }}>
            <textarea className="input" rows="4" name="bio" value={form.bio} onChange={updateField} placeholder="Short bio" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <input type="file" accept="image/*" onChange={handleAvatar} className="input" />
          </div>
        </div>

        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="button button-primary" onClick={save}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

function StudentProfile({ currentUser, students, setCurrentUser, setStudents, addNotification }) {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const targetStudent = students.find((student) => student.id === studentId);
  if (!targetStudent) return <Navigate to="/dashboard" replace />;

  const alreadyRequested = (currentUser.requests || []).some((request) => request.toId === targetStudent.id);

  const sendRequest = () => {
    const request = {
      id: crypto.randomUUID(),
      fromId: currentUser.id,
      toId: targetStudent.id,
      fromName: currentUser.name,
      status: 'pending',
    };

    const updatedStudents = students.map((student) => {
      if (student.id === currentUser.id) {
        return { ...student, requests: [...(student.requests || []), request] };
      }
      if (student.id === targetStudent.id) {
        return { ...student, requests: [...(student.requests || []), { ...request, fromName: currentUser.name }] };
      }
      return student;
    });

    setStudents(updatedStudents);
    setCurrentUser((prev) => ({ ...prev, requests: [...(prev.requests || []), request] }));
    addNotification(targetStudent.id, 'New collaboration request', `${currentUser.name} sent you a collaboration request.`, '/dashboard', 'info');
    navigate('/dashboard');
  };

  const callEnabled = (currentUser.teamMembers || []).includes(targetStudent.id) && (targetStudent.teamMembers || []).includes(currentUser.id);

  return (
    <div className="page-container">
      <div className="card glass" style={{ maxWidth: 920, margin: '18px auto 0', padding: 24 }}>
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 24 }}>
          <div className="row">
            <img src={targetStudent.avatar || defaultAvatar} alt={targetStudent.name} className="avatar-lg" />
            <div>
              <h2 style={{ margin: 0 }}>{targetStudent.name}</h2>
              <div className="muted">{targetStudent.department} • {targetStudent.year}</div>
            </div>
          </div>
          {targetStudent.id !== currentUser.id && (
            <button className="button button-primary" onClick={sendRequest} disabled={alreadyRequested}>
              {alreadyRequested ? 'Request Sent' : 'Send Collaboration Request'}
            </button>
          )}
        </div>

        <div className="grid grid-3">
          <div className="card">
            <h4>Skills</h4>
            <div className="row">{(targetStudent.skills || []).map((skill) => <span className="tag" key={skill}>{skill}</span>)}</div>
          </div>
          <div className="card">
            <h4>Interests</h4>
            <div className="row">{(targetStudent.interests || []).map((interest) => <span className="tag" key={interest}>{interest}</span>)}</div>
          </div>
          <div className="card">
            <h4>Projects</h4>
            <div className="row">{(targetStudent.projects || []).map((project) => <span className="tag" key={project}>{project}</span>)}</div>
          </div>
        </div>

        <div className="card" style={{ marginTop: 18 }}>
          <h4>About</h4>
          <p className="muted">{targetStudent.bio}</p>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="tag">Performance: {targetStudent.performance}%</span>
            <button className="button button-secondary" onClick={() => alert('Conference call feature is available for accepted team members.')}>
              Conference Call
            </button>
            <button className="button button-primary" onClick={() => alert(callEnabled ? 'Call started.' : 'Call becomes available after both students accept the request.')} disabled={!callEnabled}>
              Call
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

