import React, { FC, useState } from 'react';
import { Typography, Input, Row, Col } from 'antd';
import { Search } from 'react-feather';
import { capitalize } from 'lodash';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { ChannelMemberResource } from 'app/models/Channel';
import { UserType } from 'app/models/User';
import Languages from 'services/languages/languages.js';
import Collections from 'services/CollectionsReact/Collections';
import Strings from 'services/utils/strings.js';
import UsersService from 'services/user/user.js';
import Workspaces from 'services/workspaces/workspaces.js';
import MemberChannelRow from 'scenes/Client/ChannelsBar/Parts/Header/MemberChannelRow.tsx';
import ObjectModal from 'components/ObjectModal/ObjectModal';

type Props = {
  onEdit?: any;
  onClose?: any;
  channelName?: string;
  companyId: string;
  workspaceId: string;
  channelId: string;
};

const ChannelMembersEditor: FC<Props> = props => {
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState<number>(10);
  const [memberList, setMemberList] = useState<UserType[]>([]);
  const collectionPath: string = `/channels/v1/companies/${props.companyId}/workspaces/${props.workspaceId}/channels/${props.channelId}/members/`;
  const channelMembersCollection = Collections.get(collectionPath, ChannelMemberResource);
  const members = channelMembersCollection.useWatcher({});
  const membersIds = members.map(member => member.data.user_id || '');

  const loadMore = () => {
    setLimit(limit + 10);
    return onSearchMembers(search);
  };

  const onSearchMembers = (text: string): void => {
    setSearch(text);

    if (!text.length || limit > memberList.length) {
      setLimit(10);
    }

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
      title={Languages.t('scenes.client.channelbar.channelmemberseditor.title', [
        capitalize(props.channelName),
      ])}
      closable
    >
      <Row className="small-bottom-margin x-margin">
        <Input
          size={'large'}
          value={search}
          suffix={<Search size={20} style={{ color: 'var(--grey-dark)' }} />}
          placeholder={Languages.t('scenes.client.channelbar.channelmemberslist.autocomplete')}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            onSearchMembers(e.target.value);
          }}
        />
      </Row>
      <Row className="small-bottom-margin" style={{ height: '240px' }}>
        {!search.length && (
          <Col span={24} className="smalltext" style={{ textAlign: 'center', lineHeight: '240px' }}>
            {Languages.t('components.searchpopup.enter_member_name')}
          </Col>
        )}
        {!!search.length && !memberList.length && (
          <Col span={24} className="smalltext" style={{ textAlign: 'center', lineHeight: '240px' }}>
            {Languages.t('components.workspace_picker.modal_no_result')}
          </Col>
        )}
        {memberList.length > 0 && (
          <PerfectScrollbar
            style={{ maxHeight: '240px', width: '100%' }}
            component="div"
            options={{ suppressScrollX: true, suppressScrollY: false }}
          >
            {memberList
              .filter((user: UserType, index: number) => (index < limit ? user : false))
              .map(member => (
                <div key={member.id} className="x-margin">
                  <MemberChannelRow
                    key={member.id}
                    userId={member.id || ''}
                    collection={channelMembersCollection}
                    inAddition={true}
                  />
                </div>
              ))}
            {limit < memberList.length && (
              <Row justify="center" align="middle">
                <Typography.Link className="small-y-margin" onClick={loadMore}>
                  {Languages.t('scenes.client.channelbar.channelmemberslist.loader')}
                </Typography.Link>
              </Row>
            )}
          </PerfectScrollbar>
        )}
      </Row>
    </ObjectModal>
  );
};

export default ChannelMembersEditor;
