import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CircleHelp, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import { getContextualHelp } from '../../features/help/helpData.js';
import { useOverlay } from '../../hooks/useOverlay.js';

/** Controlled right-hand drawer describing the current screen. */
export function ContextualHelpDrawer({ open, onClose, pathname = '/' }) {
  const panelRef = useRef(null);
  const [feedback, setFeedback] = useState(null);
  useOverlay(panelRef, open, onClose);

  if (!open) return null;
  const help = getContextualHelp(pathname);

  return (
    <div className="cc-overlay cc-overlay--end" onMouseDown={onClose}>
      <aside
        ref={panelRef}
        className="cc-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Contextual help"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="cc-drawer__header">
          <span className="cc-drawer__badge" aria-hidden="true">
            <CircleHelp size={20} strokeWidth={1.75} />
          </span>
          <div>
            <p className="cc-eyebrow">Help for this screen</p>
            <h2 className="cc-drawer__title">{help.title}</h2>
          </div>
          <button type="button" className="cc-icon-btn" aria-label="Close help" data-autofocus onClick={onClose}>
            <X size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </header>

        <div className="cc-drawer__body">
          <p className="cc-callout">{help.summary}</p>

          <section>
            <h3 className="cc-drawer__heading">What to do here</h3>
            <ol className="cc-steps">
              {help.steps.map((step, index) => (
                <li key={step}>
                  <span className="cc-steps__num" aria-hidden="true">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>

          {help.links?.length > 0 && (
            <section>
              <h3 className="cc-drawer__heading">Related</h3>
              <ul className="cc-linklist">
                {help.links.map((item) => (
                  <li key={item.to}>
                    <Link to={item.to} onClick={onClose}>
                      <span>{item.label}</span>
                      <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="cc-feedback" aria-label="Was this helpful?">
            <span>Was this helpful?</span>
            {feedback ? (
              <span role="status" className="cc-feedback__thanks">
                Thanks for the feedback.
              </span>
            ) : (
              <span className="cc-feedback__buttons">
                <button type="button" className="cc-icon-btn" aria-label="Yes, helpful" onClick={() => setFeedback('up')}>
                  <ThumbsUp size={16} strokeWidth={1.75} aria-hidden="true" />
                </button>
                <button type="button" className="cc-icon-btn" aria-label="No, not helpful" onClick={() => setFeedback('down')}>
                  <ThumbsDown size={16} strokeWidth={1.75} aria-hidden="true" />
                </button>
              </span>
            )}
          </section>
        </div>

        <footer className="cc-drawer__footer">
          <Link className="cc-btn cc-btn--primary cc-btn--block" to="/contact" onClick={onClose}>
            Contact support
          </Link>
          <div className="cc-drawer__links">
            <Link to="/help" onClick={onClose}>
              Help center
            </Link>
            <Link to="/faq" onClick={onClose}>
              FAQ
            </Link>
            <Link to="/complaints" onClick={onClose}>
              Complaints &amp; appeals
            </Link>
            <Link to="/report-fraud" onClick={onClose}>
              Report fraud
            </Link>
          </div>
        </footer>
      </aside>
    </div>
  );
}
