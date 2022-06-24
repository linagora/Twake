import Tabs from '@molecules/tabs';
import Languages from 'app/features/global/services/languages-service';
import { useSearchChannels } from 'app/features/search/hooks/use-search-channels';
import {
  useSearchMessagesFiles,
  useSearchMessagesMedias,
} from 'app/features/search/hooks/use-search-files-or-medias';
import { useSearchMessages } from 'app/features/search/hooks/use-search-messages';
import { SearchInputState } from 'app/features/search/state/search-input';
import { useState } from 'react';
import { useRecoilValue } from 'recoil';
import SearchResultsAll from './tabs/all';
import SearchResultsChannels from './tabs/channels';
import SearchResultsFiles from './tabs/files';
import SearchResultsMedias from './tabs/medias';
import SearchResultsMessages from './tabs/messages';

export const SearchResultsIndex = () => {
  const input = useRecoilValue(SearchInputState);
  const hasInput = input?.query?.length > 0;
  const [tab, setTab] = useState(0);

  const { channels } = useSearchChannels();
  const { messages } = useSearchMessages();
  const { files } = useSearchMessagesFiles();
  const { files: medias } = useSearchMessagesMedias();

  return (
    <>
      <Tabs
        tabs={[
          <div key="all">{Languages.t('components.searchpopup.all')}</div>,
          <div key="messages">
            <div className="flex">
              {Languages.t('components.searchpopup.messages')}
              {hasInput && <SearchCounterBadge count={messages.length} />}
            </div>
          </div>,
          <div key="media">
            <div className="flex">
              {Languages.t('components.searchpopup.media')}
              {hasInput && <SearchCounterBadge count={medias.length} />}
            </div>
          </div>,
          <div key="files">
            <div className="flex">
              {Languages.t('components.searchpopup.files')}
              {hasInput && <SearchCounterBadge count={files.length} />}
            </div>
          </div>,
          ...(!input.channelId
            ? [
                <div key="channels">
                  <div className="flex">
                    {Languages.t('components.searchpopup.channels')}
                    {hasInput && <SearchCounterBadge count={channels.length} />}
                  </div>
                </div>,
              ]
            : []),
        ]}
        selected={tab}
        onClick={idx => setTab(idx)}
      />

      {tab === 0 && <SearchResultsAll />}
      {tab === 1 && <SearchResultsMessages />}
      {tab === 2 && <SearchResultsMedias />}
      {tab === 3 && <SearchResultsFiles />}
      {tab === 4 && <SearchResultsChannels />}
    </>
  );
};

const SearchCounterBadge = (props: { count: number }) => {
  const count = props.count < 100 ? props.count : '99+';
  return (
    <div className="bg-zinc-200 ml-2 px-1.5 text-sm rounded-full text-zinc-500 dark:bg-zing-800 dark:text-zinc-600">
      {count}
    </div>
  );
};
