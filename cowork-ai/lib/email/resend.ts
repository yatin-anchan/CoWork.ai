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
}