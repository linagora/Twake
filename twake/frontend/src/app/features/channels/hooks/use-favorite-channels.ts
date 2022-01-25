import { ChannelType } from 'app/features/channels/types/channel';
import { useDirectChannels } from './use-direct-channels';
import { usePublicOrPrivateChannels } from './use-public-or-private-channels';

export function useFavoriteChannels(): {
  favoriteChannels: ChannelType[];
  refresh: () => void;
} {
  const {
    publicChannels,
    privateChannels,
    refresh: refreshPublicOrPrivateChannels,
  } = usePublicOrPrivateChannels();
  const { directChannels, refresh: refreshDirectChannels } = useDirectChannels();

  /**
   * This function will refresh public, private and direct channels state
   */
  const refresh = async () => {
    await refreshPublicOrPrivateChannels();
    await refreshDirectChannels();
  };

  return {
    favoriteChannels: [...publicChannels, ...privateChannels, ...directChannels].filter(
      c => c.user_member?.favorite,
    ),
    refresh,
  };
}
