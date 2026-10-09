const BRAND = {
  navy: '#0b1220',
  navySoft: '#131c31',
  indigo: '#6366f1',
  indigoDark: '#4f46e5',
  emerald: '#10b981',
  slate: '#64748b',
  border: '#e2e8f0',
  bg: '#f1f5f9',
  white: '#ffffff',
};

function layout({ heading, intro, body, ctaLabel, ctaUrl, footerNote }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>ExamSlot</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${BRAND.navy};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${BRAND.white};border-radius:16px;overflow:hidden;border:1px solid ${BRAND.border};">
        <tr>
          <td style="background:${BRAND.navy};padding:28px 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:20px;font-weight:700;color:${BRAND.white};letter-spacing:-0.02em;">ExamSlot</td>
                <td align="right" style="font-size:12px;color:#94a3b8;">Your exams. Your schedule.</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:${BRAND.navy};">${heading}</h1>
            <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:${BRAND.slate};">${intro}</p>
            ${body || ''}
            ${
              ctaLabel && ctaUrl
                ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;"><tr><td style="border-radius:10px;background:${BRAND.indigoDark};">
                    <a href="${ctaUrl}" target="_blank" style="display:inline-block;padding:14px 26px;font-size:15px;font-weight:600;color:${BRAND.white};text-decoration:none;border-radius:10px;">${ctaLabel}</a>
                  </td></tr></table>
                  <p style="margin:12px 0 0;font-size:12px;line-height:1.6;color:${BRAND.slate};word-break:break-all;">Or paste this link into your browser:<br /><a href="${ctaUrl}" style="color:${BRAND.indigo};">${ctaUrl}</a></p>`
                : ''
            }
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;background:#f8fafc;border-top:1px solid ${BRAND.border};">
            <p style="margin:0;font-size:12px;line-height:1.6;color:${BRAND.slate};">${footerNote || 'This is an automated message from ExamSlot. © ExamSlot Virtual University.'}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function studentSetupEmail({ student, url }) {
  const heading = `Welcome, ${student.fullName.split(' ')[0]}`;
  const intro =
    'The university has created your ExamSlot account. ExamSlot lets you choose your examination branch, build your personal date sheet, and manage change requests.';
  const body = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid ${BRAND.border};border-radius:12px;padding:16px 20px;margin:8px 0;">
      <tr><td style="font-size:14px;line-height:1.8;color:${BRAND.navy};">
        <strong>Registration No.</strong>&nbsp; ${student.registrationNumber}<br />
        <strong>Program</strong>&nbsp; ${student.program}<br />
        <strong>Email</strong>&nbsp; ${student.email}
      </td></tr>
    </table>
    <p style="margin:8px 0 0;font-size:15px;line-height:1.6;color:${BRAND.slate};">Click the button below to set your password and activate your account. This secure link expires in <strong>24 hours</strong> and can only be used once.</p>`;
  return {
    subject: 'Set up your ExamSlot account',
    html: layout({
      heading,
      intro,
      body,
      ctaLabel: 'Set my password',
      ctaUrl: url,
      footerNote:
        'If you were not expecting this email, you can ignore it. For security, never share this link with anyone.',
    }),
    text: `Welcome ${student.fullName}. Set up your ExamSlot account (expires in 24 hours): ${url}`,
  };
}

export function passwordResetEmail({ user, url }) {
  const body = `<p style="margin:8px 0 0;font-size:15px;line-height:1.6;color:${BRAND.slate};">Choose a new password using the button below. This link expires in <strong>1 hour</strong> and can only be used once. If you did not request a reset, you can safely ignore this email.</p>`;
  return {
    subject: 'Reset your ExamSlot password',
    html: layout({
      heading: 'Reset your password',
      intro: `Hi ${user.name || user.fullName || 'there'}, we received a request to reset your ExamSlot password.`,
      body,
      ctaLabel: 'Reset password',
      ctaUrl: url,
      footerNote:
        'For your security, this link expires in 1 hour. If you did not request a reset, no action is required.',
    }),
    text: `Reset your ExamSlot password (expires in 1 hour): ${url}`,
  };
}

export function requestReviewedEmail({ student, request, approved, remark }) {
  const statusText = approved ? 'approved' : 'rejected';
  const typeText =
    request.type === 'BRANCH_CHANGE' ? 'examination branch change' : 'date sheet change';
  const accent = approved ? BRAND.emerald : '#ef4444';
  const body = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid ${BRAND.border};border-radius:12px;padding:16px 20px;margin:8px 0;">
      <tr><td style="font-size:14px;line-height:1.8;color:${BRAND.navy};">
        <strong>Request</strong>&nbsp; ${typeText}<br />
        <strong>Status</strong>&nbsp; <span style="color:${accent};font-weight:700;text-transform:capitalize;">${statusText}</span><br />
        ${remark ? `<strong>Administrator remark</strong>&nbsp; ${remark}` : ''}
      </td></tr>
    </table>
    <p style="margin:8px 0 0;font-size:15px;line-height:1.6;color:${BRAND.slate};">
      ${
        approved
          ? `Your request was ${statusText}. Sign in to ExamSlot to use your one-time ${typeText} authorization. It can be used only once.`
          : `Your request was ${statusText}. Your current ${typeText.replace(' change', '')} remains unchanged.`
      }
    </p>`;
  return {
    subject: `Your ExamSlot ${typeText} request was ${statusText}`,
    html: layout({
      heading: `Request ${statusText}`,
      intro: `Hi ${student.fullName.split(' ')[0]}, an administrator has reviewed your ${typeText} request.`,
      body,
      ctaLabel: 'Open ExamSlot',
      ctaUrl: `${(process.env.CLIENT_URL || '').replace(/\/$/, '')}/login`,
    }),
    text: `Your ExamSlot ${typeText} request was ${statusText}. ${remark ? `Remark: ${remark}` : ''}`,
  };
}

export default { studentSetupEmail, passwordResetEmail, requestReviewedEmail };
