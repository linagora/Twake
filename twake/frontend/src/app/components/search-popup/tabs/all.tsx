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
import { ChannelsResults, ChannelsRowResults } from './channels';
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
    <div className="-mt-4">
      {!input.channelId && channels.length > 0 && (
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
          <div className={'-mx-2'}>
            <ChannelsRowResults max={6} />
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
          <div className={'-mx-2'}>
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
          <div className={'-mx-2'}>
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
          </div>
          <div className="-mx-2">
            <MessagesResults max={6} />
          </div>
        </>
      )}
    </div>
  );
};
