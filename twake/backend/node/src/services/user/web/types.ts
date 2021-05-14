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
  company_ids?: string;
}

export interface UserParameters {
  /* user id */
  id: string;
}

export interface UsersParameters {
  ids?: string;
  companies?: string;
}

export interface UserCompany {
  role: string; // "owner" | "admin" | "member" | "guest",
  status: string; // "active" | "deactivated" | "invited",
  company: {
    id: string; //Related to console "code"
    name: string;
    logo: string;
  };
}

export interface UserResponse {
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

  companies?: UserCompany[];
}
