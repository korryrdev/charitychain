import { env } from '../../config/environment.js';
import { AppError } from '../../errors/AppError.js';
import { ERROR_CODES } from '../../errors/errorCodes.js';
import { logger } from '../../observability/logger.js';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_ATTEMPTS = 2;

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function layout({ appName, heading, paragraphs, button, footer }) {
  const body = paragraphs.map((paragraph) => `<p style="margin:0 0 16px;line-height:1.55">${paragraph}</p>`).join('');
  const cta = button
    ? `<p style="margin:24px 0"><a href="${escapeHtml(button.url)}" style="background:#047857;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;display:inline-block">${escapeHtml(button.label)}</a></p><p style="margin:0 0 16px;font-size:13px;color:#555">If the button does not work, copy this link into your browser:<br/><span style="word-break:break-all">${escapeHtml(button.url)}</span></p>`
    : '';
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1f2937"><h2 style="margin:0 0 20px;color:#065f46">${escapeHtml(heading)}</h2>${body}${cta}<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/><p style="margin:0;font-size:12px;color:#6b7280">${footer ?? `You are receiving this email because of activity on ${escapeHtml(appName)}.`}</p></div>`;
}

export function createResendEmailService({
  environment = env,
  fetchImpl = fetch,
  wait = sleep,
  log = logger
} = {}) {
  async function send({ to, subject, html, text, idempotencyKey, devLink }) {
    if (!environment.FEATURE_EMAIL_ENABLED || environment.NODE_ENV === 'test') {
      // Local development or test runner: surface the link in the server log without calling Resend.
      if (environment.NODE_ENV === 'development') {
        log.info({ to, subject, devLink }, 'Email delivery disabled; message not sent');
      }
      return { delivery: 'DEVELOPMENT_ONLY' };
    }
    let lastFailure;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      let response;
      try {
        response = await fetchImpl(RESEND_ENDPOINT, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${environment.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
            ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {})
          },
          body: JSON.stringify({ from: environment.EMAIL_FROM, to: [to], subject, html, text }),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
        });
      } catch (cause) {
        lastFailure = { cause, message: 'The email provider could not be reached.' };
        log.warn({ error: cause, attempt }, 'Resend request could not reach the provider');
        if (attempt < MAX_ATTEMPTS) await wait(400 * attempt);
        continue;
      }
      if (response.ok) {
        const payload = await response.json().catch(() => ({}));
        return { delivery: 'SENT', providerMessageId: payload.id };
      }
      const providerResponse = await response.text().catch(() => '');
      log.error({ statusCode: response.status, providerResponse, attempt }, 'Resend request was rejected');
      lastFailure = { message: 'The email could not be delivered.' };
      // Only transient provider conditions are worth retrying.
      if ((response.status >= 500 || response.status === 429) && attempt < MAX_ATTEMPTS) {
        await wait(400 * attempt);
        continue;
      }
      break;
    }
    throw new AppError({
      message: lastFailure?.message ?? 'The email could not be delivered.',
      code: ERROR_CODES.INTEGRATION_UNAVAILABLE,
      statusCode: 502,
      cause: lastFailure?.cause
    });
  }

  const appName = environment.APP_NAME ?? 'CharityChain';

  return {
    send,
    sendAccountVerification({ recipientName, email, verifyUrl, expiresInHours, idempotencyKey }) {
      const name = escapeHtml(recipientName ?? 'there');
      return send({
        to: email,
        subject: `Confirm your ${appName} email address`,
        idempotencyKey,
        devLink: verifyUrl,
        text: `Hello ${recipientName ?? 'there'},\n\nConfirm your email address to activate your ${appName} account:\n${verifyUrl}\n\nThis link expires in ${expiresInHours} hours and can be used once. If you did not create an account, you can ignore this email.`,
        html: layout({
          appName,
          heading: 'Confirm your email address',
          paragraphs: [
            `Hello ${name},`,
            `Thanks for signing up to ${escapeHtml(appName)}. Please confirm that this is your email address to activate your account.`,
            `This link expires in ${escapeHtml(expiresInHours)} hours and can be used once. If you did not create an account, you can safely ignore this email.`
          ],
          button: { label: 'Confirm my email', url: verifyUrl }
        })
      });
    },
    sendPasswordReset({ recipientName, email, resetUrl, expiresInMinutes, idempotencyKey }) {
      const name = escapeHtml(recipientName ?? 'there');
      return send({
        to: email,
        subject: `Reset your ${appName} password`,
        idempotencyKey,
        devLink: resetUrl,
        text: `Hello ${recipientName ?? 'there'},\n\nUse this link to choose a new password:\n${resetUrl}\n\nThe link expires in ${expiresInMinutes} minutes and can be used once. If you did not ask for this, ignore this email; your password has not changed.`,
        html: layout({
          appName,
          heading: 'Reset your password',
          paragraphs: [
            `Hello ${name},`,
            'We received a request to reset your password. Choose a new one using the button below.',
            `The link expires in ${escapeHtml(expiresInMinutes)} minutes and can be used once. If you did not ask for this, ignore this email; your password has not changed.`
          ],
          button: { label: 'Choose a new password', url: resetUrl }
        })
      });
    },
    sendAlreadyRegistered({ recipientName, email, loginUrl, resetUrl, idempotencyKey }) {
      const name = escapeHtml(recipientName ?? 'there');
      return send({
        to: email,
        subject: `Someone tried to register with your ${appName} email`,
        idempotencyKey,
        devLink: loginUrl,
        text: `Hello ${recipientName ?? 'there'},\n\nSomeone tried to create a ${appName} account with this email address, but you already have one.\nSign in: ${loginUrl}\nForgot your password? ${resetUrl}\n\nIf this was not you, no action is needed.`,
        html: layout({
          appName,
          heading: 'You already have an account',
          paragraphs: [
            `Hello ${name},`,
            `Someone tried to create a ${escapeHtml(appName)} account with this email address, but you already have one.`,
            `<a href="${escapeHtml(resetUrl)}">Forgot your password?</a> If this was not you, no action is needed.`
          ],
          button: { label: 'Sign in', url: loginUrl }
        })
      });
    },
    sendStaffInvitation({ recipientName, email, temporaryPassword, activationUrl, dashboardUrl, roleName, permissions, temporaryPasswordExpiresInHours }) {
      const name = escapeHtml(recipientName); const safeRole = escapeHtml(roleName); const safeEmail = escapeHtml(email); const safePassword = escapeHtml(temporaryPassword);
      const expiry = temporaryPasswordExpiresInHours ?? 72;
      return send({
        to: email,
        subject: `Your CharityChain ${roleName} access`,
        devLink: activationUrl,
        text: `Hello ${recipientName},\n\nYou have been assigned the ${roleName} role in CharityChain.\n\nSign in: ${activationUrl}\nEmail: ${email}\nTemporary password: ${temporaryPassword}\n\nThis temporary password works for the first sign-in only and expires in ${expiry} hours. You will be asked to choose your own password before you can do anything else and, for administrative and committee roles, to set up multi-factor authentication. Your access includes: ${permissions.join(', ')}.\nYour dashboard after setup: ${dashboardUrl}`,
        html: layout({
          appName,
          heading: 'Your CharityChain access',
          paragraphs: [
            `Hello ${name},`,
            `You have been assigned the <strong>${safeRole}</strong> role in ${escapeHtml(appName)}.`,
            `<strong>Email:</strong> ${safeEmail}<br/><strong>Temporary password:</strong> <code>${safePassword}</code>`,
            `This temporary password is for your first sign-in only and expires in ${escapeHtml(expiry)} hours. You will be asked to choose your own password before you can do anything else and, for administrative and committee roles, to set up multi-factor authentication.`,
            `<strong>Assigned access:</strong> ${permissions.map(escapeHtml).join(', ')}`
          ],
          button: { label: 'Sign in to CharityChain', url: activationUrl }
        })
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
