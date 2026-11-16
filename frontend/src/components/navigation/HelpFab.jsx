import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CircleHelp } from 'lucide-react';
import { ContextualHelpDrawer } from './ContextualHelpDrawer.jsx';

/** Floating "?" button that opens the contextual help drawer for the current route. */
export function HelpFab() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="cc-fab"
        aria-label="Open screen help"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <CircleHelp size={24} strokeWidth={1.75} aria-hidden="true" />
      </button>
      <ContextualHelpDrawer open={open} onClose={() => setOpen(false)} pathname={pathname} />
    </>
  );
}
