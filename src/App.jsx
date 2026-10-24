@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: light;
  font-family: 'Inter', 'Segoe UI', sans-serif;
  line-height: 1.5;
  font-weight: 400;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  --bg: #eef2ff;
  --panel: rgba(255, 255, 255, 0.78);
  --panel-strong: #ffffff;
  --text: #0f172a;
  --muted: #475569;
  --primary: #0f172a;
  --primary-soft: #e2e8f0;
  --accent: #f59e0b;
  --card: #ffffff;
  --success: #10b981;
  --danger: #ef4444;
  --shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  background: linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%);
  color: var(--text);
}

body.dark {
  --bg: #020817;
  --panel: rgba(15, 23, 42, 0.85);
  --panel-strong: #111827;
  --text: #e2e8f0;
  --muted: #94a3b8;
  --primary: #f8fafc;
  --primary-soft: #1e293b;
  --accent: #fbbf24;
  --card: #0f172a;
  --success: #34d399;
  --danger: #f87171;
  --shadow: 0 12px 36px rgba(2, 6, 23, 0.5);
  background: linear-gradient(135deg, #020817 0%, #111827 100%);
  color: var(--text);
}

body.dark input,
body.dark select,
body.dark textarea {
  color-scheme: dark;
}

* {
  box-sizing: border-box;
}

button,
input,
select,
textarea {
  font: inherit;
}

img {
  max-width: 100%;
  display: block;
}

#root {
  min-height: 100vh;
}

.app-shell {
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
}

.glass {
  background: var(--panel);
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: var(--shadow);
  backdrop-filter: blur(18px);
}

.page-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px 18px 64px;
}

.navbar {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 22px;
  background: rgba(15, 23, 42, 0.82);
  color: white;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  backdrop-filter: blur(14px);
}

.logo-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.logo-image {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  border: 2px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.06);
  object-fit: cover;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.button,
button {
  border: none;
  border-radius: 12px;
  padding: 0.72rem 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
}

.button-primary {
  background: linear-gradient(135deg, #111827, #1f2937);
  color: white;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.25);
}

.button-primary:hover,
.button:hover {
  transform: translateY(-1px);
}

.button-secondary {
  background: rgba(255, 255, 255, 0.12);
  color: var(--text);
  border: 1px solid rgba(148, 163, 184, 0.25);
}

.button-danger {
  background: rgba(239, 68, 68, 0.12);
  color: #b91c1c;
}

.button-success {
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
}

.theme-button, .install-button, .icon-button {
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.08);
  color: inherit;
}

.badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 20px;
  height: 20px;
  border-radius: 999px;
  background: #ef4444;
  color: white;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 700;
}

.notice {
  border-left: 4px solid #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  color: #92400e;
  padding: 12px 14px;
  border-radius: 12px;
}

.grid {
  display: grid;
  gap: 18px;
}

.grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.grid-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }

.card {
  background: var(--card);
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: var(--shadow);
  border-radius: 20px;
  padding: 18px;
}

.hero {
  display: grid;
  gap: 26px;
  align-items: center;
  grid-template-columns: 1.2fr 0.8fr;
  padding: 38px 0 20px;
}

.hero-title {
  margin: 0;
  font-size: clamp(2.3rem, 4vw, 4rem);
  line-height: 1.1;
  letter-spacing: -0.06em;
}

.hero-subtitle {
  margin: 0;
  font-size: 1rem;
  color: var(--muted);
}

.feature-list {
  display: grid;
  gap: 12px;
  list-style: none;
  padding: 0;
  margin: 24px 0 0;
}

.feature-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--muted);
}

.input,
select,
textarea {
  width: 100%;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(255, 255, 255, 0.7);
  color: var(--text);
  padding: 0.82rem 0.9rem;
  outline: none;
}

body.dark .input,
body.dark select,
body.dark textarea {
  background: rgba(15, 23, 42, 0.9);
  border-color: rgba(148, 163, 184, 0.24);
}

.form-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.auth-card {
  max-width: 760px;
  margin: 32px auto 0;
  padding: 26px;
}

.centered {
  display: grid;
  place-items: center;
}

.avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  background: #e2e8f0;
  border: 2px solid rgba(255, 255, 255, 0.7);
}

.avatar-lg {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid rgba(245, 158, 11, 0.3);
}

.section-title {
  margin: 0 0 8px;
  font-size: 1.5rem;
  letter-spacing: -0.03em;
}

.muted {
  color: var(--muted);
}

.row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.spread {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.student-card {
  background: var(--card);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 18px;
  padding: 18px;
  box-shadow: var(--shadow);
  display: grid;
  gap: 12px;
}

.student-card:hover {
  transform: translateY(-2px);
  transition: 0.2s ease;
}

.tag {
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.65rem;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.1);
  color: #1d4ed8;
  font-size: 0.72rem;
  font-weight: 700;
}

.notification-panel {
  position: fixed;
  right: 18px;
  top: 80px;
  width: min(350px, calc(100vw - 24px));
  max-height: 75vh;
  overflow: auto;
  background: rgba(15, 23, 42, 0.9);
  color: white;
  border-radius: 18px;
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 20px 40px rgba(0,0,0,0.28);
  z-index: 40;
}

.notification-item {
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  cursor: pointer;
}

.notification-item:last-child {
  border-bottom: none;
}

.empty-box {
  border: 1px dashed rgba(148, 163, 184, 0.5);
  border-radius: 18px;
  padding: 26px;
  text-align: center;
  color: var(--muted);
}

@media (max-width: 900px) {
  .hero,
  .grid-2,
  .form-grid,
  .grid-3,
  .grid-4 {
    grid-template-columns: 1fr;
  }

  .page-container {
    padding-left: 14px;
    padding-right: 14px;
  }
}
