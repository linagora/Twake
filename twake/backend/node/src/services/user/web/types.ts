
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
  search_query?: string;
}

export interface UserParameters {
  /* user id */
  id: string;
}
