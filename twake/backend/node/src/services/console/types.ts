import Company from "../user/entities/company";
import CompanyUser from "../user/entities/company_user";

export interface CreateConsoleCompany {
  code: string;
  displayName: string;
  country?: string;
  address?: string;
  logo?: string;
  status: string;
  domain?: string[];
  applications?: string[];
  planId?: string;
  limits?: {
    members: number;
    guests: number;
    storage: number;
  };
}

export type CreatedConsoleCompany = Partial<CreateConsoleCompany>;

export interface CreateConsoleUser {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: string;
}

export type CreatedConsoleUser = Partial<CreateConsoleUser> & { _id: string };

export type UpdateConsoleUserRole = Pick<CreateConsoleUser, "role"> & { id: string };

export type UpdatedConsoleUserRole = UpdateConsoleUserRole;

export type ConsoleUser = {
  id: string;
  companyCode: string;
};

export type ConsoleCompany = {
  code: string;
};

export type CompanyCreatedStreamObject = {
  source: Company;
  destination: ConsoleCompany;
  // Creation error
  error?: Error;
};

export type UserCreatedStreamObject = {
  source: {
    user: CompanyUser;
    company: Company;
  };
  destination: ConsoleUser;
  // Creation error
  error?: Error;
};
