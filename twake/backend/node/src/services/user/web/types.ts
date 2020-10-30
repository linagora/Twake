export interface UserParams {
  id?: string;
}

export interface CreateUserBody {
  email: string;
  firstname?: string;
  lastname?: string;
}
