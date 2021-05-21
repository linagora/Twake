export interface UserParams {
  id?: string;
}

export interface CreateUserBody {
  email: string;
  firstname?: string;
  lastname?: string;
}
export interface PaginationQueryParameters {
  page_token?: string;
  limit?: string;
  websockets?: boolean;
}
export interface UserListQueryParameters extends PaginationQueryParameters {
  user_ids?: string;
  include_companies?: boolean;
}

export interface UserParameters {
  /* user id */
  id: string;
}

export interface UsersParameters {
  ids?: string;
  companies?: string;
}

export interface UserCompanyRole {
  role?: "owner" | "admin" | "member" | "guest";
}

export interface UserCompanyStatus {
  status?: "active" | "deactivated" | "invited";
}

export interface CompanyShort {
  id: string; //Related to console "code"
  name: string;
  logo: string;
}

export interface UserCompanyObject extends UserCompanyRole, UserCompanyStatus {
  company: CompanyShort;
}

export interface UserObject {
  id: string;
  provider: string;
  provider_id: string;
  email: string;
  is_verified: boolean;
  picture: string;
  first_name: string;
  last_name: string;
  created_at: number;
  deleted: boolean;
  status: string; //Single string for the status
  last_activity: number;

  //Below is only if this is myself

  preference?: {
    locale: string;
    timezone: number;
  };

  companies?: UserCompanyObject[];
}

export interface CompanyPlanObject {
  name: string;
  limits: {
    members: number;
    guests: number;
    storage: number;
  };
}

export interface CompanyStatsObject {
  created_at: number;
  total_members: number;
  total_guests: number;
}

export interface CompanyObject extends UserCompanyRole, UserCompanyStatus {
  id: string;
  name: string;
  logo: string;
  plan?: CompanyPlanObject;
  stats?: CompanyStatsObject;
}
