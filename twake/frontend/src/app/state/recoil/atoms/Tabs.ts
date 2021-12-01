import { TabType } from 'app/models/Tab';
import TabsAPIClients from 'app/services/tabs/TabsAPIClients';
import { atomFamily } from 'recoil';

export type AtomTabKey = { company_id: string; workspace_id: string; channel_id: string };

export const TabState = atomFamily<TabType[], AtomTabKey>({
  key: 'TabState',
  default: async ({ company_id, workspace_id, channel_id }) => {
    return await TabsAPIClients.list(company_id, workspace_id, channel_id);
  },
});
