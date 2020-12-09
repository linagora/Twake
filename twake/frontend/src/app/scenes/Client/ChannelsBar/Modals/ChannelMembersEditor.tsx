import React, { FC, useState } from 'react';
import { Typography, Input, Row } from 'antd';
import { Search } from 'react-feather';
import PerfectScrollbar from 'react-perfect-scrollbar';

import { ChannelMemberResource } from 'app/models/Channel';
import { UserType } from 'app/models/User';

import Languages from 'services/languages/languages.js';
import Collections from 'services/CollectionsReact/Collections';
import Strings from 'services/utils/strings.js';
import UsersService from 'services/user/user.js';
import Workspaces from 'services/workspaces/workspaces.js';

import MemberChannelRow from 'scenes/Client/ChannelsBar/Parts/Header/MemberChannelRow.tsx';

import { ObjectModal } from 'components/ObjectModal/DeprecatedObjectModal.js';

type Props = {
  onEdit?: any;
  onClose?: any;
  channelName?: string;
  companyId: string;
  workspaceId: string;
  channelId: string;
};

const { Title } = Typography;

const ChannelMembersEditor: FC<Props> = props => {
  const [search, setSearch] = useState('');
  const [memberList, setMemberList] = useState<UserType[]>([]);
  const collectionPath: string = `/channels/v1/companies/${props.companyId}/workspaces/${props.workspaceId}/channels/${props.channelId}/members/`;
  const channelMembersCollection = Collections.get(collectionPath, ChannelMemberResource);
  const members = channelMembersCollection.useWatcher({});

  const membersIds = members.map(member => member.data.user_id || '');

  const onSearchMembers = (text: string): any => {
    setSearch(text);
    return UsersService.search(
      Strings.removeAccents(text),
      {
        scope: 'group',
        workspace_id: Workspaces.currentWorkspaceId,
        group_id: Workspaces.currentGroupId,
      },
      (res: UserType[]) =>
        setMemberList(res.filter(user => membersIds.indexOf(user.id || '') < 0, membersIds)),
    );
  };

  return (
    <ObjectModal
      title={
        <Title level={5}>
          {Languages.t('scenes.client.channelbar.channelmemberseditor.title', [props.channelName])}
        </Title>
      }
      onClose={() => props.onClose()}
    >
      <Row className="small-bottom-margin x-margin">
        <Input
          size={'large'}
          value={search}
          suffix={<Search size={20} style={{ color: 'var(--grey-dark)' }} />}
          placeholder={Languages.t('scenes.client.channelbar.channelmemberslist.autocomplete')}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchMembers(e.target.value)}
        />
      </Row>
      <PerfectScrollbar
        style={{ height: '400px' }}
        component="div"
        options={{ suppressScrollX: true, suppressScrollY: false }}
      >
        <div className="x-margin bottom-margin">
          {!search.length && (
            <div className="smalltext" style={{ padding: '32px', textAlign: 'center' }}>
              {Languages.t('components.searchpopup.enter_member_name')}
            </div>
          )}
          {!!search.length && !memberList.length && (
            <div className="smalltext" style={{ padding: '32px', textAlign: 'center' }}>
              {Languages.t('components.workspace_picker.modal_no_result')}
            </div>
          )}
          {memberList.map(member => (
            <MemberChannelRow
              key={member.id}
              userId={member.id || ''}
              collection={channelMembersCollection}
              inAddition={true}
            />
          ))}
        </div>
      </PerfectScrollbar>
    </ObjectModal>
  );
};

export default ChannelMembersEditor;
