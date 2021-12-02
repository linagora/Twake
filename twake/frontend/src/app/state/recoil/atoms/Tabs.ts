import { atomFamily } from 'recoil';

import { TabType } from 'app/models/Tab';
import TabsAPIClients from 'app/services/tabs/TabsAPIClients';

export type AtomTabKey = { companyId: string; workspaceId: string; channelId: string };

export const TabState = atomFamily<TabType[], AtomTabKey>({
  key: 'TabState',
  default: async ({ companyId, workspaceId, channelId }) => {
    return await TabsAPIClients.list({ companyId, workspaceId, channelId });
  },
});
