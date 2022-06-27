import * as Text from '@atoms/text';
import Languages from 'app/features/global/services/languages-service';
import { useSearchChannels } from 'app/features/search/hooks/use-search-channels';
import { SearchInputState } from 'app/features/search/state/search-input';
import { useRecoilValue } from 'recoil';
import NothingFound from '../parts/nothing-found';

export default () => {
  const input = useRecoilValue(SearchInputState);
  const isRecent = input?.query?.length === 0;
  const { channels, loading, loadMore } = useSearchChannels();

  if (channels.length === 0 && !loading) return <NothingFound />;

  return (
    <div>
      {isRecent && (
        <>
          <Text.Subtitle className="block">
            {Languages.t('components.searchpopup.recent_channels_and_contacts')}
          </Text.Subtitle>
        </>
      )}
      TODO
      <Text.Subtitle className="block mt-4">
        {Languages.t('components.searchpopup.channels')}
      </Text.Subtitle>
      TODO
    </div>
  );
};

export const ChannelsResults = (props: { max?: number }) => {
  const { channels, loading, loadMore } = useSearchChannels();

  if (channels.length === 0 && !loading) return <NothingFound />;

  return <></>;
};
