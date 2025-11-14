import { Resend } from 'resend';
import nodemailer from 'nodemailer';

const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'smtp'; // 'smtp' or 'resend'
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@hr-app.com';

// Resend client
let resendClient: Resend | null = null;
if (EMAIL_PROVIDER === 'resend' && process.env.RESEND_API_KEY) {
  resendClient = new Resend(process.env.RESEND_API_KEY);
}

// Nodemailer transporter
let smtpTransporter: nodemailer.Transporter | null = null;
if (EMAIL_PROVIDER === 'smtp' && process.env.SMTP_HOST) {
  smtpTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email via configured provider
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const recipients = Array.isArray(options.to) ? options.to : [options.to];

  if (EMAIL_PROVIDER === 'resend' && resendClient) {
    await resendClient.emails.send({
      from: FROM_EMAIL,
      to: recipients,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    return;
  }

  if (EMAIL_PROVIDER === 'smtp' && smtpTransporter) {
    await smtpTransporter.sendMail({
      from: FROM_EMAIL,
      to: recipients.join(', '),
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    return;
  }

  // Fallback: log to console in development
  console.log('📧 Email (no provider configured):');
  console.log(`To: ${recipients.join(', ')}`);
  console.log(`Subject: ${options.subject}`);
  console.log(`Body: ${options.text || options.html}`);
}

/**
 * Send notification email about new feedback
 */
export async function sendFeedbackNotification(
  recipientEmail: string,
  recipientName: string,
  feedbackTitle: string,
  feedbackId: number
): Promise<void> {
  await sendEmail({
    to: recipientEmail,
    subject: `New Feedback: ${feedbackTitle}`,
    html: `
      <h2>Hello ${recipientName},</h2>
      <p>A new feedback item has been assigned to you:</p>
      <p><strong>${feedbackTitle}</strong></p>
      <p>Please log in to the HR portal to review and respond.</p>
      <p><a href="${process.env.APP_URL || 'http://localhost:5173'}/feedback/${feedbackId}">View Feedback</a></p>
    `,
    text: `Hello ${recipientName}, A new feedback item has been assigned to you: ${feedbackTitle}. Please log in to review.`,
  });
}

/**
 * Send announcement notification email
 */
export async function sendAnnouncementNotification(
  recipientEmail: string,
  recipientName: string,
  announcementTitle: string,
  announcementId: number
): Promise<void> {
  await sendEmail({
    to: recipientEmail,
    subject: `New Announcement: ${announcementTitle}`,
    html: `
      <h2>Hello ${recipientName},</h2>
      <p>A new announcement has been posted:</p>
      <p><strong>${announcementTitle}</strong></p>
      <p><a href="${process.env.APP_URL || 'http://localhost:5173'}/announcements/${announcementId}">View Announcement</a></p>
    `,
    text: `Hello ${recipientName}, A new announcement has been posted: ${announcementTitle}. Please log in to view.`,
  });
}

/**
 * Send weekly digest email
 */
export async function sendWeeklyDigest(
  recipientEmail: string,
  recipientName: string,
  stats: {
    newFeedback: number;
    newAnnouncements: number;
    pendingFeedback: number;
  }
): Promise<void> {
  await sendEmail({
    to: recipientEmail,
    subject: 'Your Weekly HR Portal Digest',
    html: `
      <h2>Hello ${recipientName},</h2>
      <p>Here's your weekly summary:</p>
      <ul>
        <li><strong>${stats.newFeedback}</strong> new feedback items this week</li>
        <li><strong>${stats.newAnnouncements}</strong> new announcements</li>
        <li><strong>${stats.pendingFeedback}</strong> feedback items pending your action</li>
      </ul>
      <p><a href="${process.env.APP_URL || 'http://localhost:5173'}">Visit the HR Portal</a></p>
    `,
    text: `Hello ${recipientName}, Weekly summary: ${stats.newFeedback} new feedback, ${stats.newAnnouncements} announcements, ${stats.pendingFeedback} pending.`,
  });
}
