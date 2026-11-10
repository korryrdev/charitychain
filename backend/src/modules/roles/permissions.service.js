export function permissionsForUser(user) {
  return Object.freeze([
    ...new Set(
      (user.roles ?? []).flatMap((assignment) =>
        (assignment.role?.permissions ?? []).map((item) => item.permission?.code ?? item.code)
      )
    )
  ]);
}
