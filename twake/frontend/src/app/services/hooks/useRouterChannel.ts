import { useState, useCallback, useEffect } from 'react';
import RouterService from '../RouterService';

export default function useRouterChannel() {
  const channelIdFromRoute = RouterService.getStateFromRoute().channelId;

  const [channelId, setchannelId] = useState<string | undefined>(channelIdFromRoute);
  const handleStateFromRoute = useCallback(
    function () {
      const channelId = channelIdFromRoute;
      setchannelId(channelId);
    },

    [channelIdFromRoute],
  );

  useEffect(() => {
    handleStateFromRoute();
  }, [handleStateFromRoute]);

  return channelId;
}
