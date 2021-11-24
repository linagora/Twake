import { useRecoilState } from 'recoil';
import { AtomTabKey, TabState } from '../atoms/tabs';
import useRouterChannel from './useRouterChannel';
import useRouterCompany from './useRouterCompany';
import useRouterWorkspace from './useRouterWorkspace';

export default function useTabs() {
  const company_id = useRouterCompany();
  const workspace_id = useRouterWorkspace();
  const channel_id = useRouterChannel();

  const context: AtomTabKey = { company_id, workspace_id, channel_id };

  const [tabs, setTabs] = useRecoilState(TabState(context));

  const save = async (tab_id?: string) => {
    const tabSaved = null;
    if (tab_id) {
      //modifie tab with his tab_id
    } else {
      //save the new tab
      if (tabSaved) {
      }
    }
  };

  const list = async (channel_id: string) => {};

  const remove = async (tab_id: string) => {};

  return { tabs, save, list, remove };
}
