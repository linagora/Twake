import React, { useState } from 'react';
import { Search } from 'react-feather';
import { Col, Row, Typography, Input } from 'antd';
import PerfectScrollbar from 'react-perfect-scrollbar';

import { UserType } from 'app/features/users/types/user';
import { ChannelType } from 'app/features/channels/types/channel';
import Strings from 'app/features/global/utils/strings.js';
import Languages from 'app/features/global/services/languages-service';
import UsersService from 'app/features/users/services/current-user-service';
import MemberChannelRow from 'app/views/client/channels-bar/Parts/Header/MemberChannelRow';

import ObjectModal from 'components/object-modal/object-modal';
import DepreciatedCollections from 'app/deprecated/CollectionsV1/Collections/Collections.js';
import { useUsersListener } from 'app/features/users/hooks/use-users-listener';
import UserAPIClient from 'app/features/users/api/user-api-client';
import { WorkspaceUserType } from 'app/features/workspaces/types/workspace';
import { delayRequest } from 'app/features/global/utils/managedSearchRequest';
import { useChannelMembers } from 'app/features/channel-members/hooks/use-channel-members';
import { ChannelMemberType } from 'app/features/channel-members/types/channel-member-types';

type PropsType = {
  closable?: boolean;
  channel: ChannelType;
};

const { Link } = Typography;
const defaultLimit = 20;

const ChannelMembersList = (props: PropsType) => {
  const { company_id, workspace_id, id } = props.channel;

  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(defaultLimit);
  const [searchedUsers, setSearchedUsers] = useState<string[]>([]);
  const { channelMembers } = useChannelMembers({
    companyId: company_id || '',
    workspaceId: workspace_id || '',
    channelId: id || '',
  });

  const channelMembersUid = channelMembers.map(member => member.user_id || '');

  useUsersListener(channelMembersUid);

  const filterSearch = (res: UserType[]) => {
    const addedUsers: string[] = res
      .filter(user => filterUsers(user, channelMembersUid.includes(user.id || '')))
      .sort(compareFullname)
      .map(user => user.id || '');

    const notAddedUsers: string[] = res
      .filter(user => filterUsers(user, !channelMembersUid.includes(user.id || '')))
      .sort(compareFullname)
      .map(user => user.id || '');

    return setSearchedUsers([...addedUsers, ...notAddedUsers]);
  };

  const filterUsers = (user: UserType, filter: boolean) => (filter ? user : false);

  const compareFullname = (
    a: UserType | ChannelMemberType,
    b: UserType | ChannelMemberType,
    isMemberType?: boolean,
  ) => {
    let userA = a;
    let userB = b;

    if (isMemberType) {
      userA = DepreciatedCollections.get('users').find((a as ChannelMemberType).user_id);
      userB = DepreciatedCollections.get('users').find((b as ChannelMemberType).user_id);
    }

    return UsersService.getFullName(userA as UserType).localeCompare(
      UsersService.getFullName(userB as UserType),
    );
  };

  const onSearchMembers = (text: string) =>
    UserAPIClient.search<WorkspaceUserType>(
      Strings.removeAccents(text),
      {
        scope: 'workspace',
        companyId: company_id,
        workspaceId: workspace_id || undefined,
      },
      list => filterSearch((list || []).map(wsUser => wsUser.user)),
    );

  return (
    <ObjectModal
      title={Languages.t('scenes.client.channelbar.channelmemberslist.title', [props.channel.name])}
      closable={props.closable ? props.closable : false}
    >
      <div className="x-margin">
        <Row align="middle" gutter={[28, 0]}>
          <Col flex="auto">
            <Input
              size={'large'}
              suffix={<Search size={20} style={{ color: 'var(--grey-dark)' }} />}
              placeholder={Languages.t('scenes.client.channelbar.channelmemberslist.autocomplete')}
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setSearch(e.target.value);
                e.persist();

                delayRequest('channel_members_list_search', () => onSearchMembers(e.target.value));
              }}
            />
          </Col>
        </Row>
      </div>
      <PerfectScrollbar
        style={{ maxHeight: '240px', height: '240px', width: '100%', paddingBottom: 8 }}
        component="div"
        options={{ suppressScrollX: true, suppressScrollY: false }}
      >
        {!search.length &&
          channelMembers.length > 0 &&
          channelMembers
            .map(m => m)
            .sort((a, b) => compareFullname(a, b, true))
            .map(user =>
              props.channel.id ? (
                <div key={user.user_id} className="x-margin" style={{ marginTop: 8 }}>
                  <MemberChannelRow
                    key={user.user_id}
                    channelId={props.channel.id}
                    userId={user.user_id || ''}
                  />
                </div>
              ) : (
                <></>
              ),
            )}

        {!search.length && !channelMembers.length && (
          <Row
            align="middle"
            justify="center"
            className="smalltext x-margin"
            style={{ textAlign: 'center', height: '144px' }}
          >
            {Languages.t('scenes.client.channelbar.channelmemberslist.no_members')}
          </Row>
        )}
        {!!search.length &&
          searchedUsers.map(userId =>
            props.channel.id ? (
              <div key={userId} className="x-margin" style={{ marginTop: 8 }}>
                <MemberChannelRow
                  key={userId}
                  userId={userId}
                  channelId={props.channel.id}
                  inAddition={!channelMembersUid.includes(userId || '') ? true : false}
                />
              </div>
            ) : (
              <></>
            ),
          )}

        {!!search.length && searchedUsers.length === 0 && (
          <Row
            align="middle"
            justify="center"
            className="smalltext x-margin"
            style={{ textAlign: 'center', height: '144px' }}
          >
            {Languages.t('components.user_picker.modal_no_result')}
          </Row>
        )}
        {!searchedUsers.length &&
          limit < searchedUsers.length + defaultLimit &&
          setLimit(searchedUsers.length + defaultLimit)}
        {channelMembers.length >= limit && (
          <Row align="middle" justify="center" gutter={[0, 16]}>
            <Link
              className="small-y-margin"
              style={{ color: 'var(--grey-dark)' }}
              onClick={() => setLimit(channelMembers.length + defaultLimit)}
            >
              {Languages.t('scenes.client.channelbar.channelmemberslist.loader')}
            </Link>
          </Row>
        )}
      </PerfectScrollbar>
    </ObjectModal>
  );
};

export default ChannelMembersList;
