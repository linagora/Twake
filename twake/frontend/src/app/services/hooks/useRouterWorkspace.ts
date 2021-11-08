import { useState, useCallback, useEffect } from 'react';
import RouterService from '../RouterService';

export default function useRouterworkspace() {
  const workspaceIdFromRoute = RouterService.getStateFromRoute().workspaceId;

  const [workspaceId, setworkspaceId] = useState<string | undefined>(workspaceIdFromRoute);
  const handleStateFromRoute = useCallback(
    function () {
      const workspaceId = workspaceIdFromRoute;
      setworkspaceId(workspaceId);
    },
    [workspaceIdFromRoute],
  );

  useEffect(() => {
    handleStateFromRoute();
  }, [handleStateFromRoute]);

  return workspaceId;
}
