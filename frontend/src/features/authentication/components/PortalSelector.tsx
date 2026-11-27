import { useRef, useState, type KeyboardEvent } from 'react';
import { ArrowLeft, Check, GraduationCap, HandHeart, Landmark, Settings, type LucideIcon } from 'lucide-react';
import { PORTAL_ROLE_OPTIONS, type PortalRoleCode } from '../validation/auth.schema';

const ICONS: Record<PortalRoleCode, LucideIcon> = {
  STUDENT: GraduationCap,
  DONOR: HandHeart,
  ADMIN: Settings,
  SECRETARIAT: Landmark,
};

export interface PortalSelectorProps {
  role: PortalRoleCode;
  onChange: (role: PortalRoleCode) => void;
  idPrefix?: string;
  allowStaff?: boolean;
}

/**
 * Portal chooser with tab semantics. Student and Donor are the two primary
 * journeys; staff portals sit behind a quiet "Staff sign in" link.
 */
export function PortalSelector({ role, onChange, idPrefix = 'portal', allowStaff = true }: PortalSelectorProps) {
  const [staffMode, setStaffMode] = useState(
    () => PORTAL_ROLE_OPTIONS.find((option) => option.id === role)?.staff ?? false,
  );
  const listRef = useRef<HTMLDivElement | null>(null);
  const visible = PORTAL_ROLE_OPTIONS.filter((option) => option.staff === staffMode);

  const select = (id: PortalRoleCode) => onChange(id);

  const switchGroup = (toStaff: boolean) => {
    setStaffMode(toStaff);
    const first = PORTAL_ROLE_OPTIONS.find((option) => option.staff === toStaff);
    if (first) select(first.id);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const index = visible.findIndex((option) => option.id === role);
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % visible.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + visible.length) % visible.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = visible.length - 1;
    select(visible[next].id);
    listRef.current?.querySelectorAll<HTMLElement>('[role="tab"]')[next]?.focus();
  };

  return (
    <div className="cc-portal-wrap">
      <div
        ref={listRef}
        className={`cc-portal${staffMode ? ' cc-portal--staff' : ''}`}
        role="tablist"
        aria-label="Choose your portal"
        onKeyDown={onKeyDown}
      >
        {visible.map((option) => {
          const Icon = ICONS[option.id];
          const selected = role === option.id;
          return (
            <button
              key={option.id}
              id={`${idPrefix}-tab-${option.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${idPrefix}-panel`}
              aria-label={option.label}
              aria-describedby={`${idPrefix}-desc-${option.id}`}
              tabIndex={selected ? 0 : -1}
              className={`cc-portal__card${selected ? ' is-selected' : ''}`}
              onClick={() => select(option.id)}
            >
              <span className="cc-portal__icon" aria-hidden="true">
                <Icon size={staffMode ? 18 : 22} strokeWidth={1.75} />
              </span>
              <span className="cc-portal__label" aria-hidden="true">
                {option.label}
              </span>
              <span className="cc-portal__desc" id={`${idPrefix}-desc-${option.id}`}>
                {option.description}
              </span>
              {selected && (
                <span className="cc-portal__check" aria-hidden="true">
                  <Check size={14} strokeWidth={2.5} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      {staffMode ? (
        <button type="button" className="cc-textlink" onClick={() => switchGroup(false)}>
          <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
          Back to Student and Donor
        </button>
      ) : (
        allowStaff && (
          <button type="button" className="cc-textlink" onClick={() => switchGroup(true)}>
            Staff sign in
          </button>
        )
      )}
    </div>
  );
}
