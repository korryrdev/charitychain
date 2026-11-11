'use strict';

const templates = Object.freeze({
  DONATION_STATUS: { title: 'Donation update', body: 'Your donation {{reference}} is now {{status}}.' },
  APPLICATION_STATUS: { title: 'Application update', body: 'Your assistance application {{reference}} is now {{status}}.' },
  APPROVAL_STATUS: { title: 'Approval update', body: 'Application {{reference}} has an approval update: {{status}}.' },
  DISBURSEMENT_STATUS: { title: 'Disbursement update', body: 'Disbursement {{reference}} is now {{status}}.' },
  GOODS_COLLECTION_STATUS: { title: 'Goods collection update', body: 'Goods collection {{reference}} is now {{status}}.' },
  SECURITY_ALERT: { title: 'Security alert', body: '{{message}}' }
});
const render = (text, variables) => text.replace(/{{([a-zA-Z0-9_]+)}}/g, (_match, key) => String(variables[key] ?? ''));
export const notificationTemplateService = Object.freeze({ render(code, variables = {}) { const template = templates[code]; if (!template) throw new TypeError('Unsupported notification template.'); return { title: render(template.title, variables).slice(0, 200), body: render(template.body, variables).slice(0, 1000) }; } });
