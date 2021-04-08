import { Resource } from 'services/CollectionsReact/Collections';

export type PendingEmail = {
  workspace_id: string;
  channel_id: string;
  company_id: string;
  email: string;
};
export class PendingEmailResource extends Resource<PendingEmail> {
  _resourcePrimaryKey: string[] = ['workspace_id', 'company_id', 'channel_id', 'email'];
  _resourceIdKey: string = 'email';
}
