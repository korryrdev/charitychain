import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ApprovalProgress } from '../components/ApprovalProgress.jsx';
describe('approval progress', () => { it('shows the configured approval threshold', () => { const html = renderToStaticMarkup(createElement(ApprovalProgress, { round: { sequence: 1, approvals: 2, declines: 0, threshold: 2, status: 'OPEN' } })); expect(html).toContain('2 of 2 approvals'); }); });
