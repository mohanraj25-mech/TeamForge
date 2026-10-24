import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5000);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const otpStore = new Map();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: String(process.env.SMTP_SECURE || 'true') === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const validateCollegeEmail = (email) => /^[^\s@]+@sairamtap\.edu\.in$/i.test(String(email || ''));

app.get('/api/health', (_, res) => {
  res.json({ ok: true, message: 'TeamForge API is running.' });
});

app.post('/api/send-otp', async (req, res) => {
  const { email } = req.body || {};

  if (!validateCollegeEmail(email)) {
    return res.status(400).json({ message: 'Only @sairamtap.edu.in email addresses are allowed.' });
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = Date.now() + 5 * 60 * 1000;
  otpStore.set(String(email).toLowerCase(), { code, expiresAt });

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'TeamForge OTP Verification',
      text: `Your TeamForge OTP is ${code}. It is valid for 5 minutes.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:16px;">
          <h2 style="margin:0 0 8px;color:#0f172a;">TeamForge Verification</h2>
          <p style="color:#334155;">Use the code below to verify your college email.</p>
          <div style="font-size:32px;font-weight:700;letter-spacing:8px;margin:18px 0;padding:16px;text-align:center;background:#f8fafc;border-radius:12px;color:#0f172a;">${code}</div>
          <p style="color:#475569;">This code expires in 5 minutes.</p>
        </div>
      `,
    });

    return res.json({ ok: true, message: 'OTP sent successfully.' });
  } catch (error) {
    console.error('SMTP error:', error);
    return res.status(500).json({ message: 'Unable to send OTP. Please try again later.' });
  }
});

app.post('/api/verify-otp', (req, res) => {
  const { email, code } = req.body || {};
  const key = String(email || '').toLowerCase();
  const record = otpStore.get(key);

  if (!record) {
    return res.status(400).json({ message: 'No OTP was requested for this email.' });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
  }

  if (String(record.code) !== String(code)) {
    return res.status(400).json({ message: 'Invalid OTP.' });
  }

  otpStore.delete(key);
  return res.json({ ok: true, message: 'OTP verified successfully.' });
});

app.use(express.static(path.join(__dirname, '..', 'dist')));

app.get('*', (_, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`TeamForge API running on http://localhost:${port}`);
});
