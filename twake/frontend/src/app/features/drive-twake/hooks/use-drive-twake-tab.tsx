import useRouterCompany from 'app/features/router/hooks/use-router-company';
import { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import { DriveTwakeApiClient } from '../api-client/api-client';
import { DriveTwakeTabAtom } from '../state/store';

export const useDriveTwakeTab = (tabId: string) => {
  const companyId = useRouterCompany();
  const [tab, setTab] = useRecoilState(DriveTwakeTabAtom(tabId));

  useEffect(() => {
    DriveTwakeApiClient.getTab(companyId, tabId).then(setTab);
  }, [companyId, tabId]);

  return {
    tab,
    setTab: async (itemId: string) => {
      const tab = await DriveTwakeApiClient.setTab(companyId, tabId, itemId);
      if (tab.item_id) setTab(tab);
    },
  };
};
