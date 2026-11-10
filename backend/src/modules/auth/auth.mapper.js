export function toAuthUser(user) {
  if (!user) return null;
  return Object.freeze({
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    status: user.status,
    twoFactorEnabled: Boolean(user.twoFactorEnabled),
    roles: Object.freeze(
      user.roles?.map((assignment) => assignment.role?.code ?? assignment.code) ?? []
    )
  });
}
