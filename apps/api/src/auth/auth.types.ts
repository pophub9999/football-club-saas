export interface AuthenticatedUser {
  id: string;
  tenantId: string;
  email: string;
  roles: string[];
}
