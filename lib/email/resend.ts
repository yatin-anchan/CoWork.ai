import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.APP_URL || "http://localhost:3000";

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

  await resend.emails.send({
    from: "CoWork AI <onboarding@resend.dev>",
    to,
    subject: "You've been invited to CoWork AI",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #111;">You're invited to collaborate</h2>
        <p><strong>${inviterEmail}</strong> has invited you to join <strong>${projectName}</strong> as a <strong>${role}</strong>.</p>
        <a href="${inviteUrl}" style="
          display: inline-block;
          margin-top: 16px;
          padding: 12px 24px;
          background: #2563eb;
          color: #fff;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 600;
        ">Accept Invite</a>
        <p style="margin-top: 24px; color: #666; font-size: 13px;">
          Or copy this link: <a href="${inviteUrl}">${inviteUrl}</a>
        </p>
        <p style="color: #999; font-size: 12px;">If you weren't expecting this invite, you can ignore this email.</p>
      </div>
    `,
  });
} // ← sendInviteEmail closes here

export async function sendPasswordResetEmail({
  to,
  name,
  resetLink,
}: {
  to: string;
  name: string;
  resetLink: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY missing. Skipping password reset email.");
    console.log(`RESET LINK: ${resetLink}`);
    return;
  }

  await resend.emails.send({
    from: "CoWork AI <onboarding@resend.dev>",
    to,
    subject: "Reset your CoWork AI password",
    html: `
      <div style="font-family: Inter, Arial, sans-serif; background:#f8fafc; padding:32px;">
        <div style="max-width:560px; margin:0 auto; background:white; border:1px solid #e5e7eb; border-radius:18px; padding:28px;">
          <h1 style="margin:0 0 12px; color:#0f172a; font-size:24px;">
            Reset your password
          </h1>
          <p style="color:#475569; line-height:1.6; font-size:15px;">
            Hi ${name}, use the button below to reset your CoWork AI password.
            This link expires in 30 minutes.
          </p>
          <a href="${resetLink}"
             style="display:inline-block; margin-top:18px; background:#4f46e5; color:white; text-decoration:none; padding:12px 18px; border-radius:10px; font-weight:700;">
            Reset password
          </a>
          <p style="margin-top:24px; color:#64748b; font-size:13px; line-height:1.6;">
            If the button does not work, copy and paste this link:
            <br />
            <span style="word-break:break-all;">${resetLink}</span>
          </p>
        </div>
      </div>
    `,
  });
}