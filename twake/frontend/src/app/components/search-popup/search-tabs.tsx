import Tabs from '@molecules/tabs';
import Languages from 'app/features/global/services/languages-service';
import { useSearchChannels } from 'app/features/search/hooks/use-search-channels';
import {
  useSearchMessagesFiles,
  useSearchMessagesMedias,
} from 'app/features/search/hooks/use-search-files-or-medias';
import { useSearchMessages } from 'app/features/search/hooks/use-search-messages';
import { SearchInputState, SearchTabsState } from 'app/features/search/state/search-input';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { useRecoilState, useRecoilValue } from 'recoil';
import SearchResultsAll from './tabs/all';
import SearchResultsChannels from './tabs/channels';
import SearchResultsFiles from './tabs/files';
import SearchResultsMedias from './tabs/medias';
import SearchResultsMessages from './tabs/messages';

const orderedTabs = ['all', 'messages', 'medias', 'files', 'channels'];

export const SearchResultsIndex = () => {
  const input = useRecoilValue(SearchInputState);
  const hasInput = input?.query?.length > 0;
  const [tab, setTab] = useRecoilState(SearchTabsState);

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
          .../*!input.channelId
            ?*/ [
            <div key="channels">
              <ChannelsTab />
            </div>,
          ],
          /*: []*/
        ]}
        selected={orderedTabs.indexOf(tab)}
        onClick={idx => setTab(orderedTabs[idx] as any)}
      />

      <PerfectScrollbar
        className="-mb-4 py-3 overflow-hidden -mx-2 px-2"
        style={{ maxHeight: 'calc(80vh - 100px)', minHeight: 'calc(80vh - 100px)' }}
        options={{ suppressScrollX: true, suppressScrollY: false }}
        component="div"
      >
        {tab === 'all' && <SearchResultsAll />}
        {tab === 'messages' && <SearchResultsMessages />}
        {tab === 'medias' && <SearchResultsMedias />}
        {tab === 'files' && <SearchResultsFiles />}
        {tab === 'channels' && <SearchResultsChannels />}
      </PerfectScrollbar>
    </>
  );
};

const ChannelsTab = () => {
  const input = useRecoilValue(SearchInputState);
  const hasInput = input?.query?.length > 0;
  const { channels } = useSearchChannels();

  return (
    <div className="flex">
      {Languages.t('components.searchpopup.channels')}
      {hasInput && <SearchCounterBadge count={channels.length} />}
    </div>
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
