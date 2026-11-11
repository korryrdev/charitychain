export function toUserResponse(user) {
  return Object.freeze({
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    image: user.image,
    status: user.status,
    twoFactorEnabled: user.twoFactorEnabled,
    roles: Object.freeze(user.roles?.map((item) => item.role?.code ?? item.code) ?? []),
    permissions: Object.freeze([...new Set(user.roles?.flatMap((item) => item.role?.permissions?.map((entry) => entry.permission.code) ?? []) ?? [])]),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  });
}
