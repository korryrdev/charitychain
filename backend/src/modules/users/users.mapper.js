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
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  });
}
