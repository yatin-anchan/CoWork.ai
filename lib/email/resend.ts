import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const FROM = `"CoWork AI" <${process.env.GMAIL_USER}>`;
const APP_URL = process.env.APP_URL || "http://localhost:3000";

const baseTemplate = (content: string) => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
  </head>
  <body style="margin:0; padding:0; background:#020617; font-family:'Inter',sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#020617; padding: 48px 16px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

            <!-- Logo / Header -->
            <tr>
              <td align="center" style="padding-bottom: 28px;">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <div style="
                        width:38px; height:38px; border-radius:10px;
                        background:linear-gradient(135deg,#4f46e5,#8b5cf6);
                        display:inline-flex; align-items:center; justify-content:center;
                        text-align:center; line-height:38px;
                        box-shadow:0 12px 30px rgba(79,70,229,0.35);
                        vertical-align:middle;
                      ">
                        <span style="color:#fff; font-size:20px; font-weight:900; line-height:38px;">⬡</span>
                      </div>
                    </td>
                    <td style="padding-left:10px; vertical-align:middle;">
                      <span style="font-size:20px; font-weight:800; color:#f8fafc; letter-spacing:-0.03em;">
                        CoWork<span style="color:#a78bfa;">AI</span>
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Card -->
            <tr>
              <td style="
                background: linear-gradient(180deg, rgba(79,70,229,0.13) 0%, rgba(15,23,42,0.85) 100%);
                border: 1px solid rgba(139,92,246,0.28);
                border-radius: 22px;
                padding: 40px 36px;
              ">
                ${content}
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="padding-top:28px;">
                <p style="color:#334155; font-size:12px; margin:0;">
                  © ${new Date().getFullYear()} CoWorkAI. All rights reserved.
                </p>
                <p style="color:#1e293b; font-size:12px; margin:6px 0 0;">
                  Built for project-based AI collaboration.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
`;

export async function sendInviteEmail({
  to,
  inviterEmail,
  projectName,
  role,
  token,
}: {
  to: string;
  inviterEmail: string;
  projectName: string;
  role: string;
  token: string;
}) {
  const inviteUrl = `${APP_URL}/invites/${token}`;

  const content = `
    <!-- Eyebrow badge -->
    <p style="margin:0 0 22px; text-align:center;">
      <span style="
        display:inline-block; padding:6px 14px; border-radius:999px;
        background:rgba(79,70,229,0.14); border:1px solid rgba(139,92,246,0.28);
        color:#c4b5fd; font-size:12px; font-weight:800; letter-spacing:0.08em;
      ">⚡ PROJECT INVITATION</span>
    </p>

    <!-- Title -->
    <h1 style="
      margin:0 0 16px; text-align:center;
      color:#f8fafc; font-size:28px; font-weight:900;
      line-height:1.1; letter-spacing:-0.04em;
    ">You're invited to collaborate</h1>

    <!-- Body -->
    <p style="color:#94a3b8; font-size:15px; line-height:1.75; margin:0 0 28px; text-align:center;">
      <span style="color:#e2e8f0; font-weight:700;">${inviterEmail}</span>
      has invited you to join
      <span style="color:#e2e8f0; font-weight:700;">${projectName}</span>
      as a
      <span style="
        display:inline-block; padding:2px 10px; border-radius:999px;
        background:rgba(79,70,229,0.18); border:1px solid rgba(139,92,246,0.28);
        color:#a78bfa; font-weight:800; font-size:13px;
      ">${role}</span>
    </p>

    <!-- CTA Button -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom:28px;">
          <a href="${inviteUrl}" style="
            display:inline-block;
            padding:14px 32px;
            border-radius:12px;
            background:linear-gradient(135deg,#4f46e5,#7c3aed);
            color:#fff;
            font-size:15px;
            font-weight:800;
            text-decoration:none;
            letter-spacing:-0.01em;
            box-shadow:0 12px 36px rgba(79,70,229,0.35);
          ">Accept Invite →</a>
        </td>
      </tr>
    </table>

    <!-- Divider -->
    <div style="border-top:1px solid rgba(148,163,184,0.12); margin-bottom:20px;"></div>

    <!-- Fallback link -->
    <p style="color:#475569; font-size:12px; margin:0; text-align:center; line-height:1.7;">
      Or copy this link into your browser:<br/>
      <a href="${inviteUrl}" style="color:#6d6aff; word-break:break-all;">${inviteUrl}</a>
    </p>

    <p style="color:#334155; font-size:12px; margin:16px 0 0; text-align:center;">
      If you weren't expecting this invite, you can safely ignore this email.
    </p>
  `;

  await transporter.sendMail({
    from: FROM,
    to,
    subject: `You've been invited to join ${projectName} on CoWork AI`,
    html: baseTemplate(content),
  });
}

export async function sendPasswordResetEmail({
  to,
  name,
  resetLink,
}: {
  to: string;
  name: string;
  resetLink: string;
}) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("[email] Gmail credentials missing. Skipping password reset email.");
    console.log(`RESET LINK: ${resetLink}`);
    return;
  }

  const content = `
    <!-- Eyebrow badge -->
    <p style="margin:0 0 22px; text-align:center;">
      <span style="
        display:inline-block; padding:6px 14px; border-radius:999px;
        background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.25);
        color:#fca5a5; font-size:12px; font-weight:800; letter-spacing:0.08em;
      ">🔒 PASSWORD RESET</span>
    </p>

    <!-- Title -->
    <h1 style="
      margin:0 0 16px; text-align:center;
      color:#f8fafc; font-size:28px; font-weight:900;
      line-height:1.1; letter-spacing:-0.04em;
    ">Reset your password</h1>

    <!-- Body -->
    <p style="color:#94a3b8; font-size:15px; line-height:1.75; margin:0 0 28px; text-align:center;">
      Hi <span style="color:#e2e8f0; font-weight:700;">${name}</span>, use the button below
      to reset your CoWork AI password.<br/>
      <span style="
        display:inline-block; margin-top:10px; padding:4px 12px; border-radius:999px;
        background:rgba(239,68,68,0.10); border:1px solid rgba(239,68,68,0.2);
        color:#fca5a5; font-size:12px; font-weight:700;
      ">⏱ This link expires in 30 minutes</span>
    </p>

    <!-- CTA Button -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom:28px;">
          <a href="${resetLink}" style="
            display:inline-block;
            padding:14px 32px;
            border-radius:12px;
            background:linear-gradient(135deg,#4f46e5,#7c3aed);
            color:#fff;
            font-size:15px;
            font-weight:800;
            text-decoration:none;
            letter-spacing:-0.01em;
            box-shadow:0 12px 36px rgba(79,70,229,0.35);
          ">Reset password →</a>
        </td>
      </tr>
    </table>

    <!-- Divider -->
    <div style="border-top:1px solid rgba(148,163,184,0.12); margin-bottom:20px;"></div>

    <!-- Fallback link -->
    <p style="color:#475569; font-size:12px; margin:0; text-align:center; line-height:1.7;">
      If the button doesn't work, copy this link into your browser:<br/>
      <span style="color:#6d6aff; word-break:break-all;">${resetLink}</span>
    </p>

    <p style="color:#334155; font-size:12px; margin:16px 0 0; text-align:center;">
      If you didn't request a password reset, you can safely ignore this email.
    </p>
  `;

  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Reset your CoWork AI password",
    html: baseTemplate(content),
  });
}