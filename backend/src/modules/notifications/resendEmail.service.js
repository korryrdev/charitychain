import { env } from '../../config/environment.js';
import { AppError } from '../../errors/AppError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';
import { logger } from '../../observability/logger.js';

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

export function createResendEmailService({ environment = env, fetchImpl = fetch } = {}) {
  async function send({ to, subject, html, text }) {
    if (!environment.FEATURE_EMAIL_ENABLED) return { delivery: 'DEVELOPMENT_ONLY' };
    let response;
    try {
      response = await fetchImpl('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${environment.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: environment.EMAIL_FROM, to: [to], subject, html, text }),
        signal: AbortSignal.timeout(15_000)
      });
    } catch (cause) {
      logger.error({ error: cause }, 'Resend invitation request could not reach the provider');
      throw new AppError({ message: 'The invitation email provider could not be reached. Please try again.', code: ERROR_CODES.INTEGRATION_UNAVAILABLE, statusCode: 502, cause });
    }
    if (!response.ok) {
      const providerResponse = await response.text();
      logger.error({ statusCode: response.status, providerResponse }, 'Resend invitation request was rejected');
      throw new AppError({ message: 'The invitation email could not be delivered.', code: ERROR_CODES.INTEGRATION_UNAVAILABLE, statusCode: 502 });
    }
    const payload = await response.json();
    return { delivery: 'SENT', providerMessageId: payload.id };
  }
  return {
    sendStaffInvitation({ recipientName, email, temporaryPassword, activationUrl, dashboardUrl, roleName, permissions }) {
      const name = escapeHtml(recipientName); const safeRole = escapeHtml(roleName); const safeEmail = escapeHtml(email); const safePassword = escapeHtml(temporaryPassword); const safeActivation = escapeHtml(activationUrl); const safeDashboard = escapeHtml(dashboardUrl);
      return send({
        to: email,
        subject: `Your CharityChain ${roleName} access`,
        text: `Hello ${recipientName},\n\nYou have been assigned the ${roleName} role in CharityChain.\n\nSign in: ${activationUrl}\nYour dashboard: ${dashboardUrl}\nEmail: ${email}\nTemporary password: ${temporaryPassword}\n\nChange your password and set up MFA immediately after signing in. Your access includes: ${permissions.join(', ')}.`,
        html: `<p>Hello ${name},</p><p>You have been assigned the <strong>${safeRole}</strong> role in CharityChain.</p><p><a href="${safeActivation}">Sign in to CharityChain</a></p><p><a href="${safeDashboard}">Open your assigned dashboard</a></p><p><strong>Email:</strong> ${safeEmail}<br/><strong>Temporary password:</strong> <code>${safePassword}</code></p><p>Change your password and set up MFA immediately after signing in.</p><p><strong>Assigned access:</strong> ${permissions.map(escapeHtml).join(', ')}</p>`
      });
    },
    sendAccessUpdate({ recipientName, email, addedRoles, removedRoles, permissions }) {
      const additions = addedRoles.length ? addedRoles.join(', ') : 'None';
      const removals = removedRoles.length ? removedRoles.join(', ') : 'None';
      return send({
        to: email,
        subject: 'Your CharityChain access has been updated',
        text: `Hello ${recipientName},\n\nA CharityChain administrator updated your access.\n\nPermissions added: ${additions}\nPermissions removed: ${removals}\nCurrent permissions: ${permissions.join(', ')}.`,
        html: `<p>Hello ${escapeHtml(recipientName)},</p><p>A CharityChain administrator updated your access.</p><p><strong>Permissions added:</strong> ${escapeHtml(additions)}<br/><strong>Permissions removed:</strong> ${escapeHtml(removals)}</p><p><strong>Current permissions:</strong> ${permissions.map(escapeHtml).join(', ')}</p>`
      });
    }
  };
}

export const resendEmailService = createResendEmailService();
