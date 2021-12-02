import { TabType } from 'app/models/Tab';
import { useRealtimeRoom } from 'app/services/Realtime/useRealtime';
import TabsAPIClients from 'app/services/tabs/TabsAPIClients';
import { useRecoilState } from 'recoil';
import { AtomTabKey, TabState } from '../atoms/Tabs';
import useRouterChannel from './useRouterChannel';
import useRouterCompany from './useRouterCompany';
import useRouterWorkspace from './useRouterWorkspace';

export default function useTabs() {
  const company_id = useRouterCompany();
  const workspace_id = useRouterWorkspace();
  const channel_id = useRouterChannel();
  const context: AtomTabKey = { company_id, workspace_id, channel_id };
  console.log('++++++++++++++++Here in the useTabs Hook:  ', context);
  useRealtimeRoom(
    '/companies/91752480-3cc5-11ec-a395-5bf84f5d3e05/workspaces/7936e17a-3d7d-11ec-9c5d-0242ac120006/channels/f6841b52-635b-494b-8b92-f471346990e8/tabs',
    'UseTabs',
    () => refresh(),
  );

  const [tabs, setTabs] = useRecoilState(TabState(context));

  const save = async (tab: TabType) => {
    await TabsAPIClients.save(company_id, workspace_id, channel_id, tab);
    await refresh();
  };

  const remove = async (tab_id: string) => {
    await TabsAPIClients.remove(company_id, workspace_id, channel_id, tab_id);
    await refresh();
  };

  const refresh = async () => {
    const tabsRefreshed = await TabsAPIClients.list(company_id, workspace_id, channel_id);
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
