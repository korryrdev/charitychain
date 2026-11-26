import { describe, expect, it } from 'vitest';
import { NAVIGATION, allowedNavigation } from '../navigation';
describe('portal navigation', () => { it('only exposes routes allowed by server-issued role and permissions', () => { const clerk = { roles: ['CLERK'], permissions: ['physical-donation:record', 'inventory:read'] }; expect(allowedNavigation(NAVIGATION.operations, clerk).map((item) => item.to)).toEqual(['/clerk', '/clerk/receive', '/clerk/inventory', '/clerk/rejected', '/inventory', '/inventory/stock']); expect(allowedNavigation(NAVIGATION.governance, clerk)).toEqual([]); }); });
