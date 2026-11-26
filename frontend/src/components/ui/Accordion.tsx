import { useId, useState, type ComponentType } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Highlight } from './Highlight';

export interface AccordionItem {
  id: string;
  title: string;
  body: string;
  icon?: ComponentType<{ size?: number; strokeWidth?: number }>;
}

export interface AccordionProps {
  items: AccordionItem[];
  defaultOpenAll?: boolean;
  query?: string;
}

/**
 * Accessible accordion. Items are collapsed by default; set `defaultOpenAll`
 * to start expanded (for example while searching). Remount with a new `key`
 * when the default should reset.
 */
export function Accordion({ items, defaultOpenAll = false, query = '' }: AccordionProps) {
  const baseId = useId();
  const [toggled, setToggled] = useState<Set<string>>(() => new Set());

  const toggle = (id: string) =>
    setToggled((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="cc-acc">
      {items.map((item) => {
        const open = toggled.has(item.id) !== defaultOpenAll;
        const buttonId = `${baseId}-${item.id}-button`;
        const panelId = `${baseId}-${item.id}-panel`;
        const Icon = item.icon;
        return (
          <div className={`cc-acc__item${open ? ' is-open' : ''}`} key={item.id}>
            <h3 className="cc-acc__heading">
              <button
                type="button"
                id={buttonId}
                className="cc-acc__trigger"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
              >
                {Icon && (
                  <span className="cc-acc__icon" aria-hidden="true">
                    <Icon size={18} strokeWidth={1.75} />
                  </span>
                )}
                <span className="cc-acc__q">
                  <Highlight text={item.title} query={query} />
                </span>
                <span className="cc-acc__chevron" aria-hidden="true">
                  {open ? (
                    <Minus size={18} strokeWidth={1.75} />
                  ) : (
                    <Plus size={18} strokeWidth={1.75} />
                  )}
                </span>
              </button>
            </h3>
            <div className="cc-acc__panel" id={panelId} role="region" aria-labelledby={buttonId}>
              <div className="cc-acc__panel-inner">
                <p className="cc-acc__a">
                  <Highlight text={item.body} query={query} />
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
