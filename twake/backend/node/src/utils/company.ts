export function hasCompanyAdminLevel(role: string): boolean {
  return role === "admin" || isCompanyOwnerRole(role);
}

export function hasCompanyMemberLevel(role: string): boolean {
  return role === "member" || hasCompanyAdminLevel(role);
}

export function hasCompanyGuestLevel(role: string): boolean {
  return role === "guest" || hasCompanyMemberLevel(role);
}

export function isCompanyOwnerRole(role: string): boolean {
  return role === "owner";
}

export function isCompanyAdminRole(role: string): boolean {
  return role === "admin";
}

export function isCompanyMemberRole(role: string): boolean {
  return role === "member";
}

export function isCompanyGuestRole(role: string): boolean {
  return role === "guest";
}
