import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { GlobalSearch } from '../../../components/navigation/GlobalSearch';
import { HelpFab } from '../../../components/navigation/HelpFab';
import { FaqPage } from '../../../pages/public/FaqPage';
import { HelpPage } from '../../../pages/public/HelpPage';
import { searchEverything } from '../helpData';

afterEach(() => {
  cleanup();
});

describe('search, FAQ, and contextual help', () => {
  it('filters global search results by role permissions, FAQ content, and tracking codes', () => {
    const publicResults = searchEverything('admin', null);
    expect(publicResults.pages.some((page) => page.to === '/admin')).toBe(false);

    const studentSession = { roles: ['STUDENT'], permissions: ['application:create'] };
    const studentResults = searchEverything('student', studentSession);
    expect(studentResults.pages.some((page) => page.to === '/student')).toBe(true);
    expect(studentResults.faqs.length).toBeGreaterThan(0);

    const trackingResults = searchEverything('MAL-ABCDEF123456', null);
    expect(trackingResults.trackingMatch).toBe('MAL-ABCDEF123456');
  });

  it('opens GlobalSearch on click and Ctrl+K and closes on Escape', () => {
    render(
      <MemoryRouter>
        <GlobalSearch session={null} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Quick search' }));
    expect(screen.getByRole('dialog', { name: 'Global search' })).toBeInTheDocument();

    const input = screen.getByLabelText('Search pages, FAQs, guides, or tracking ID');
    fireEvent.change(input, { target: { value: 'MAL-ABCDEF123456' } });
    expect(screen.getByText('Track receipt MAL-ABCDEF123456')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Global search' })).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(screen.getByRole('dialog', { name: 'Global search' })).toBeInTheDocument();
  });

  it('shows route-aware guidance inside ContextualHelpDrawer', () => {
    render(
      <MemoryRouter initialEntries={['/auth/login']}>
        <HelpFab />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open screen help' }));
    expect(screen.getByRole('dialog', { name: 'Contextual help' })).toBeInTheDocument();
    expect(screen.getByText('Signing in to CharityChain')).toBeInTheDocument();
    expect(screen.getByText(/name123456@students\.must\.ac\.ke/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'FAQ' })).toHaveAttribute('href', '/faq');
    expect(screen.getByRole('link', { name: 'Help center' })).toHaveAttribute('href', '/help');
  });

  it('filters FaqPage by category and search input', async () => {
    render(
      <MemoryRouter initialEntries={['/faq']}>
        <FaqPage />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('button', { name: /Does CharityChain hold money in smart contracts\?/i })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Students & applications' }));
    expect(
      screen.queryByRole('button', { name: /Does CharityChain hold money in smart contracts\?/i })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /Why must students sign up and log in with name123456@students\.must\.ac\.ke\?/i
      })
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Search FAQs'), { target: { value: 'Need Index' } });
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /How is student financial need assessed\?/i })
      ).toBeInTheDocument()
    );
  });

  it('filters HelpPage by role filter and search query', async () => {
    render(
      <MemoryRouter initialEntries={['/help']}>
        <HelpPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Student' }));
    expect(screen.getByText('Student support & assistance applications')).toBeInTheDocument();
    expect(
      screen.queryByText('Vetting review and two-of-three approvals')
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Search help guides'), {
      target: { value: 'discrepancy' }
    });
    await waitFor(() =>
      expect(
        screen.getByRole('button', {
          name: /University fee balance or aid record is inaccurate/i
        })
      ).toBeInTheDocument()
    );
  });
});
