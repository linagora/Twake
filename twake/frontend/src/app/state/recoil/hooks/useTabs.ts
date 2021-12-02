import { useRecoilState } from 'recoil';

import { TabType } from 'app/models/Tab';
import { useRealtimeRoom } from 'app/services/Realtime/useRealtime';
import TabsAPIClients from 'app/services/tabs/TabsAPIClients';
import { AtomTabKey, TabState } from '../atoms/Tabs';
import useRouterChannel from './useRouterChannel';
import useRouterCompany from './useRouterCompany';
import useRouterWorkspace from './useRouterWorkspace';

export default function useTabs() {
  const companyId = useRouterCompany();
  const workspaceId = useRouterWorkspace();
  const channelId = useRouterChannel();
  const context: AtomTabKey = { companyId, workspaceId, channelId };

  const [tabs, setTabs] = useRecoilState(TabState(context));
  useRealtimeRoom<TabType>(TabsAPIClients.websockets(channelId)[0]?.room || '', 'UseTabs', () =>
    refresh(),
  );

  const save = async (tab: TabType) => {
    await TabsAPIClients.save(companyId, workspaceId, channelId, tab);
    await refresh();
  };

  const remove = async (tabId: string) => {
    await TabsAPIClients.remove(companyId, workspaceId, channelId, tabId);
    await refresh();
  };

  const refresh = async () => {
    const tabsRefreshed = await TabsAPIClients.list(companyId, workspaceId, channelId);
    if (tabsRefreshed) setTabs(tabsRefreshed);
  };

  return { tabs, save, refresh, remove };
}

export function useTab(tabId: string) {
  const { tabs, remove } = useTabs();
  return {
    tab: tabs.find(t => t.id === tabId),
    remove: () => {
      remove(tabId);
    },
  };
}
