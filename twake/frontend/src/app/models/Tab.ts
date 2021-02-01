import { Resource } from 'services/CollectionsReact/Collections';

export type TabType = {
  id?: string;
  channel_id?: string;
  application_id?: string;
  order?: string;
  owner?: string;
  name?: string;
  configuration?: object;
};

export class TabResource extends Resource<TabType> {
  _type = 'tab';
}
