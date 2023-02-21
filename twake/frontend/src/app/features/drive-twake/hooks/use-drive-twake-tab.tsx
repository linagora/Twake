import useRouterCompany from 'app/features/router/hooks/use-router-company';
import { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { DriveTwakeApiClient } from '../api-client/api-client';
import { DriveTwakeTabAtom } from '../state/store';

export const useDriveTwakeTab = (tabId: string) => {
  const companyId = useRouterCompany();
  const [tab, setTab] = useRecoilState(DriveTwakeTabAtom(tabId));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    DriveTwakeApiClient.getTab(companyId, tabId)
      .then(setTab)
      .finally(() => setLoading(false));
  }, [companyId, tabId]);

  return {
    tab,
    setTab: async (itemId: string) => {
      setLoading(true);
      const tab = await DriveTwakeApiClient.setTab(companyId, tabId, itemId);
      if (tab.item_id) setTab(tab);
      setLoading(false);
    },
    loading,
  };
};
