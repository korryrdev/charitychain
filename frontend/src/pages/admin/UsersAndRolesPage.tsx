import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import {
  Check,
  ChevronRight,
  Plus,
  Search,
  Shield,
  ShieldAlert,
  UserPlus,
  X,
} from 'lucide-react';
import { adminApi } from '../../features/administration/services/admin.api';
import {
  ALL_PERMISSIONS,
  PERMISSION_GROUPS,
  roleCodeFromName,
} from '../../features/administration/permissionCatalog';
import { getErrorMessage } from '../../services/errorMapper';

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  status: string;
  twoFactorEnabled: boolean;
  roles: string[];
  permissions: string[];
}

interface ExistingRole {
  code: string;
  permissions?: unknown[];
  _count?: {
    users?: number;
  };
}

type PageTab = 'people' | 'roles';
type StatusFilter = 'ALL' | 'ACTIVE' | 'SUSPENDED';
type InviteMode = 'standard' | 'custom';

const FALLBACK_STAFF_ROLES = [
  'CLERK',
  'COMMITTEE_MEMBER',
  'FINANCE_OPERATOR',
  'AUDITOR',
  'TREASURER',
  'INVENTORY_SUPERVISOR',
  'PHARMACY_CUSTODIAN',
  'SIGNATORY',
  'SUBGROUP_REP',
  'ADMINISTRATOR',
] as const;

const displayRole = (code: string): string => {
  const name = code
    .replace(/^CUSTOM_/, '')
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter: string) => letter.toUpperCase());
  return code.startsWith('CUSTOM_') ? `${name} (Custom)` : name;
};

interface PermissionGroupListProps {
  selectedCodes: string[];
  filter: string;
  onToggle: (code: string) => void;
  onToggleGroup: (codes: string[]) => void;
}

