import { Resource } from 'services/CollectionsReact/Collections';

export type TabType = {
  id?: string;
  application_id?: string;
  name?: string;
  configuration?: object;
};

export class TabResource extends Resource<TabType> {}
