import { Resource } from 'services/CollectionsReact/Collections';
import { CompanyRoleType, CompanyStatusType, CompanyType } from './Company';
import { WorkspaceType } from './Workspace';

export type UserType = {
  connected?: boolean;
  email: string;
  first_name?: string;
  front_id?: string;
  groups_id?: string[];
  id?: string;
  identity_provider?: string;
  isNew?: boolean;
  isRobot?: boolean;
  language?: string;
  last_name?: string;
  mail_hash?: string;
  mail_verification_override?: any;
  mail_verification_override_mail?: any;
  mails?: any;
  notifications_preferences?: any;
  status?: string;
  status_icon?: string[];
  picture?: string;
  thumbnail?: string;
  timezone_offset?: string;
  tutorial_status?: any;
  username: string;
  companies?: { company: CompanyType; role: CompanyRoleType; status: CompanyStatusType }[];
  preference?: { locale?: string; timezone?: number };
  workspaces?: WorkspaceType[];
  workspaces_id?: string[];
  is_verified?: boolean;
  created_at?: number;
  deleted?: boolean;
  _cached?: boolean;
  _cached_from?: any;
  _created?: boolean;
  _creating?: boolean;
  _last_modified?: any;
  _loaded?: boolean;
  _loaded_from?: any;
  _persisted?: boolean;
  _updating?: boolean;
};

export class UserResource extends Resource<UserType> {
  _type = 'user';
}
