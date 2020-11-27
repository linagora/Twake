import React, { FC, useState, useEffect } from 'react';
import Languages from 'services/languages/languages.js';
import UsersService from 'services/user/user.js';
import { UserType } from 'app/models/User';
import Icon from 'components/Icon/Icon';
import ObjectModal from 'components/ObjectModal/ObjectModal';
import RouterServices from 'app/services/RouterService';
import { Avatar, Button, Col, Row, Typography, Input } from 'antd';
import { ChannelMemberResource } from 'app/models/Channel';
import Collections from 'services/CollectionsReact/Collections';
import DepreciatedCollections from 'app/services/Depreciated/Collections/Collections.js';
import ModalManager from 'services/Modal/ModalManager';
import ChannelMembersEditor from 'scenes/Client/ChannelsBar/Modals/ChannelMembersEditor';
import Menu from 'components/Menus/Menu.js';
import { Search } from 'react-feather';

type Props = {
  closable?: boolean;
  channelId?: string;
  channelName?: string;
};

const { Text, Link } = Typography;

const ChannelMembersList: FC<Props> = props => {
  const { companyId, workspaceId, channelId } = RouterServices.useStateFromRoute();

  const collectionPath: string = `/channels/v1/companies/${companyId}/workspaces/${workspaceId}/channels/${
    props.channelId || channelId
  }/members/`;
  const channelMembersCollection = Collections.get(collectionPath, ChannelMemberResource);

  const channelMembers = channelMembersCollection.useWatcher({});

  const onSearchMembers = (text: string, callback: any) => {
    return UsersService.search(
      text,
      {
        scope: 'workspace',
        workspace_id: workspaceId,
      },
      (res: any) => {
        callback(res);
      },
    );
  };

  return (
    <ObjectModal
      title={Languages.t('scenes.client.channelbar.channelmemberslist.title', [
        channelMembers.length,
        props.channelName,
      ])}
      closable={props.closable ? props.closable : false}
    >
      <div className="x-margin bottom-margin">
        <Row align="middle" gutter={[28, 0]} style={{ marginBottom: '24px' }}>
          <Col flex={14}>
            <Input
              size={'large'}
              suffix={<Search size={20} style={{ color: 'var(--grey-dark)' }} />}
              placeholder={Languages.t('scenes.client.channelbar.channelmemberslist.autocomplete')}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onSearchMembers(e.target.value, (array: UserType[]) =>
                  console.log('Search -->', array),
                )
              }
            />
          </Col>
          <Col>
            <Button
              style={{ width: '84px', height: '32px', padding: '0' }}
              type="primary"
              onClick={() => {
                return ModalManager.open(
                  <ChannelMembersEditor
                    channelName={props.channelName}
                    onClose={() => ModalManager.closeAll()}
                  />,
                  {
                    position: 'center',
                    size: { width: '500px', minHeight: '329px' },
                  },
                );
              }}
            >
              {Languages.t('scenes.client.channelbar.channelmemberslist.invitebtn')}
            </Button>
          </Col>
        </Row>
      </div>
      {channelMembers && (
        <div className="x-margin">
          {channelMembers.map((item: ChannelMemberResource) => {
            const user: UserType = DepreciatedCollections.get('users').find(item.data.user_id);

            return (
              <Row key={`key_${item.data.user_id}`} align="middle" justify="start" gutter={[8, 8]}>
                <Col>
                  <Avatar size={24} src={UsersService.getThumbnail(user)} />
                </Col>
                <Col flex={4}>
                  <Text strong>{UsersService.getFullName(user)}</Text> @{user.username}
                </Col>
                <Col>
                  <Menu
                    menu={[
                      {
                        type: 'menu',
                        text: Languages.t(
                          'scenes.client.channelbar.channelmemberslist.menu.option_1',
                        ),
                      },
                      {
                        type: 'menu',
                        text: (
                          <div style={{ color: 'var(--red)' }}>
                            {Languages.t(
                              'scenes.client.channelbar.channelmemberslist.menu.option_2',
                            )}
                          </div>
                        ),
                      },
                    ]}
                  >
                    <Icon type="ellipsis-h" className="m-icon-small" />
                  </Menu>
                </Col>
              </Row>
            );
          })}
        </div>
      )}
      {channelMembers.length >= 10 && (
        <Row align="middle" justify="center" gutter={[0, 16]}>
          <Link
            className="small-y-margin"
            style={{ color: 'var(--grey-dark)' }}
            onClick={() => console.log('show list +5 members')}
          >
            {Languages.t('scenes.client.channelbar.channelmemberslist.loader')}
          </Link>
        </Row>
      )}
    </ObjectModal>
  );
};

export default ChannelMembersList;
