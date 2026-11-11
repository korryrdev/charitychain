import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { VettingFactors } from '../components/VettingFactors.jsx';

describe('vetting presentation', () => {
  it('shows factor explanations and points without exposing a raw university record', () => {
    const html = renderToStaticMarkup(createElement(VettingFactors, { factors: [{ factor: 'MICRO_PAYMENTS', outcome: 'MATCHED', points: '40', maximumPoints: '40', explanation: 'Irregular payments were found.' }] }));
    expect(html).toContain('Payment pattern');
    expect(html).toContain('40');
    expect(html).not.toContain('registrationNumber');
  });
});
