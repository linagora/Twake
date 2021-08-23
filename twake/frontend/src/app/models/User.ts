import { Resource } from 'services/CollectionsReact/Collections';

export type UserType = {
  connected?: boolean;
  email: string;
  firstname?: string;
  front_id?: string;
  groups_id?: string[];
  id?: string;
  identity_provider?: string;
  isNew?: boolean;
  isRobot?: boolean;
  language?: string;
  lastname?: string;
  mail_hash?: string;
  mail_verification_override?: any;
  mail_verification_override_mail?: any;
  mails?: any;
  notifications_preferences?: any;
  status?: string;
  status_icon?: string[];
  thumbnail?: string;
  timezone_offset?: string;
  tutorial_status?: any;
  username: string;
  workspaces?: any;
  workspaces_id?: string[];
  is_verified?: boolean;
  created_at?: number;
  _cached?: boolean;
  _cached_from?: any;
  _created?: boolean;
  _creating?: boolean;
  _deleted?: boolean;
  _last_modified?: any;
  _loaded?: boolean;
  _loaded_from?: any;
  _persisted?: boolean;
  _updating?: boolean;
};

export class UserResource extends Resource<UserType> {
  _type = 'user';
}
