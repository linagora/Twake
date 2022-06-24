import { InputDecorationIcon } from '@atoms/input/input-decoration-icon';
import { Modal, ModalContent } from '@atoms/modal';
import { SearchIcon } from '@heroicons/react/solid';
import Tabs from '@molecules/tabs';
import { Select } from 'app/atoms/input/input-select';
import { Input } from 'app/atoms/input/input-text';
import Languages from 'app/features/global/services/languages-service';
import useRouterChannel from 'app/features/router/hooks/use-router-channel';
import useRouterWorkspace from 'app/features/router/hooks/use-router-workspace';
import { useSearchModal } from 'app/features/search/hooks/use-search';
import { SearchInputState } from 'app/features/search/state/search-input';
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { useRecoilState } from 'recoil';

export default () => {
  const { open, setOpen } = useSearchModal();

  return (
    <Modal open={open} onClose={() => setOpen(false)} className="sm:w-[80vw] sm:max-w-4xl">
      <SearchBox />
    </Modal>
  );
};

const SearchBox = () => {
  const [input, setInput] = useRecoilState(SearchInputState);
  const workspaceId = useRouterWorkspace();
  const channelId = useRouterChannel();

  const inputElement = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (inputElement.current) inputElement.current.focus();
  }, []);

  return (
    <ModalContent textCenter title={Languages.t('components.searchpopup.header_title')}>
      <div className="relative flex mt-2 w-full">
        <InputDecorationIcon
          className="grow"
          prefix={SearchIcon}
          input={({ className }) => (
            <Input
              inputRef={inputElement}
              onChange={e => setInput({ ...input, query: e.target.value })}
              value={input.query}
              className={className + ' rounded-tr-none rounded-br-none'}
              placeholder={Languages.t('scenes.app.mainview.quick_search_placeholder')}
            />
          )}
        />
        <Select
          onChange={e => {
            if (e.target.value === 'company') {
              setInput({
                ..._.omit(input, 'workspaceId', 'channelId'),
              });
            } else {
              setInput({
                ...input,
                workspaceId,
                channelId,
              });
            }
            if (inputElement.current) inputElement.current.focus();
          }}
          value={input.channelId ? 'channel' : 'company'}
          className="w-auto rounded-tl-none ml-px rounded-bl-none text-sm text-opacity-50"
        >
          <option value="company">{Languages.t('components.searchpopup.scope.company')}</option>
          <option value="channel">{Languages.t('components.searchpopup.scope.channel')}</option>
        </Select>
      </div>

      <SearchResultsIndex />
    </ModalContent>
  );
};

const SearchResultsIndex = () => {
  const [tab, setTab] = useState(0);

  return (
    <>
      <Tabs
        tabs={[
          <div key="all">{Languages.t('components.searchpopup.all')}</div>,
          <div key="channels">{Languages.t('components.searchpopup.channels')}</div>,
          <div key="messages">{Languages.t('components.searchpopup.messages')}</div>,
          <div key="media">{Languages.t('components.searchpopup.media')}</div>,
          <div key="files">{Languages.t('components.searchpopup.files')}</div>,
        ]}
        selected={tab}
        onClick={idx => setTab(idx)}
      />
    </>
  );
};
