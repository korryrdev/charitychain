import { useEffect, useMemo, useState } from 'react';
import { adminApi } from '../../features/administration/services/admin.api.js';
import {
  ALL_PERMISSIONS,
  PERMISSION_GROUPS,
  roleCodeFromName
} from '../../features/administration/permissionCatalog.js';

const initialComposer = {
  roleName: '',
  description: '',
  permissions: [],
  recipientName: '',
  recipientEmail: ''
};
const displayRole = (code) => {
  const name = code
    .replace(/^CUSTOM_/, '')
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
  return code.startsWith('CUSTOM_') ? `Custom access: ${name}` : name;
};

export function UsersAndRolesPage() {
  const [composer, setComposer] = useState(initialComposer);
  const [users, setUsers] = useState([]);
  const [existingRoles, setExistingRoles] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editedPermissions, setEditedPermissions] = useState([]);
  const [savingRoles, setSavingRoles] = useState(false);
  const load = async () => {
    setLoading(true);
    try {
      const result = await adminApi.users();
      setUsers(result.items ?? []);
      try {
        const roles = await adminApi.roles();
        setExistingRoles(roles.roles ?? []);
      } catch {
        setExistingRoles([]);
      }
      setError(null);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const selected = new Set(composer.permissions);
  const visibleGroups = useMemo(
    () =>
      PERMISSION_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter(([code, label]) =>
          `${code} ${label}`.toLowerCase().includes(filter.toLowerCase())
        )
      })).filter((group) => group.items.length),
    [filter]
  );
  const derivedCode = roleCodeFromName(composer.roleName);
  const toggle = (code) =>
    setComposer((current) => ({
      ...current,
      permissions: current.permissions.includes(code)
        ? current.permissions.filter((item) => item !== code)
        : [...current.permissions, code]
    }));
  const toggleGroup = (items) => {
    const codes = items.map(([code]) => code);
    const everySelected = codes.every((code) => selected.has(code));
    setComposer((current) => ({
      ...current,
      permissions: everySelected
        ? current.permissions.filter((code) => !codes.includes(code))
        : [...new Set([...current.permissions, ...codes])]
    }));
  };
  const submit = async (event) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await adminApi.composeAndInvite({
        role: {
          code: derivedCode,
          name: composer.roleName.trim(),
          description: composer.description.trim() || undefined,
          permissions: composer.permissions
        },
        recipient: {
          name: composer.recipientName.trim(),
          email: composer.recipientEmail.trim().toLowerCase()
        }
      });
      setComposer(initialComposer);
      await load();
    } catch (cause) {
      setError(cause.message);
    } finally {
      setPending(false);
    }
  };
  const changeStatus = async (user) => {
    try {
      await adminApi.setUserStatus(user.id, {
        status: user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
      });
      await load();
    } catch (cause) {
      setError(cause.message);
    }
  };
  const deleteUser = async (user) => {
    if (!window.confirm(`Permanently delete ${user.name}'s account? This cannot be undone.`)) return;
    try {
      setError(null);
      await adminApi.deleteUser(user.id);
      if (editingUser?.id === user.id) setEditingUser(null);
      await load();
    } catch (cause) {
      setError(cause.message);
    }
  };
  const openRoleEditor = (user) => {
    setEditingUser(user);
    setEditedPermissions(user.permissions);
    setError(null);
  };
  const toggleUserPermission = (permissionCode) =>
    setEditedPermissions((current) =>
      current.includes(permissionCode)
        ? current.filter((code) => code !== permissionCode)
        : [...current, permissionCode]
    );
  const saveRoles = async () => {
    if (!editingUser) return;
    setSavingRoles(true);
    setError(null);
    try {
      await adminApi.replaceUserPermissions(editingUser.id, editedPermissions);
      setEditingUser(null);
      await load();
    } catch (cause) {
      setError(cause.message);
    } finally {
      setSavingRoles(false);
    }
  };
  return (
    <main className="portal-page admin-page access-workspace">
      <p className="section-kicker">Access management</p>
      <h1>Compose access, assign it, and retain accountability.</h1>
      <p className="portal-page__lead">
        Every checkbox below maps to a real server-enforced CharityChain permission. Recipients see
        only the portal areas and actions their assigned permissions allow.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <form className="access-composer" onSubmit={submit}>
        <section className="access-composer__catalogue">
          <div className="access-section-heading">
            <div>
              <p className="section-kicker">Step 1</p>
              <h2>Select capabilities</h2>
            </div>
            <span>
              {composer.permissions.length} of {ALL_PERMISSIONS.length} selected
            </span>
          </div>
          <label className="access-search">
            Search capabilities
            <input
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="e.g. vetting, inventory, report"
            />
          </label>
          <div className="permission-groups">
            {visibleGroups.map((group) => (
              <section className="permission-group" key={group.id}>
                <header>
                  <div>
                    <h3>{group.title}</h3>
                    <p>{group.items.filter(([code]) => selected.has(code)).length} selected</p>
                  </div>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => toggleGroup(group.items)}
                  >
                    {group.items.every(([code]) => selected.has(code))
                      ? 'Clear group'
                      : 'Select group'}
                  </button>
                </header>
                <div>
                  {group.items.map(([code, label]) => (
                    <label className="permission-option" key={code}>
                      <input
                        type="checkbox"
                        checked={selected.has(code)}
                        onChange={() => toggle(code)}
                      />
                      <span>
                        <strong>{label}</strong>
                        <small>{code}</small>
                      </span>
                    </label>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
        <aside className="access-composer__review">
          <div className="access-section-heading">
            <div>
              <p className="section-kicker">Step 2</p>
              <h2>Name the access role</h2>
            </div>
          </div>
          <label>
            Role name
            <input
              value={composer.roleName}
              onChange={(event) => setComposer({ ...composer, roleName: event.target.value })}
              placeholder="Student Support Officer"
              required
            />
          </label>
          <label>
            Role code
            <input
              value={derivedCode}
              readOnly
              aria-label="Generated role code"
              placeholder="Generated automatically"
            />
          </label>
          <label>
            Description
            <textarea
              value={composer.description}
              onChange={(event) => setComposer({ ...composer, description: event.target.value })}
              placeholder="Explain why this access bundle exists."
            />
          </label>
          <div className="access-selection-summary">
            <strong>Selected access</strong>
            {composer.permissions.length ? (
              <ul>
                {composer.permissions.map((code) => (
                  <li key={code}>
                    {ALL_PERMISSIONS.find((item) => item.code === code)?.label ?? code}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Select one or more permissions from the catalogue.</p>
            )}
          </div>
          <div className="access-section-heading">
            <div>
              <p className="section-kicker">Step 3</p>
              <h2>Assign recipient</h2>
            </div>
          </div>
          <label>
            Full name
            <input
              value={composer.recipientName}
              onChange={(event) => setComposer({ ...composer, recipientName: event.target.value })}
              required
            />
          </label>
          <label>
            Email address
            <input
              type="email"
              value={composer.recipientEmail}
              onChange={(event) => setComposer({ ...composer, recipientEmail: event.target.value })}
              required
            />
          </label>
          <p className="access-security-note">
            The recipient account is tied to this email. High-risk access changes require MFA and
            are recorded in the audit log.
          </p>
          <button
            className="primary-button"
            disabled={pending || !composer.permissions.length || !derivedCode}
          >
            {pending ? 'Creating access…' : 'Create role and send invitation'}
          </button>
        </aside>
      </form>
      <section className="users-table-section">
        <div className="access-section-heading">
          <div>
            <p className="section-kicker">Account directory</p>
            <h2>Registered accounts and effective access</h2>
          </div>
          <span>{users.length} accounts</span>
        </div>
        {loading ? (
          <p>Loading accounts…</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Status</th>
                  <th>MFA</th>
                  <th>Assigned roles</th>
                  <th>Effective permissions</th>
                  <th>Access</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.name}</strong>
                      <small>{user.email}</small>
                    </td>
                    <td>{user.status}</td>
                    <td>{user.twoFactorEnabled ? 'Enabled' : 'Not enabled'}</td>
                    <td>
                      {user.roles.length
                        ? user.roles.map((role) => (
                            <span className="access-role-chip" key={role}>
                              {displayRole(role)}
                            </span>
                          ))
                        : '—'}
                    </td>
                    <td>
                      <details>
                        <summary>{user.permissions.length} permissions</summary>
                        <ul className="permission-list-compact">
                          {user.permissions.map((permission) => (
                            <li key={permission}>{permission}</li>
                          ))}
                        </ul>
                      </details>
                    </td>
                    <td>
                      <div className="access-row-actions">
                        <button type="button" className="secondary-button" onClick={() => openRoleEditor(user)}>Edit access</button>
                        <button type="button" className="secondary-button" onClick={() => changeStatus(user)}>{user.status === 'ACTIVE' ? 'Suspend' : 'Activate'}</button>
                        <button type="button" className="danger-button" onClick={() => deleteUser(user)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {existingRoles.length ? (
        <section className="portal-card existing-role-register">
          <h2>Existing role register</h2>
          <div>
            {existingRoles.map((role) => (
              <article key={role.code}>
                <strong>{displayRole(role.code)}</strong>
                <span>
                  {role.permissions?.length ?? 0} permissions · {role._count?.users ?? 0} accounts
                </span>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <p className="muted">No roles are available.</p>
      )}
      {editingUser && <section className="access-editor" role="dialog" aria-modal="true" aria-labelledby="access-editor-title">
        <div className="access-editor__header"><div><p className="section-kicker">Edit access</p><h2 id="access-editor-title">{editingUser.name}</h2><p>{editingUser.email}</p></div><button type="button" className="text-button" onClick={() => setEditingUser(null)}>Close</button></div>
        <p>Select the individual permissions this account should hold. Saving creates or updates access that belongs only to this user.</p>
        <div className="access-editor__permissions">{PERMISSION_GROUPS.map((group) => <section key={group.id}><header><h3>{group.title}</h3><span>{group.items.filter(([code]) => editedPermissions.includes(code)).length} selected</span></header>{group.items.map(([code, label]) => <label key={code}><input type="checkbox" checked={editedPermissions.includes(code)} onChange={() => toggleUserPermission(code)} /><span><strong>{label}</strong><small>{code}</small></span></label>)}</section>)}</div>
        <div className="access-editor__actions"><button type="button" className="secondary-button" onClick={() => setEditingUser(null)} disabled={savingRoles}>Cancel</button><button type="button" className="primary-button" onClick={saveRoles} disabled={savingRoles || !editedPermissions.length}>{savingRoles ? 'Saving access…' : 'Save access'}</button></div>
      </section>}
    </main>
  );
}
