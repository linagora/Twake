import React, { useEffect, useRef, useState } from 'react';
import { Input, Row, Typography } from 'antd';
import Languages from 'services/languages/languages';
import Icon from 'components/Icon/Icon';
import ObjectModal from 'components/ObjectModal/ObjectModal';
import listService, {
  GenericChannel,
} from 'app/scenes/Client/ChannelsBar/Modals/SearchListManager';
import SearchListContainer from './WorkspaceChannelList/SearchListContainer';
import ChannelsService from 'services/channels/channels.js';
import RouterServices from 'app/services/RouterService';
import ModalManager from 'app/components/Modal/ModalManager';
import { UserType } from 'app/models/User';
import UsersService from 'services/user/UserService';
import { ChannelMemberResource, ChannelResource } from 'app/models/Channel';
import { Collection } from 'services/CollectionsReact/Collections';
import PerfectScrollbar from 'react-perfect-scrollbar';

export default () => {
  const [search, setSearch] = useState<string>('');
  const [limit, setLimit] = useState(10);
  const [cursor, setCursor] = useState<number>(-1);
  const { companyId } = RouterServices.getStateFromRoute();

  const currentUserId: string = UsersService.getCurrentUserId();
  const inputRef = useRef<Input>(null);

  useEffect(() => {
    listService.bind(search);
  });

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowUp' && cursor > 0) {
      return setCursor(cursor - 1);
    }

    if (event.key === 'ArrowDown' && cursor < listService.list.length - 1) {
      if (cursor < limit - 1) return setCursor(cursor + 1);
    }

    if (event.key === 'Enter' && cursor >= 0) {
      const element = listService.list[cursor];
      return element ? handleElementType(element) : null;
    }
  };

  const handleElementType = (element: GenericChannel) => {
    switch (element.type) {
      case 'user':
        return upsertDirectMessage([(element.resource as UserType).id || '', currentUserId]);
      case 'workspace':
        return joinChannel(element.resource as ChannelResource);
      case 'direct':
        return upsertDirectMessage((element.resource as ChannelResource).data.members || []);
    }
  };

  const upsertDirectMessage = async (userIds: string[]): Promise<void> => {
    await ChannelsService.openDiscussion(userIds, companyId);
    return ModalManager.closeAll();
  };

  const joinChannel = (channel: ChannelResource) => {
    const collectionPath: string = `/channels/v1/companies/${channel.data.company_id}/workspaces/${channel.data.workspace_id}/channels/${channel.data.id}/members/`;
    const channelMembersCollection = Collection.get(collectionPath, ChannelMemberResource);
    const findMember = channelMembersCollection.find({ user_id: currentUserId });

    if (!findMember.length) {
      channelMembersCollection.insert(
        new ChannelMemberResource({
          channel_id: channel.data.id,
          user_id: currentUserId,
          type: 'member',
        }),
      );
    }

    ModalManager.closeAll();
    return RouterServices.push(`/client/${channel.data.workspace_id}/c/${channel.data.id}`);
  };

  const loadMore = () => {
    setLimit(limit + 10);
    return inputRef.current?.focus();
  };

  return (
    <ObjectModal title={Languages.t('components.channelworkspacelist.title')} closable>
      <Row className="small-bottom-margin x-margin">
        <Input
          suffix={
            <Icon type="search" className="m-icon-small" style={{ color: 'var(--grey-dark)' }} />
          }
          onKeyDown={handleKeyDown}
          placeholder={Languages.t('scenes.client.channelbar.workspacechannellist.autocomplete')}
          value={search}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setSearch(event.target.value);
            return setCursor(0);
          }}
          autoFocus
          ref={inputRef}
        />
      </Row>
      <PerfectScrollbar
        style={{ height: '240px' }}
        component="div"
        options={{ suppressScrollX: true, suppressScrollY: false }}
      >
        <SearchListContainer
          list={listService.list}
          active={cursor}
          limit={limit}
          setCursor={(index: number) => setCursor(index)}
        />
        {listService.list.length > limit && (
          <Row justify="center" style={{ lineHeight: '32px' }}>
            <Typography.Link onClick={loadMore}>
              {Languages.t(
                'scenes.client.channelsbar.modals.workspace_channel_list.workspace_channel_row.loader',
              )}
            </Typography.Link>
          </Row>
        )}
      </PerfectScrollbar>
    </ObjectModal>
  );
};
