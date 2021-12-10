import { UserType } from './User';

export type WorkspaceType = {
  id: string;
  company_id: string;
  archived: boolean;
  default: boolean;
  name: string;
  mininame?: string;
  logo: string;
  role: string;
  stats: {
    created_at: Date;
    total_members: number;
  };
};

export type WorkspaceUserCompanyType = {
  role: 'owner' | 'admin' | 'member' | 'guest';
  status: 'active' | 'deactivated' | 'invited';
  company: {
    id: string; //Related to console "code"
    name: string;
    logo: string;
  };
};

export type WorkspaceUserRole = 'moderator' | 'member';
export type WorkspaceUserType = {
  id: string;
  provider: string; //"console",
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

  role: WorkspaceUserRole;
  user_id: string;
  workspace_id: string;
  user: UserType;

  //Below is only if this is myself
  preference: {
    locale: string; //"fr-FR",
    timezone: number; //minutesFromGMT,
  };
  companies: WorkspaceUserCompanyType[];
};
