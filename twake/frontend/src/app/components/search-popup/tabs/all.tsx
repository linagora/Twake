import * as Text from '@atoms/text';
import A from 'app/atoms/link';
import Languages from 'app/features/global/services/languages-service';
import { useSearchChannels } from 'app/features/search/hooks/use-search-channels';
import {
  useSearchMessagesFiles,
  useSearchMessagesMedias,
} from 'app/features/search/hooks/use-search-files-or-medias';
import { useSearchMessages } from 'app/features/search/hooks/use-search-messages';
import { SearchInputState, SearchTabsState } from 'app/features/search/state/search-input';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { ChannelsResults } from './channels';
import { FilesResults } from './files';
import { MediasResults } from './medias';
import { MessagesResults } from './messages';

export default () => {
  const setTab = useSetRecoilState(SearchTabsState);

  const input = useRecoilValue(SearchInputState);
  const isRecent = input?.query?.length === 0;

  const { channels } = useSearchChannels();
  const { messages } = useSearchMessages();
  const { files } = useSearchMessagesFiles();
  const { files: medias } = useSearchMessagesMedias();

  return (
    <div>
      <Text.Subtitle className="block">{Languages.t('components.searchpopup.all')}</Text.Subtitle>

      {channels.length > 0 && (
        <>
          <div className="flex mt-4">
            <Text.Subtitle className="block grow">
              {Languages.t('components.searchpopup.channels')}
            </Text.Subtitle>
            <div className="w-auto">
              <A onClick={() => setTab('channels')}>
                {Languages.t('components.searchpopup.see_more')}
              </A>
            </div>
          </div>
          <div className="">
            <ChannelsResults max={6} />
          </div>
        </>
      )}

      {medias.length > 0 && (
        <>
          <div className="flex mt-4">
            <Text.Subtitle className="block grow">
              {Languages.t('components.searchpopup.media')}
            </Text.Subtitle>
            <div className="w-auto">
              <A onClick={() => setTab('medias')}>
                {Languages.t('components.searchpopup.see_more')}
              </A>
            </div>
          </div>
          <div className={isRecent ? '-mx-2' : ''}>
            <MediasResults max={6} showAsFiles={!isRecent} />
          </div>
        </>
      )}

      {files.length > 0 && (
        <>
          <div className="flex mt-4">
            <Text.Subtitle className="block grow">
              {Languages.t('components.searchpopup.files')}
            </Text.Subtitle>
            <div className="w-auto">
              <A onClick={() => setTab('files')}>
                {Languages.t('components.searchpopup.see_more')}
              </A>
            </div>
          </div>
          <div className="">
            <FilesResults max={6} />
          </div>
        </>
      )}

      {messages.length > 0 && (
        <>
          <div className="flex mt-4">
            <Text.Subtitle className="block grow">
              {Languages.t('components.searchpopup.messages')}
            </Text.Subtitle>
            <div className="w-auto">
              <A onClick={() => setTab('messages')}>
                {Languages.t('components.searchpopup.see_more')}
              </A>
            </div>
          </div>
          <div className="">
            <MessagesResults max={6} />
          </div>
        </>
      )}
    </div>
  );
};
