import { TabType } from 'app/models/Tab';
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
  console.log('++++++++++++++++__________ ', context);

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
