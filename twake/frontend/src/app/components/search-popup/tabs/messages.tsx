import * as Text from '@atoms/text';
import Languages from '@features/global/services/languages-service';
import { SearchInputState } from '@features/search/state/search-input';
import { useSearchMessages } from 'app/features/search/hooks/use-search-messages';
import { useRecoilValue } from 'recoil';
import NothingFound from '../parts/nothing-found';
import NothingSearched from '../parts/nothing-searched';

export default () => {
  return (
    <div>
      <Text.Subtitle className="block">
        {Languages.t('components.searchpopup.messages')}
      </Text.Subtitle>

      <MessagesResults />
    </div>
  );
};

export const MessagesResults = (props: { max?: number }) => {
  const input = useRecoilValue(SearchInputState);
  const isRecent = input?.query?.length === 0;
  const { messages, loading, loadMore } = useSearchMessages();

  if (isRecent) return <NothingSearched />;
  if (messages.length === 0 && !loading) return <NothingFound />;

  return (
    <>
      <div className="">
        {messages
          .map(message => {
            return (
              <div key={message.id} className="cursor-pointer hover:opacity-75 inline-block m-2">
                Hello
              </div>
            );
          })
          .filter(a => a)}
      </div>
    </>
  );
};