function PermissionGroupList({
  selectedCodes,
  filter,
  onToggle,
  onToggleGroup,
}: PermissionGroupListProps) {
  const selectedSet = useMemo(() => new Set(selectedCodes), [selectedCodes]);
  const query = filter.trim().toLowerCase();

  const groups = useMemo(
    () =>
      PERMISSION_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter(
          ([code, label]) =>
            !query ||
            label.toLowerCase().includes(query) ||
            code.toLowerCase().includes(query) ||
            group.title.toLowerCase().includes(query)
        ),
      })).filter((group) => group.items.length > 0),
    [query]
  );

  if (groups.length === 0) {
    return <p className="cc-access-empty">No capabilities match &ldquo;{filter.trim()}&rdquo;.</p>;
  }

  return (
    <div className="cc-perm-accordion">
      {groups.map((group) => {
        const groupCodes = group.items.map(([code]) => code);
        const selectedCount = groupCodes.filter((code) => selectedSet.has(code)).length;
        const allSelected = selectedCount === groupCodes.length;

        return (
          <details className="cc-perm-group" key={group.id} open={query.length > 0}>
            <summary className="cc-perm-group__summary">
              <span className="cc-perm-group__title">
                <ChevronRight size={16} className="cc-perm-group__chevron" aria-hidden="true" />
                <span>{group.title}</span>
              </span>
              <span className="cc-perm-group__meta">
                <span className="cc-perm-group__count">
                  {selectedCount}/{group.items.length}
                </span>
                <button
                  type="button"
                  className="cc-textlink cc-perm-group__toggle"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onToggleGroup(groupCodes);
                  }}
                >
                  {allSelected ? 'Clear' : 'Select all'}
                </button>
              </span>
            </summary>

            <div className="cc-perm-group__items">
              {group.items.map(([code, label]) => (
                <label className="cc-perm-check" key={code} title={code}>
                  <input
                    type="checkbox"
                    checked={selectedSet.has(code)}
                    onChange={() => onToggle(code)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </details>
        );
      })}
    </div>
  );
}

export function UsersAndRolesPage() {
  const baseId = useId();
  const peopleTabId = `${baseId}-tab-people`;
  const rolesTabId = `${baseId}-tab-roles`;
  const peoplePanelId = `${baseId}-panel-people`;
  const rolesPanelId = `${baseId}-panel-roles`;
  const inviteHeadingId = `${baseId}-invite-title`;
  const manageHeadingId = `${baseId}-manage-title`;
  const deleteHeadingId = `${baseId}-delete-title`;

  const peopleTabRef = useRef<HTMLButtonElement>(null);
  const rolesTabRef = useRef<HTMLButtonElement>(null);

  const [activeTab, setActiveTab] = useState<PageTab>('people');
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [existingRoles, setExistingRoles] = useState<ExistingRole[]>([]);
  const [loading, setLoading] = useState(true);

  const [peopleSearch, setPeopleSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Invite staff drawer state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteMode, setInviteMode] = useState<InviteMode>('standard');
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedStaffRoles, setSelectedStaffRoles] = useState<string[]>([]);
  const [customRoleName, setCustomRoleName] = useState('');
  const [customRoleNotes, setCustomRoleNotes] = useState('');
  const [customPermissions, setCustomPermissions] = useState<string[]>([]);
  const [invitePermFilter, setInvitePermFilter] = useState('');
  const [invitePending, setInvitePending] = useState(false);

  // Manage user permissions drawer state
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [editedPermissions, setEditedPermissions] = useState<string[]>([]);
  const [managePermFilter, setManagePermFilter] = useState('');
  const [savingRoles, setSavingRoles] = useState(false);

  // Delete confirmation modal state
  const [deletingUser, setDeletingUser] = useState<ManagedUser | null>(null);
  const [deletingPending, setDeletingPending] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const result = await adminApi.users();
      setUsers((result.items ?? []) as ManagedUser[]);
      try {
        const roles = await adminApi.roles();
        setExistingRoles((roles.roles ?? []) as ExistingRole[]);
      } catch {
        setExistingRoles([]);
      }
      setError(null);
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, 'Failed to load accounts.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const result = await adminApi.users();
        if (!active) return;
        setUsers((result.items ?? []) as ManagedUser[]);
        try {
          const roles = await adminApi.roles();
          if (active) setExistingRoles((roles.roles ?? []) as ExistingRole[]);
        } catch {
          if (active) setExistingRoles([]);
        }
        if (active) setError(null);
      } catch (cause: unknown) {
        if (active) setError(getErrorMessage(cause, 'Failed to load accounts.'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!inviteOpen && !editingUser && !deletingUser) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (deletingUser && !deletingPending) setDeletingUser(null);
        else if (editingUser && !savingRoles) setEditingUser(null);
        else if (inviteOpen && !invitePending) setInviteOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [inviteOpen, invitePending, editingUser, savingRoles, deletingUser, deletingPending]);

  const assignableStaffRoles = useMemo(() => {
    const fromApi = existingRoles
      .map((role) => role.code)
      .filter((code) => !['STUDENT', 'DONOR', 'SYSTEM_ADMIN'].includes(code));
    if (fromApi.length > 0) return fromApi;
    return [...FALLBACK_STAFF_ROLES];
  }, [existingRoles]);

  const filteredUsers = useMemo(() => {
    const query = peopleSearch.trim().toLowerCase();
    return users.filter((user) => {
      if (statusFilter !== 'ALL' && user.status !== statusFilter) return false;
      if (!query) return true;
      return (
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.roles.some((role) => displayRole(role).toLowerCase().includes(query))
      );
    });
  }, [users, peopleSearch, statusFilter]);

  const derivedCode = roleCodeFromName(customRoleName);

  const switchTab = (next: PageTab) => {
    setActiveTab(next);
  };

  const handleTabKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const tabs: PageTab[] = ['people', 'roles'];
    const currentIndex = tabs.indexOf(activeTab);
    let nextTab: PageTab | null = null;

    if (event.key === 'ArrowRight') nextTab = tabs[(currentIndex + 1) % tabs.length];
    else if (event.key === 'ArrowLeft')
      nextTab = tabs[(currentIndex - 1 + tabs.length) % tabs.length];
    else if (event.key === 'Home') nextTab = tabs[0];
    else if (event.key === 'End') nextTab = tabs[tabs.length - 1];

    if (nextTab) {
      event.preventDefault();
      setActiveTab(nextTab);
      window.requestAnimationFrame(() => {
        if (nextTab === 'people') peopleTabRef.current?.focus();
        else rolesTabRef.current?.focus();
      });
    }
  };

  const openInviteDrawer = (mode: InviteMode = 'standard') => {
    setInviteMode(mode);
    setInviteName('');
    setInviteEmail('');
    setSelectedStaffRoles([]);
    setCustomRoleName('');
    setCustomRoleNotes('');
    setCustomPermissions([]);
    setInvitePermFilter('');
    setError(null);
    setInviteOpen(true);
  };

  const toggleStaffRole = (code: string) => {
    setSelectedStaffRoles((current) =>
      current.includes(code) ? current.filter((item) => item !== code) : [...current, code]
    );
  };

  const toggleCustomPermission = (code: string) => {
    setCustomPermissions((current) =>
      current.includes(code) ? current.filter((item) => item !== code) : [...current, code]
    );
  };

  const toggleCustomGroup = (codes: string[]) => {
    setCustomPermissions((current) => {
      const currentSet = new Set(current);
      const allSelected = codes.every((code) => currentSet.has(code));
      if (allSelected) {
        return current.filter((code) => !codes.includes(code));
      }
      return [...new Set([...current, ...codes])];
    });
  };

  const submitInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    const name = inviteName.trim();
    if (!name || !email) return;

    setInvitePending(true);
    setError(null);
    try {
      if (inviteMode === 'standard') {
        await adminApi.createStaff({
          name,
          email,
          roles: selectedStaffRoles,
        });
      } else {
        await adminApi.composeAndInvite({
          role: {
            code: derivedCode,
            name: customRoleName.trim(),
            description: customRoleNotes.trim() || undefined,
            permissions: customPermissions,
          },
          recipient: { name, email },
        });
      }
      setInviteOpen(false);
      setNotice(`Invitation sent to ${email}.`);
      await load();
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, 'Could not send invitation.'));
    } finally {
      setInvitePending(false);
    }
  };

  const changeStatus = async (user: ManagedUser) => {
    const nextStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      setError(null);
      await adminApi.setUserStatus(user.id, { status: nextStatus });
      setNotice(
        nextStatus === 'SUSPENDED'
          ? `${user.name} has been suspended.`
          : `${user.name} is now active.`
      );
      await load();
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, 'Failed to update account status.'));
    }
  };

  const confirmDeleteUser = async () => {
    if (!deletingUser) return;
    setDeletingPending(true);
    try {
      setError(null);
      const removedName = deletingUser.name;
      await adminApi.deleteUser(deletingUser.id);
      if (editingUser?.id === deletingUser.id) setEditingUser(null);
      setDeletingUser(null);
      setNotice(`${removedName} was removed.`);
      await load();
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, 'Failed to delete account.'));
    } finally {
      setDeletingPending(false);
    }
  };

  const openManageDrawer = (user: ManagedUser) => {
    setEditingUser(user);
    setEditedPermissions(user.permissions);
    setManagePermFilter('');
    setError(null);
  };

  const toggleManagedPermission = (code: string) => {
    setEditedPermissions((current) =>
      current.includes(code) ? current.filter((item) => item !== code) : [...current, code]
    );
  };

  const toggleManagedGroup = (codes: string[]) => {
    setEditedPermissions((current) => {
      const currentSet = new Set(current);
      const allSelected = codes.every((code) => currentSet.has(code));
      if (allSelected) {
        return current.filter((code) => !codes.includes(code));
      }
      return [...new Set([...current, ...codes])];
    });
  };

  const saveManagedPermissions = async () => {
    if (!editingUser) return;
    setSavingRoles(true);
    setError(null);
    try {
      await adminApi.replaceUserPermissions(editingUser.id, editedPermissions);
      const updatedName = editingUser.name;
      setEditingUser(null);
      setNotice(`Access updated for ${updatedName}.`);
      await load();
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, 'Failed to save permissions.'));
    } finally {
      setSavingRoles(false);
    }
  };

  const canSubmitInvite =
    inviteName.trim().length >= 2 &&
    inviteEmail.trim().length > 0 &&
    (inviteMode === 'standard'
      ? selectedStaffRoles.length > 0
      : Boolean(derivedCode) && customPermissions.length > 0);

  return (
    <main className="portal-page admin-page access-workspace">
      <header className="cc-access-header">
        <h1>Users &amp; roles</h1>
        <button
          type="button"
          className="cc-btn cc-btn--primary"
          onClick={() => openInviteDrawer('standard')}
        >
          <UserPlus size={16} strokeWidth={2} aria-hidden="true" />
          <span>Invite staff</span>
        </button>
      </header>

      {error && (
        <div className="cc-notice cc-notice--danger cc-access-banner" role="alert">
          <ShieldAlert size={18} aria-hidden="true" />
          <p>{error}</p>
          <button
            type="button"
            className="cc-icon-btn cc-access-banner__close"
            aria-label="Dismiss error"
            onClick={() => setError(null)}
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>
      )}

      {notice && (
        <div className="cc-notice cc-notice--success cc-access-banner" role="status">
          <Check size={18} aria-hidden="true" />
          <p>{notice}</p>
          <button
            type="button"
            className="cc-icon-btn cc-access-banner__close"
            aria-label="Dismiss message"
            onClick={() => setNotice(null)}
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>
      )}

      <div
        role="tablist"
        aria-label="Users and roles"
        className="cc-tabs"
        onKeyDown={handleTabKeyDown}
      >
        <button
          ref={peopleTabRef}
          id={peopleTabId}
          type="button"
          role="tab"
          aria-selected={activeTab === 'people'}
          tabIndex={activeTab === 'people' ? 0 : -1}
          className="cc-tab"
          onClick={() => switchTab('people')}
        >
          <span>People</span>
          <span className="cc-tab__count">{users.length}</span>
        </button>
        <button
          ref={rolesTabRef}
          id={rolesTabId}
          type="button"
          role="tab"
          aria-selected={activeTab === 'roles'}
          tabIndex={activeTab === 'roles' ? 0 : -1}
          className="cc-tab"
          onClick={() => switchTab('roles')}
        >
          <span>Roles</span>
          <span className="cc-tab__count">{existingRoles.length}</span>
        </button>
      </div>

      <div role="tabpanel" id={peoplePanelId} aria-labelledby={peopleTabId} hidden={activeTab !== 'people'}>
        <div className="cc-access-panel">
          <div className="cc-access-toolbar">
            <label className="cc-access-search">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                aria-label="Search accounts"
                value={peopleSearch}
                onChange={(event) => setPeopleSearch(event.target.value)}
                placeholder="Search by name, email, or role…"
              />
            </label>
            <div className="cc-filter-pills" role="group" aria-label="Filter by status">
              {(['ALL', 'ACTIVE', 'SUSPENDED'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  aria-pressed={statusFilter === status}
                  className={`cc-chip${statusFilter === status ? ' is-selected' : ''}`}
                  onClick={() => setStatusFilter(status)}
                >
                  {status === 'ALL' ? 'All' : status === 'ACTIVE' ? 'Active' : 'Suspended'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="cc-muted">Loading accounts…</p>
          ) : filteredUsers.length === 0 ? (
            <div className="cc-empty">
              <p className="cc-empty__title">No matching accounts</p>
              <p className="cc-empty__hint">
                {peopleSearch || statusFilter !== 'ALL'
                  ? 'Try clearing your search or status filter.'
                  : 'Invite a staff member to get started.'}
              </p>
            </div>
          ) : (
            <div tabIndex={0} role="region" aria-labelledby={peopleTabId} className="cc-table-wrap">
              <table className="cc-users-table">
                <thead>
                  <tr>
                    <th scope="col">Person</th>
                    <th scope="col">Role</th>
                    <th scope="col">Status</th>
                    <th scope="col">MFA</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <th scope="row" className="cc-person-cell">
                        <span className="cc-person-avatar" aria-hidden="true">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                        <span>
                          <strong>{user.name}</strong>
                          <span className="cc-person-email">{user.email}</span>
                        </span>
                      </th>
                      <td data-label="Role">
                        <div className="cc-role-chips">
                          {user.roles.length
                            ? user.roles.map((role) => (
                                <span className="cc-role-badge" key={role}>
                                  {displayRole(role)}
                                </span>
                              ))
                            : '—'}
                        </div>
                      </td>
                      <td data-label="Status">
                        <span
                          className={`cc-status-pill cc-status-pill--${user.status.toLowerCase()}`}
                        >
                          <span className="cc-status-pill__dot" aria-hidden="true" />
                          <span>
                            {user.status === 'ACTIVE'
                              ? 'Active'
                              : user.status === 'SUSPENDED'
                                ? 'Suspended'
                                : user.status.replaceAll('_', ' ')}
                          </span>
                        </span>
                      </td>
                      <td data-label="MFA">
                        <span
                          className={`cc-mfa-label${user.twoFactorEnabled ? ' is-on' : ''}`}
                        >
                          {user.twoFactorEnabled ? 'On' : 'Off'}
                        </span>
                      </td>
                      <td data-label="Actions">
                        <div className="cc-row-actions">
                          <button
                            type="button"
                            className="cc-btn cc-btn--secondary cc-btn--sm"
                            onClick={() => openManageDrawer(user)}
                          >
                            Manage
                          </button>
                          <button
                            type="button"
                            className="cc-btn cc-btn--ghost cc-btn--sm"
                            onClick={() => changeStatus(user)}
                          >
                            {user.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                          </button>
                          <button
                            type="button"
                            className="cc-btn cc-btn--ghost cc-btn--sm cc-btn--danger-text"
                            onClick={() => setDeletingUser(user)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div role="tabpanel" id={rolesPanelId} aria-labelledby={rolesTabId} hidden={activeTab !== 'roles'}>
        <div className="cc-access-panel">
          <div className="cc-roles-bar">
            <span className="cc-muted">{existingRoles.length} configured roles</span>
            <button
              type="button"
              className="cc-btn cc-btn--secondary cc-btn--sm"
              onClick={() => openInviteDrawer('custom')}
            >
              <Plus size={15} aria-hidden="true" />
              <span>New custom role</span>
            </button>
          </div>

          {existingRoles.length > 0 ? (
            <div className="cc-roles-grid">
              {existingRoles.map((role) => (
                <article className="cc-role-card" key={role.code}>
                  <div className="cc-role-card__head">
                    <Shield size={16} aria-hidden="true" />
                    <strong>{displayRole(role.code)}</strong>
                  </div>
                  <div className="cc-role-card__meta">
                    <span>{role._count?.users ?? 0} members</span>
                    <span>{role.permissions?.length ?? 0} permissions</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="cc-muted">No roles available.</p>
          )}
        </div>
      </div>

      {inviteOpen && (
        <div
          className="cc-drawer-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget && !invitePending) setInviteOpen(false);
          }}
        >
          <section
            className="cc-drawer-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={inviteHeadingId}
          >
            <header className="cc-drawer-panel__head">
              <h2 id={inviteHeadingId}>Invite staff</h2>
              <button
                type="button"
                className="cc-icon-btn"
                aria-label="Close invite panel"
                disabled={invitePending}
                onClick={() => setInviteOpen(false)}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>

            <form className="cc-drawer-form" onSubmit={submitInvite}>
              <div className="cc-drawer-body">
                <div className="cc-segmented" role="group" aria-label="Role type">
                  <button
                    type="button"
                    aria-pressed={inviteMode === 'standard'}
                    className={inviteMode === 'standard' ? 'is-active' : ''}
                    onClick={() => setInviteMode('standard')}
                  >
                    Standard role
                  </button>
                  <button
                    type="button"
                    aria-pressed={inviteMode === 'custom'}
                    className={inviteMode === 'custom' ? 'is-active' : ''}
                    onClick={() => setInviteMode('custom')}
                  >
                    Custom role
                  </button>
                </div>

                <div className="cc-drawer-field">
                  <label htmlFor={`${baseId}-invite-name`}>Full name</label>
                  <input
                    id={`${baseId}-invite-name`}
                    value={inviteName}
                    onChange={(event) => setInviteName(event.target.value)}
                    placeholder="Jane Wanjiku"
                    required
                  />
                </div>

                <div className="cc-drawer-field">
                  <label htmlFor={`${baseId}-invite-email`}>Email</label>
                  <input
                    id={`${baseId}-invite-email`}
                    type="email"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={inviteEmail}
                    onChange={(event) => setInviteEmail(event.target.value)}
                    placeholder="name@charitychain.org"
                    required
                  />
                </div>

                {inviteMode === 'standard' ? (
                  <fieldset className="cc-drawer-fieldset">
                    <legend>Assign roles</legend>
                    <div className="cc-role-picker-grid">
                      {assignableStaffRoles.map((code) => (
                        <label className="cc-role-pick" key={code}>
                          <input
                            type="checkbox"
                            checked={selectedStaffRoles.includes(code)}
                            onChange={() => toggleStaffRole(code)}
                          />
                          <span>{displayRole(code)}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ) : (
                  <>
                    <div className="cc-drawer-field">
                      <div className="cc-drawer-field__head">
                        <label htmlFor={`${baseId}-custom-role`}>Role name</label>
                        {derivedCode && <code className="cc-code-tag">{derivedCode}</code>}
                      </div>
                      <input
                        id={`${baseId}-custom-role`}
                        value={customRoleName}
                        onChange={(event) => setCustomRoleName(event.target.value)}
                        placeholder="Student Support Officer"
                        required
                      />
                    </div>

                    <div className="cc-drawer-field">
                      <label htmlFor={`${baseId}-custom-notes`}>Notes (optional)</label>
                      <input
                        id={`${baseId}-custom-notes`}
                        value={customRoleNotes}
                        onChange={(event) => setCustomRoleNotes(event.target.value)}
                        placeholder="Short note for the audit log"
                      />
                    </div>

                    <div className="cc-drawer-field">
                      <div className="cc-drawer-field__head">
                        <label htmlFor={`${baseId}-invite-perm-search`}>Capabilities</label>
                        <span className="cc-muted-count">
                          {customPermissions.length} of {ALL_PERMISSIONS.length}
                        </span>
                      </div>
                      <label className="cc-access-search">
                        <Search size={15} aria-hidden="true" />
                        <input
                          id={`${baseId}-invite-perm-search`}
                          type="search"
                          value={invitePermFilter}
                          onChange={(event) => setInvitePermFilter(event.target.value)}
                          placeholder="Filter capabilities…"
                        />
                      </label>
                      <PermissionGroupList
                        selectedCodes={customPermissions}
                        filter={invitePermFilter}
                        onToggle={toggleCustomPermission}
                        onToggleGroup={toggleCustomGroup}
                      />
                    </div>
                  </>
                )}
              </div>

              <footer className="cc-drawer-panel__foot">
                <button
                  type="button"
                  className="cc-btn cc-btn--secondary"
                  disabled={invitePending}
                  onClick={() => setInviteOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cc-btn cc-btn--primary"
                  disabled={invitePending || !canSubmitInvite}
                >
                  {invitePending ? 'Sending invite…' : 'Send invite'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {editingUser && (
        <div
          className="cc-drawer-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget && !savingRoles) setEditingUser(null);
          }}
        >
          <section
            className="cc-drawer-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={manageHeadingId}
          >
            <header className="cc-drawer-panel__head">
              <div>
                <h2 id={manageHeadingId}>{editingUser.name}</h2>
                <p className="cc-drawer-sub">{editingUser.email}</p>
              </div>
              <button
                type="button"
                className="cc-icon-btn"
                aria-label="Close access panel"
                disabled={savingRoles}
                onClick={() => setEditingUser(null)}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>

            <div className="cc-drawer-body">
              <div className="cc-manage-meta">
                <div className="cc-role-chips">
                  {editingUser.roles.map((role) => (
                    <span className="cc-role-badge" key={role}>
                      {displayRole(role)}
                    </span>
                  ))}
                </div>
                <span className="cc-muted-count">{editedPermissions.length} selected</span>
              </div>

              <label className="cc-access-search">
                <Search size={15} aria-hidden="true" />
                <input
                  type="search"
                  aria-label="Filter capabilities"
                  value={managePermFilter}
                  onChange={(event) => setManagePermFilter(event.target.value)}
                  placeholder="Filter capabilities…"
                />
              </label>

              <PermissionGroupList
                selectedCodes={editedPermissions}
                filter={managePermFilter}
                onToggle={toggleManagedPermission}
                onToggleGroup={toggleManagedGroup}
              />
            </div>

            <footer className="cc-drawer-panel__foot">
              <button
                type="button"
                className="cc-btn cc-btn--secondary"
                disabled={savingRoles}
                onClick={() => setEditingUser(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="cc-btn cc-btn--primary"
                disabled={savingRoles || editedPermissions.length === 0}
                onClick={saveManagedPermissions}
              >
                {savingRoles ? 'Saving…' : 'Save changes'}
              </button>
            </footer>
          </section>
        </div>
      )}

      {deletingUser && (
        <div
          className="cc-confirm-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget && !deletingPending) setDeletingUser(null);
          }}
        >
          <section
            className="cc-confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={deleteHeadingId}
          >
            <h2 id={deleteHeadingId}>Delete {deletingUser.name}?</h2>
            <p>
              This permanently removes <strong>{deletingUser.email}</strong> and cannot be undone.
            </p>
            <div className="cc-confirm-dialog__actions">
              <button
                type="button"
                className="cc-btn cc-btn--secondary"
                disabled={deletingPending}
                onClick={() => setDeletingUser(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="cc-btn cc-btn--danger"
                disabled={deletingPending}
                onClick={confirmDeleteUser}
              >
                {deletingPending ? 'Deleting…' : 'Delete account'}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
