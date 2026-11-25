import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppProviders } from './providers.jsx';
import { AppRouter } from './router.jsx';
import { StartupGate } from './StartupGate.jsx';
import { createQueryClient } from './queryClient.js';

describe('application bootstrap', () => {
  it('deduplicates an in-flight query and serves its cached result', async () => {
    const client = createQueryClient(); let calls = 0;
    await expect(Promise.all([client.fetch('session', async () => { calls += 1; return 'ready'; }), client.fetch('session', async () => { calls += 1; return 'ready'; })])).resolves.toEqual(['ready', 'ready']);
    expect(calls).toBe(1);
  });
  it('restores startup state and mounts configured routes', async () => {
    render(<MemoryRouter initialEntries={['/health']}><AppProviders sessionLoader={async () => null}><StartupGate><AppRouter /></StartupGate></AppProviders></MemoryRouter>);
    expect(await screen.findByLabelText('frontend health')).toHaveTextContent('ok');
  });
});
