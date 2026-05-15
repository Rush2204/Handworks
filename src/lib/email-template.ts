/**
 * Builds the HTML + plain-text bodies for the "Request a Quote" email.
 *
 * The HTML uses inline styles + a table-based layout because most email
 * clients (Gmail, Outlook, Apple Mail) strip <style> blocks and ignore
 * modern CSS. The result is a responsive, professional message that
 * renders consistently across clients.
 */

export interface QuotePayload {
  fullName: string;
  email: string;
  phone?: string;
  company?: string;
  inquiryType?: string;
  message: string;
  submittedAt: Date;
}

// Escape user-supplied strings so the email body cannot inject markup.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Convert plain-text newlines into <br> for the message body.
function nl2br(value: string): string {
  return escapeHtml(value).replace(/\n/g, '<br>');
}

function formatDate(date: Date): string {
  return date.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

// Single row in the details table.
function row(label: string, value: string, isLast = false): string {
  const border = isLast ? '' : 'border-bottom:1px solid #eee5dc;';
  return `
    <tr>
      <td style="padding:14px 18px;background:#f3efe9;font-size:13px;font-weight:600;color:#0e4c5a;letter-spacing:0.04em;text-transform:uppercase;width:36%;${border}">${label}</td>
      <td style="padding:14px 18px;font-size:15px;color:#2a2a2a;${border}">${value}</td>
    </tr>
  `;
}

export function buildQuoteEmail(data: QuotePayload): { html: string; text: string; subject: string } {
  const subject = `New Quote Request — ${data.fullName}`;

  const phoneRow = data.phone
    ? row('Phone Number', `<a href="tel:${escapeHtml(data.phone)}" style="color:#0e4c5a;text-decoration:none;">${escapeHtml(data.phone)}</a>`)
    : row('Phone Number', '<span style="color:#9a9a9a;">Not provided</span>');

  const companyRow = data.company
    ? row('Company Name', escapeHtml(data.company))
    : row('Company Name', '<span style="color:#9a9a9a;">Not provided</span>');

  const inquiryRow = data.inquiryType
    ? row('Inquiry Type', escapeHtml(data.inquiryType))
    : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#faf8f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#2a2a2a;">
  <!-- Wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#faf8f5;padding:32px 16px;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(14,76,90,0.08);">

          <!-- Header band -->
          <tr>
            <td style="background:linear-gradient(135deg,#0e4c5a 0%,#1a6678 100%);padding:36px 32px;color:#ffffff;">
              <p style="margin:0 0 6px 0;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#e8a3b1;font-weight:600;">Handworks · New Inquiry</p>
              <h1 style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:600;line-height:1.2;color:#ffffff;">New Quote Request</h1>
              <p style="margin:10px 0 0 0;font-size:14px;color:rgba(255,255,255,0.85);">Submitted via the website contact form.</p>
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td style="padding:28px 32px 8px 32px;">
              <p style="margin:0;font-size:15px;line-height:1.6;color:#4a4a4a;">
                You received a new quote request from
                <strong style="color:#0e4c5a;">${escapeHtml(data.fullName)}</strong>.
                The submission details are below.
              </p>
            </td>
          </tr>

          <!-- Details table -->
          <tr>
            <td style="padding:16px 32px 8px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #eee5dc;border-radius:12px;overflow:hidden;">
                ${row('Full Name', escapeHtml(data.fullName))}
                ${row('Email Address', `<a href="mailto:${escapeHtml(data.email)}" style="color:#0e4c5a;text-decoration:none;">${escapeHtml(data.email)}</a>`)}
                ${phoneRow}
                ${companyRow}
                ${inquiryRow}
                ${row('Submission Date', escapeHtml(formatDate(data.submittedAt)), true)}
              </table>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding:16px 32px 32px 32px;">
              <p style="margin:0 0 10px 0;font-size:13px;font-weight:600;color:#0e4c5a;letter-spacing:0.04em;text-transform:uppercase;">Message</p>
              <div style="padding:18px 20px;background:#f3efe9;border-left:4px solid #d4798c;border-radius:8px;font-size:15px;line-height:1.65;color:#2a2a2a;white-space:pre-wrap;">
                ${nl2br(data.message)}
              </div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding:0 32px 36px 32px;">
              <a href="mailto:${escapeHtml(data.email)}?subject=Re:%20Your%20quote%20request"
                 style="display:inline-block;padding:14px 28px;background:#0e4c5a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:500;border-radius:999px;">
                Reply to ${escapeHtml(data.fullName)}
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0a3a45;padding:22px 32px;text-align:center;color:rgba(255,255,255,0.6);font-size:12px;">
              <p style="margin:0;">This message was sent automatically from the Handworks website.</p>
              <p style="margin:6px 0 0 0;">&copy; ${new Date().getFullYear()} Handworks. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  // Plain-text fallback for email clients that prefer it (or block HTML).
  const text = [
    'New Quote Request — Handworks',
    '================================',
    '',
    `Full Name:       ${data.fullName}`,
    `Email Address:   ${data.email}`,
    `Phone Number:    ${data.phone || 'Not provided'}`,
    `Company Name:    ${data.company || 'Not provided'}`,
    data.inquiryType ? `Inquiry Type:    ${data.inquiryType}` : null,
    `Submission Date: ${formatDate(data.submittedAt)}`,
    '',
    'Message:',
    '--------',
    data.message,
    '',
    '--',
    'Sent automatically from the Handworks website.',
  ]
    .filter((line) => line !== null)
    .join('\n');

  return { html, text, subject };
}
