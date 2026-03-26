export function findRoleConfig(roles, roleId) {
  return roles.find((role) => role.id === roleId);
}
