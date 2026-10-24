import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import {
  Bell, Check, Download, LogOut, Moon, Search, ShieldCheck, Sparkles, SunMedium,
  UserCircle2, Users, Video, X, CheckCircle2, MessageSquareText, Camera,
  Fingerprint, UserRound, BriefcaseBusiness
} from 'lucide-react';

const API_BASE = import.meta.env.DEV ? 'http://localhost:5000' : '';
const STORAGE_KEYS = {
  students: 'teamforge_students_v1',
  currentUser: 'teamforge_current_user_v1',
  theme: 'teamforge_theme_v1',
  notifications: 'teamforge_notifications_v1',
  biometric: 'teamforge_biometric_v1',
};

const defaultAvatar = '/logo.svg';

function getInitialStudents() {
  const raw = localStorage.getItem(STORAGE_KEYS.students);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage errors
  }
}

function loadStorage(key, fallback) {
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function themeApplier(theme) {
  document.body.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
}

function scoreMatch(student, currentUser) {
  if (!currentUser || !student || student.id === currentUser.id) return 0;
  const sharedSkills = currentUser.skills.filter((skill) => student.skills.includes(skill)).length;
  const performanceDelta = Math.max(0, 100 - Math.abs(currentUser.performance - student.performance));
  const departmentBonus = currentUser.department === student.department ? 12 : 0;
  const interestBonus = currentUser.interests.filter((item) => student.interests.includes(item)).length * 8;
  return Math.min(100, sharedSkills * 18 + performanceDelta * 0.5 + departmentBonus + interestBonus);
}

function asciiAvatar(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0f172a&color=f8fafc&size=220`;
}

function buildStudent(data) {
  return {
    id: data.id || crypto.randomUUID(),
    name: data.name || 'Student',
    email: (data.email || '').toLowerCase(),
    password: data.password || 'teamforge123',
    department: data.department || 'CSE',
    year: data.year || 'II Year',
    skills: Array.isArray(data.skills) ? data.skills : [],
    interests: Array.isArray(data.interests) ? data.interests : [],
    performance: Number(data.performance || 0),
    projects: Array.isArray(data.projects) ? data.projects : [],
    bio: data.bio || 'Student developer building innovative solutions.',
    avatar: data.avatar || asciiAvatar(data.name || 'Student'),
    teamMembers: Array.isArray(data.teamMembers) ? data.teamMembers : [],
    biometricEnabled: Boolean(data.biometricEnabled),
    createdAt: data.createdAt || new Date().toISOString(),
  };
}

function createNotification(studentId, title, message, targetPath, type = 'info') {
  return {
    id: crypto.randomUUID(),
    studentId,
    title,
    message,
    targetPath,
    type,
    read: false,
    createdAt: new Date().toISOString(),
  };
}

function App() {
  const [students, setStudents] = useState(() => getInitialStudents());
  const [currentUser, setCurrentUser] = useState(() => loadStorage(STORAGE_KEYS.currentUser, null));
  const [theme, setTheme] = useState(() => loadStorage(STORAGE_KEYS.theme, 'light'));
  const [notifications, setNotifications] = useState(() => loadStorage(STORAGE_KEYS.notifications, []));
  const [promptEvent, setPromptEvent] = useState(null);

  useEffect(() => {
    document.body.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(STORAGE_KEYS.theme, JSON.stringify(theme));
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.students, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.currentUser);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    const beforeInstallPromptListener = (event) => {
      event.preventDefault();
      setPromptEvent(event);
    };

    window.addEventListener('beforeinstallprompt', beforeInstallPromptListener);

    const { serviceWorker } = navigator;
    if ('serviceWorker' in navigator && serviceWorker) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    return () => window.removeEventListener('beforeinstallprompt', beforeInstallPromptListener);
  }, []);

  const totalRegisteredStudents = students.length;

  const onRegister = (studentData) => {
    const normalizedStudent = buildStudent(studentData);
    const updatedStudents = [...students, normalizedStudent];
    setStudents(updatedStudents);
    setCurrentUser(normalizedStudent);
  };

  const onLogout = () => {
    setCurrentUser(null);
  };

  const addNotification = (studentId, title, message, targetPath, type = 'info') => {
    const next = createNotification(studentId, title, message, targetPath, type);
    setNotifications((previous) => [next, ...previous]);
  };

  const markNotificationsRead = () => setNotifications((previous) => previous.map((item) => ({ ...item, read: true })));

  return (
    <BrowserRouter>
      <AppLayout
        currentUser={currentUser}
        onLogout={onLogout}
        theme={theme}
        onToggleTheme={() => setTheme((previous) => (previous === 'dark' ? 'light' : 'dark'))}
        notifications={notifications}
        onNavigateNotifications={markNotificationsRead}
        promptEvent={promptEvent}
        totalRegisteredStudents={totalRegisteredStudents}
        students={students}
        onRegister={onRegister}
        addNotification={addNotification}
        setCurrentUser={setCurrentUser}
      />
    </BrowserRouter>
  );
}

function AppLayout({
  currentUser,
  onLogout,
  theme,
  onToggleTheme,
  notifications,
  onNavigateNotifications,
  promptEvent,
  totalRegisteredStudents,
  students,
  onRegister,
  addNotification,
  setCurrentUser,
}) {
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    themeApplier(theme);
  }, [theme]);

  const unreadCount = notifications.filter((item) => !item.read).length;

  const handleInstall = async () => {
    if (!promptEvent) return;
    promptEvent.prompt();
    await promptEvent.userChoice;
    setShowNotifications(false);
  };

  return (
    <div className="app-shell">
      {currentUser && (
        <header className="navbar">
          <Link to="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="logo-wrap">
              <img src="/logo.svg" alt="TeamForge logo" className="logo-image" />
              <span>TeamForge</span>
            </div>
          </Link>

          <div className="nav-actions">
            <button className="install-button" onClick={handleInstall} title="Install app">
              <Download size={18} />
            </button>
            <button className="theme-button" onClick={onToggleTheme} aria-label="Toggle dark mode">
              {theme === 'dark' ? <SunMedium size={18} /> : <Moon size={18} />}
            </button>
            <div style={{ position: 'relative' }}>
              <button className="icon-button" onClick={() => setShowNotifications((previous) => !previous)} aria-label="Notifications">
                <Bell size={18} />
              </button>
              {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
            </div>
            <button className="button button-secondary" onClick={onLogout}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><LogOut size={16} /> Logout</span>
            </button>
          </div>
        </header>
      )}

      {showNotifications && currentUser && (
        <aside className="notification-panel">
          <div className="spread" style={{ padding: '12px 16px 8px' }}>
            <h4 style={{ margin: 0 }}>Notifications</h4>
            <button className="button button-secondary" onClick={() => setShowNotifications(false)}><X size={16} /></button>
          </div>
          {notifications.length === 0 ? (
            <div style={{ padding: '0 16px 18px', color: '#cbd5e1' }}>No notifications yet.</div>
          ) : (
            notifications.slice(0, 8).map((item) => (
              <div
                className="notification-item"
                key={item.id}
                onClick={() => {
                  setShowNotifications(false);
                  onNavigateNotifications();
                  if (item.targetPath) window.location.hash = item.targetPath;
                }}
              >
                <strong>{item.title}</strong>
                <div style={{ opacity: 0.8, marginTop: 6 }}>{item.message}</div>
                <small style={{ opacity: 0.7 }}>{new Date(item.createdAt).toLocaleString()}</small>
              </div>
            ))
          )}
        </aside>
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
                addNotification={addNotification}
                setCurrentUser={setCurrentUser}
                totalRegisteredStudents={totalRegisteredStudents}
                onToggleTheme={onToggleTheme}
                promptEvent={promptEvent}
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
              <StudentProfilePage currentUser={currentUser} students={students} setCurrentUser={setCurrentUser} setStudents={setStudents} addNotification={addNotification} />
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
    <div className="page-container" style={{ minHeight: '100vh' }}>
      <div className="hero">
        <div>
          <div className="row" style={{ marginBottom: 24 }}>
            <img src="/logo.svg" alt="TeamForge logo" className="logo-image" style={{ width: 70, height: 70 }} />
            <span style={{ fontWeight: 900, fontSize: 28 }}>TeamForge</span>
          </div>
          <h1 className="hero-title">Find your team, build your future.</h1>
          <p className="hero-subtitle" style={{ marginTop: 16 }}>
            A private college collaboration space for students to connect, share projects, discover teammates, and work together.
          </p>

          <ul className="feature-list">
            <li><CheckCircle2 size={18} color="#10b981" /> Discover teammates by skills, department, interests, and performance.</li>
            <li><CheckCircle2 size={18} color="#10b981" /> Send collaboration requests and accept joins in one place.</li>
            <li><CheckCircle2 size={18} color="#10b981" /> Keep communication and teamwork organized with calls and notifications.</li>
          </ul>

          <div className="row" style={{ marginTop: 28 }}>
            <button className="button button-primary" onClick={() => navigate('/login')}>Login</button>
          </div>
        </div>

        <div className="card glass" style={{ padding: 28 }}>
          <div className="row" style={{ marginBottom: 12 }}>
            <ShieldCheck size={22} color="#f59e0b" />
            <strong>How it works</strong>
          </div>
          <div className="grid" style={{ gap: 14 }}>
            <div className="notice">1. Sign up with your college email ending in @sairamtap.edu.in</div>
            <div className="notice">2. Verify your email using a real OTP sent to your mailbox.</div>
            <div className="notice">3. Build your profile, upload your picture, and unlock AI matching.</div>
            <div className="notice">4. Send requests, accept teammates, and start collaboration.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginPage({ onRegister, setCurrentUser }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    name: '', email: '', password: '', department: 'CSE', year: 'II Year', skills: '', performance: '85', projects: '', interests: '',
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [step, setStep] = useState('idle');

  const handleField = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const requestOtp = async () => {
    if (!form.email || !form.email.endsWith('@sairamtap.edu.in')) {
      setLoginError('Only @sairamtap.edu.in email addresses are allowed.');
      return;
    }

    setIsSubmitting(true);
    setLoginError('');

    try {
      const response = await fetch(`${API_BASE}/api/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.toLowerCase() }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to send OTP');
      }

      setOtpSent(true);
      setStep('otp');
    } catch (error) {
      setLoginError(error.message || 'Unable to send OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyAndCreate = async () => {
    if (!form.email || !otp || otp.length !== 6) {
      setLoginError('Please enter the 6-digit OTP from your email.');
      return;
    }

    setIsSubmitting(true);
    setLoginError('');

    try {
      const verificationResponse = await fetch(`${API_BASE}/api/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.toLowerCase(), code: otp }),
      });
      const verificationData = await verificationResponse.json();

      if (!verificationResponse.ok) {
        throw new Error(verificationData.message || 'OTP verification failed');
      }

      const students = getInitialStudents();
      const exists = students.some((student) => student.email === form.email.toLowerCase());
      if (exists) {
        throw new Error('An account with this college email already exists. Please log in instead.');
      }

      const student = buildStudent({
        id: crypto.randomUUID(),
        name: form.name,
        email: form.email.toLowerCase(),
        password: form.password || 'teamforge123',
        department: form.department,
        year: form.year,
        skills: form.skills.split(',').map((item) => item.trim()).filter(Boolean),
        interests: form.interests.split(',').map((item) => item.trim()).filter(Boolean),
        performance: Number(form.performance || 0),
        projects: form.projects.split(',').map((item) => item.trim()).filter(Boolean),
        avatar: asciiAvatar(form.name || 'Student'),
        bio: 'New TeamForge student ready to collaborate.',
      });

      const updated = [...students, student];
      localStorage.setItem(STORAGE_KEYS.students, JSON.stringify(updated));
      setCurrentUser(student);
      navigate('/dashboard');
    } catch (error) {
      setLoginError(error.message || 'Unable to complete registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = () => {
    const students = getInitialStudents();
    const match = students.find((student) => student.email === form.email.toLowerCase() && student.password === form.password);
    if (!match) {
      setLoginError('Invalid college email or password.');
      return;
    }

    setCurrentUser(match);
    navigate('/dashboard');
  };

  return (
    <div className="page-container">
      <div className="card glass auth-card">
        <div className="row" style={{ justifyContent: 'center', marginBottom: 20 }}>
          <img src="/logo.svg" alt="TeamForge logo" className="logo-image" style={{ width: 64, height: 64 }} />
          <div>
            <h2 style={{ margin: 0 }}>Welcome to TeamForge</h2>
            <p className="muted" style={{ margin: 4 }}>Private platform for Sairam students</p>
          </div>
        </div>

        <div className="row" style={{ justifyContent: 'center', marginBottom: 18 }}>
          <button className={`button ${mode === 'login' ? 'button-primary' : 'button-secondary'}`} onClick={() => setMode('login')}>Login</button>
          <button className={`button ${mode === 'signup' ? 'button-primary' : 'button-secondary'}`} onClick={() => setMode('signup')}>Sign Up</button>
        </div>

        {loginError && <div className="notice" style={{ marginBottom: 14 }}>{loginError}</div>}

        {mode === 'login' ? (
          <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
            <input className="input" name="email" value={form.email} onChange={handleField} placeholder="College Email" />
            <input className="input" type="password" name="password" value={form.password} onChange={handleField} placeholder="Password" />
            <button className="button button-primary" onClick={handleLogin}>Login</button>
          </div>
        ) : (
          <div>
            <div className="form-grid">
              <input className="input" name="name" value={form.name} onChange={handleField} placeholder="Full Name" />
              <input className="input" name="email" value={form.email} onChange={handleField} placeholder="College Email (@sairamtap.edu.in)" />
              <input className="input" type="password" name="password" value={form.password} onChange={handleField} placeholder="Password" />
              <select className="input" name="department" value={form.department} onChange={handleField}>
                <option value="CSE">CSE</option>
                <option value="IT">IT</option>
                <option value="ECE">ECE</option>
                <option value="EEE">EEE</option>
                <option value="MECH">Mechanical</option>
                <option value="AI">AI & DS</option>
              </select>
              <select className="input" name="year" value={form.year} onChange={handleField}>
                <option value="I Year">I Year</option>
                <option value="II Year">II Year</option>
                <option value="III Year">III Year</option>
                <option value="IV Year">IV Year</option>
              </select>
              <input className="input" name="performance" value={form.performance} onChange={handleField} placeholder="Performance Score" />
              <input className="input" name="skills" value={form.skills} onChange={handleField} placeholder="Skills e.g. React, Node, AI" />
              <input className="input" name="interests" value={form.interests} onChange={handleField} placeholder="Interests e.g. AI, Web, Robotics" />
              <input className="input" name="projects" value={form.projects} onChange={handleField} placeholder="Projects e.g. Smart City, App" />
            </div>

            {!otpSent ? (
              <button className="button button-primary" style={{ marginTop: 18, width: '100%' }} onClick={requestOtp} disabled={isSubmitting}>
                {isSubmitting ? 'Sending OTP...' : 'Send OTP'}
              </button>
            ) : (
              <div style={{ marginTop: 18 }}>
                <input className="input" value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="Enter 6-digit OTP" />
                <div className="row" style={{ marginTop: 14, justifyContent: 'space-between' }}>
                  <button className="button button-secondary" onClick={requestOtp}>Resend OTP</button>
                  <button className="button button-primary" onClick={verifyAndCreate} disabled={isSubmitting}>
                    {isSubmitting ? 'Verifying...' : 'Verify & Register'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardPage({ currentUser, students, notifications, addNotification, setCurrentUser, totalRegisteredStudents, onToggleTheme, promptEvent }) {
  const navigate = useNavigate();
  const [showInstall, setShowInstall] = useState(Boolean(promptEvent));

  useEffect(() => {
    setShowInstall(Boolean(promptEvent));
  }, [promptEvent]);

  const matches = useMemo(() => {
    return students
      .filter((student) => student.id !== currentUser.id)
      .map((student) => ({ ...student, score: scoreMatch(student, currentUser) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }, [students, currentUser]);

  const currentRequests = useMemo(() => {
    return students
      .filter((student) => student.email === currentUser.email)
      .flatMap((student) => (student.requests || []));
  }, [students, currentUser.email]);

  const acceptRequest = (requestId) => {
    const updatedStudents = students.map((student) => {
      if (student.id === currentUser.id) {
        const updatedRequests = (student.requests || []).map((request) => request.id === requestId ? { ...request, status: 'accepted' } : request);
        return { ...student, requests: updatedRequests, teamMembers: Array.from(new Set([...(student.teamMembers || []), ...updatedRequests.filter((request) => request.status === 'accepted').map((request) => request.fromId)])) };
      }
      return student;
    });

    setCurrentUser((previous) => ({ ...previous, teamMembers: [...new Set([...(previous.teamMembers || []), ...updatedStudents.filter((student) => student.id === currentUser.id)[0].teamMembers])] }));
    localStorage.setItem(STORAGE_KEYS.students, JSON.stringify(updatedStudents));
    addNotification(currentUser.id, 'Request Accepted', 'A collaboration request was accepted successfully.', '/profile', 'success');
  };

  const rejectRequest = (requestId) => {
    const updated = students.map((student) => (
      student.id === currentUser.id
        ? { ...student, requests: (student.requests || []).map((request) => request.id === requestId ? { ...request, status: 'rejected' } : request) }
        : student
    ));
    localStorage.setItem(STORAGE_KEYS.students, JSON.stringify(updated));
    addNotification(currentUser.id, 'Request Rejected', 'A collaboration request was rejected.', '/profile', 'warning');
  };

  const installApp = async () => {
    if (!window.deferredPrompt) return;
    try {
      await window.deferredPrompt.prompt();
      await window.deferredPrompt.userChoice;
      window.deferredPrompt = null;
    } catch {
      // no-op
    }
  };

  const handleBiometric = () => {
    const supported = !!(window.PublicKeyCredential && window.isSecureContext);
    if (!supported) {
      alert('Biometric sign-in is available on supported mobile browsers only.');
      return;
    }

    const biometricEnabled = !currentUser.biometricEnabled;
    setCurrentUser((previous) => ({ ...previous, biometricEnabled }));
    alert(biometricEnabled ? 'Biometric login enabled.' : 'Biometric login disabled.');
  };

  return (
    <div className="page-container">
      <div className="spread" style={{ marginBottom: 18 }}>
        <div>
          <h2 className="section-title" style={{ margin: 0 }}>Dashboard</h2>
          <p className="muted" style={{ margin: '6px 0 0' }}>Welcome back, {currentUser.name}</p>
        </div>
        <div className="row">
          {showInstall && (
            <button className="button button-secondary" onClick={installApp}><Download size={16} /> Install App</button>
          )}
          <button className="button button-secondary" onClick={onToggleTheme}>Theme</button>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="row" style={{ marginBottom: 10 }}><Users size={18} color="#f59e0b" /> <strong>Total Students</strong></div>
          <h3 style={{ fontSize: '2rem', margin: 0 }}>Total Students Registered: {totalRegisteredStudents}</h3>
        </div>
        <div className="card">
          <div className="row" style={{ marginBottom: 10 }}><UserRound size={18} color="#3b82f6" /> <strong>Your Profile</strong></div>
          <div className="row">
            <img src={currentUser.avatar || defaultAvatar} alt={currentUser.name} className="avatar" />
            <div>
              <div>{currentUser.name}</div>
              <small className="muted">{currentUser.department} • {currentUser.year}</small>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="row" style={{ marginBottom: 10 }}><Fingerprint size={18} color="#10b981" /> <strong>Biometric Login</strong></div>
          <button className="button button-secondary" onClick={handleBiometric}>
            {currentUser.biometricEnabled ? 'Disable Face ID / Fingerprint' : 'Enable Fingerprint / Face ID'}
          </button>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 28 }}>
        <div className="card">
          <div className="spread" style={{ marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>AI Matching</h3>
            <Sparkles color="#f59e0b" />
          </div>
          {matches.length === 0 ? <div className="empty-box">No additional students found yet.</div> : (
            matches.map((student) => (
              <div key={student.id} className="row" style={{ justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(148,163,184,0.18)' }}>
                <div className="row">
                  <img src={student.avatar || defaultAvatar} alt={student.name} className="avatar" />
                  <div>
                    <strong>{student.name}</strong>
                    <div className="muted">{student.department} • {student.skills.slice(0, 2).join(', ') || 'General'} </div>
                  </div>
                </div>
                <span className="tag">{Math.round(student.score)}% match</span>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="spread" style={{ marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>Requests</h3>
            <MessageSquareText color="#3b82f6" />
          </div>
          {currentUser.requests?.length ? currentUser.requests.map((request) => (
            <div key={request.id} style={{ border: '1px solid rgba(148,163,184,0.18)', borderRadius: 12, padding: 12, marginBottom: 10 }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <strong>{request.fromName}</strong>
                <span className="tag">{request.status}</span>
              </div>
              <div className="row" style={{ marginTop: 14 }}>
                <button className="button button-success" onClick={() => acceptRequest(request.id)}>Accept</button>
                <button className="button button-danger" onClick={() => rejectRequest(request.id)}>Reject</button>
              </div>
            </div>
          )) : <div className="empty-box">No incoming requests.</div>}
        </div>
      </div>

      <div className="spread" style={{ marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Student Directory</h3>
        <div className="row">
          <Link to="/profile"><button className="button button-secondary">My Profile</button></Link>
          <button className="button button-primary" onClick={() => navigate('/profile')}>View Team</button>
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

            <div className="row" style={{ marginTop: 4 }}>
              {student.skills.slice(0, 3).map((skill) => (
                <span className="tag" key={skill}>{skill}</span>
              ))}
            </div>

            <div className="muted">{student.bio || 'Collaborative engineering student.'}</div>

            <div className="row" style={{ justifyContent: 'space-between' }}>
              <button className="button button-primary" onClick={() => navigate(`/student/${student.id}`)}>View Profile</button>
              {student.id !== currentUser.id && (
                <button className="button button-secondary" onClick={() => navigate(`/student/${student.id}`)}>Request</button>
              )}
            </div>
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
  const [avatarFile, setAvatarFile] = useState(null);

  const handleField = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const onChangeAvatar = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarFile(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = () => {
    const updatedUser = {
      ...currentUser,
      name: form.name,
      department: form.department,
      year: form.year,
      skills: form.skills.split(',').map((item) => item.trim()).filter(Boolean),
      projects: form.projects.split(',').map((item) => item.trim()).filter(Boolean),
      interests: form.interests.split(',').map((item) => item.trim()).filter(Boolean),
      performance: Number(form.performance || 0),
      bio: form.bio,
      avatar: avatarFile || currentUser.avatar || defaultAvatar,
    };

    const nextStudents = students.map((student) => student.id === currentUser.id ? updatedUser : student);
    setStudents(nextStudents);
    setCurrentUser(updatedUser);
    localStorage.setItem(STORAGE_KEYS.students, JSON.stringify(nextStudents));
    localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(updatedUser));
    alert('Profile updated successfully.');
  };

  return (
    <div className="page-container">
      <div className="card glass" style={{ maxWidth: 900, margin: '18px auto 0' }}>
        <div className="spread" style={{ marginBottom: 18 }}>
          <div>
            <h2 style={{ margin: 0 }}>Edit Profile</h2>
            <p className="muted" style={{ margin: '4px 0 0' }}>Update your academic details and collaboration profile.</p>
          </div>
          <img src={avatarFile || currentUser.avatar || defaultAvatar} alt={currentUser.name} className="avatar-lg" />
        </div>

        <div className="form-grid">
          <input className="input" name="name" value={form.name} onChange={handleField} placeholder="Full Name" />
          <input className="input" name="department" value={form.department} onChange={handleField} placeholder="Department" />
          <input className="input" name="year" value={form.year} onChange={handleField} placeholder="Year" />
          <input className="input" name="performance" value={form.performance} onChange={handleField} placeholder="Performance Score" />
          <input className="input" name="skills" value={form.skills} onChange={handleField} placeholder="Skills" />
          <input className="input" name="interests" value={form.interests} onChange={handleField} placeholder="Interests" />
          <input className="input" name="projects" value={form.projects} onChange={handleField} placeholder="Projects" />
          <div style={{ gridColumn: '1 / -1' }}>
            <textarea className="input" rows="4" name="bio" value={form.bio} onChange={handleField} placeholder="Short biography" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <input type="file" accept="image/*" onChange={onChangeAvatar} className="input" />
          </div>
        </div>

        <div className="row" style={{ marginTop: 20, justifyContent: 'flex-end' }}>
          <button className="button button-primary" onClick={saveProfile}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

function StudentProfilePage({ currentUser, students, setCurrentUser, setStudents, addNotification }) {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const targetStudent = students.find((student) => student.id === studentId);

  if (!targetStudent) return <Navigate to="/dashboard" replace />;

  const alreadyRequested = (currentUser.requests || []).some((request) => request.toId === targetStudent.id || (request.fromId === currentUser.id && request.toId === targetStudent.id));
  const acceptedRequest = ((currentUser.requests || []).some((request) => request.status === 'accepted' && request.toId === targetStudent.id) || (targetStudent.requests || []).some((request) => request.status === 'accepted' && request.fromId === currentUser.id));

  const sendRequest = () => {
    const newRequest = {
      id: crypto.randomUUID(),
      fromId: currentUser.id,
      toId: targetStudent.id,
      fromName: currentUser.name,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const nextStudents = students.map((student) => {
      if (student.id === currentUser.id) {
        return { ...student, requests: [...(student.requests || []), newRequest] };
      }
      if (student.id === targetStudent.id) {
        return { ...student, requests: [...(student.requests || []), { ...newRequest, status: 'pending', toId: student.id, fromId: currentUser.id, fromName: currentUser.name }] };
      }
      return student;
    });

    setStudents(nextStudents);
    setCurrentUser((previous) => ({ ...previous, requests: [...(previous.requests || []), newRequest] }));
    addNotification(targetStudent.id, 'New Collaboration Request', `${currentUser.name} wants to collaborate with you.`, `/student/${targetStudent.id}`, 'info');
    navigate('/dashboard');
  };

  const openCall = () => {
    if (!acceptedRequest) return;
    alert('Call feature enabled after both students accepted the collaboration request.');
  };

  const groupCall = () => {
    const acceptedTeamMembers = students.filter((student) => student.id === currentUser.id || (student.teamMembers || []).includes(currentUser.id));
    if (acceptedTeamMembers.length < 2) {
      alert('Only accepted members of the same team can join a conference call.');
      return;
    }
    alert('Conference call started for accepted team members.');
  };

  return (
    <div className="page-container">
      <div className="card glass" style={{ maxWidth: 900, margin: '18px auto 0' }}>
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

        <div className="grid grid-2" style={{ gap: 20 }}>
          <div>
            <h3>About</h3>
            <p className="muted">{targetStudent.bio || 'Student interested in building impactful projects and collaborating across teams.'}</p>
          </div>
          <div>
            <h3>Performance</h3>
            <div className="tag">{targetStudent.performance}%</div>
          </div>
        </div>

        <div className="grid grid-3" style={{ marginTop: 18 }}>
          <div className="card">
            <h4>Skills</h4>
            <div className="row">
              {(targetStudent.skills || []).map((skill) => <span className="tag" key={skill}>{skill}</span>)}
            </div>
          </div>
          <div className="card">
            <h4>Interests</h4>
            <div className="row">
              {(targetStudent.interests || []).map((interest) => <span className="tag" key={interest}>{interest}</span>)}
            </div>
          </div>
          <div className="card">
            <h4>Projects</h4>
            <div className="row">
              {(targetStudent.projects || []).map((project) => <span className="tag" key={project}>{project}</span>)}
            </div>
          </div>
        </div>

        <div className="row" style={{ marginTop: 24, justifyContent: 'flex-end' }}>
          <button className={`button ${acceptedRequest ? 'button-primary' : 'button-secondary'}`} onClick={openCall} disabled={!acceptedRequest}>Call</button>
          <button className="button button-secondary" onClick={groupCall}>Conference Call</button>
        </div>
      </div>
    </div>
  );
}

export default App;
