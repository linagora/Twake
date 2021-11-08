import { useState, useCallback, useEffect } from 'react';
import RouterService from '../RouterService';

export default function useRouterCompany() {
  const companyIdFromRoute = RouterService.getStateFromRoute().companyId;

  const [companyId, setCompanyId] = useState<string | undefined>(companyIdFromRoute);
  const handleStateFromRoute = useCallback(
    function () {
      const companyId = companyIdFromRoute;
      setCompanyId(companyId);
    },
    [companyIdFromRoute],
  );

  useEffect(() => {
    handleStateFromRoute();
  }, [handleStateFromRoute]);

  return companyId;
}
