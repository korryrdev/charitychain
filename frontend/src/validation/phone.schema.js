export function validateKenyanPhone(value) { const phone = String(value ?? '').replace(/[\s-]/g, ''); return /^254[17]\d{8}$/.test(phone) ? null : 'Use a Kenyan number in 2547XXXXXXXX format.'; }
