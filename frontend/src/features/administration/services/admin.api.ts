import { httpClient } from '../../../services/httpClient';

type JsonRecord = Record<string, unknown>;

export const adminApi = Object.freeze({
  overview: () => httpClient.get('/administration/overview'),
  users: () => httpClient.get('/users?pageSize=100'),
  roles: () => httpClient.get('/roles'),
  composeAndInvite: (payload: JsonRecord) => httpClient.post('/roles/compose-and-invite', payload),
  createStaff: (payload: JsonRecord) => httpClient.post('/users/staff', payload),
  setUserStatus: (id: string, payload: JsonRecord) => httpClient.request(`/users/${id}/status`, { method: 'PATCH', body: payload }),
  deleteUser: (id: string) => httpClient.request(`/users/${id}`, { method: 'DELETE' }),
  replaceUserPermissions: (id: string, permissions: string[]) =>
    httpClient.request(`/roles/users/${id}/permissions`, { method: 'PUT', body: { permissions } }),
  assignRole: (id: string, role: string) => httpClient.request(`/roles/users/${id}/${role}`, { method: 'PUT' }),
  removeRole: (id: string, role: string) => httpClient.request(`/roles/users/${id}/${role}`, { method: 'DELETE' }),
  health: () => httpClient.get('/health'),
  activeVettingPolicy: () => httpClient.get('/vetting/policy'),
  createInventoryCategory: (payload: JsonRecord) => httpClient.post('/inventory/categories', payload),
  createInventoryLocation: (payload: JsonRecord) => httpClient.post('/inventory/locations', payload),
});
