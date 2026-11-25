import { rolesService } from './roles.service.js';
import { usersService } from '../users/users.service.js';
import { auditLogsService } from '../auditLogs/auditLogs.service.js';
import { env } from '../../config/environment.js';
import { resendEmailService } from '../notifications/resendEmail.service.js';

function auditContext(request) {
  return { actorId: request.auth.user.id, requestId: request.id, requestMethod: request.method, requestPath: request.originalUrl, ipAddress: request.ip, userAgent: request.get('user-agent') };
}
function dashboardUrl(permissions) {
  const paths = [
    ['system:administer', '/admin'], ['forensics:read', '/auditor'], ['forensics:investigate', '/auditor'], ['audit:read', '/auditor'], ['disbursement:create', '/finance'], ['disbursement:execute', '/finance'], ['disbursement:read', '/finance'], ['application:review', '/committee'], ['application:approve', '/committee'], ['committee:manage', '/committee'], ['inventory:read', '/clerk'], ['inventory:manage', '/clerk'], ['physical-donation:record', '/clerk'], ['physical-donation:inspect', '/clerk']
  ];
  const path = paths.find(([permission]) => permissions.includes(permission))?.[1] ?? '/';
  return new URL(path, env.APP_URL).toString();
}

export function createRolesController(service = rolesService) {
  const handle = (operation) => async (request, response, next) => {
    try {
      await operation(request, response);
    } catch (error) {
      next(error);
    }
  };
  return {
    list: handle(async (_req, res) => res.json({ roles: await service.list() })),
    create: handle(async (req, res) => {
      const role = await service.create(req.body);
      await auditLogsService.recordFromContext(auditContext(req), { action: 'ROLE_CREATED', entityType: 'ROLE', entityId: role.id, after: { code: role.code, permissions: req.body.permissions }, reason: 'Permission role composed by administrator' });
      res.status(201).json({ role });
    }),
    composeAndInvite: handle(async (req, res) => {
      const role = await service.create(req.body.role);
      try {
        const invitation = await usersService.createStaffAccount({ ...req.body.recipient, roles: [role.code], roleName: role.name, dashboardUrl: dashboardUrl(req.body.role.permissions) });
        await auditLogsService.recordFromContext(auditContext(req), { action: 'ROLE_COMPOSED_AND_ASSIGNED', entityType: 'ROLE', entityId: role.id, after: { code: role.code, recipientUserId: invitation.user.id, permissions: req.body.role.permissions }, reason: 'Administrator composed a role and provisioned staff access' });
        res.status(201).json({
          role,
          invitation: {
            user: invitation.user,
            dashboardUrl: invitation.dashboardUrl
          },
          delivery: invitation.delivery
        });
      } catch (error) {
        await service.deleteIfUnused(role.code).catch(() => {});
        throw error;
      }
    }),
    assign: handle(async (req, res) => {
      await service.assign(req.params.userId, req.params.roleCode);
      res.status(204).end();
    }),
    remove: handle(async (req, res) => {
      await service.remove(req.params.userId, req.params.roleCode);
      res.status(204).end();
    }),
    replaceAssignments: handle(async (req, res) => {
      const before = await usersService.get(req.auth, req.params.userId);
      const user = await service.replaceAssignments(req.params.userId, req.body.roles);
      const beforeRoles = new Set(before.roles);
      const afterRoles = user.roles.map((assignment) => assignment.role.code);
      const addedRoles = afterRoles.filter((role) => !beforeRoles.has(role));
      const removedRoles = [...beforeRoles].filter((role) => !afterRoles.includes(role));
      const permissions = [...new Set(user.roles.flatMap((assignment) => assignment.role.permissions.map((item) => item.permission.code)))];
      let delivery = { delivery: 'NOT_SENT' };
      try {
        delivery = await resendEmailService.sendAccessUpdate({ recipientName: user.name, email: user.email, addedRoles, removedRoles, permissions });
      } catch (error) {
        delivery = { delivery: 'FAILED' };
      }
      await auditLogsService.recordFromContext(auditContext(req), { action: 'USER_ACCESS_UPDATED', entityType: 'USER', entityId: user.id, after: { addedRoles, removedRoles, permissions, emailDelivery: delivery.delivery }, reason: 'Administrator changed assigned access roles' });
      res.json({ user, delivery });
    }),
    replaceUserPermissionAccess: handle(async (req, res) => {
      const before = await usersService.get(req.auth, req.params.userId);
      const user = await service.replaceUserPermissionAccess(req.params.userId, req.body.permissions);
      const permissions = [...new Set(user.roles.flatMap((assignment) => assignment.role.permissions.map((item) => item.permission.code)))];
      const addedPermissions = permissions.filter((permission) => !before.permissions.includes(permission));
      const removedPermissions = before.permissions.filter((permission) => !permissions.includes(permission));
      let delivery = { delivery: 'NOT_SENT' };
      try {
        delivery = await resendEmailService.sendAccessUpdate({ recipientName: user.name, email: user.email, addedRoles: addedPermissions, removedRoles: removedPermissions, permissions });
      } catch {
        delivery = { delivery: 'FAILED' };
      }
      await auditLogsService.recordFromContext(auditContext(req), { action: 'USER_PERMISSION_ACCESS_UPDATED', entityType: 'USER', entityId: user.id, after: { addedPermissions, removedPermissions, permissions, emailDelivery: delivery.delivery }, reason: 'Administrator set user-specific permission access' });
      res.json({ user, delivery });
    }),
    setPermissions: handle(async (req, res) =>
      res.json(await service.setPermissions(req.params.roleCode, req.body.permissions))
    )
  };
}

export const rolesController = createRolesController();
