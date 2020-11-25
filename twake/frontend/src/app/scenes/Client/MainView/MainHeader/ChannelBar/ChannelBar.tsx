import React from 'react';
import { Button, Col, Row, Typography } from 'antd';
import Emojione from 'app/components/Emojione/Emojione';
import Icon from 'app/components/Icon/Icon';
import { capitalize } from 'lodash';
import ModalManager from 'services/Modal/ModalManager';
import ChannelMembersList from 'scenes/Client/ChannelsBar/Modals/ChannelMembersList';
import RouterServices from 'app/services/RouterService';
import ChannelsService from 'app/services/channels/ChannelsService';
import { Lock } from 'react-feather';
import Search from '../Search';

type PropsType = {
  channelId: string;
};

type ButtonType = {
  style?: object;
  text?: string;
  onClick?: () => any;
  icon?: string;
};

export default (props: PropsType): JSX.Element => {
  const { channelId } = RouterServices.useStateFromRoute();

  ChannelsService.useWatcher(() => !!ChannelsService.getCurrentChannelCollection());
  const channelCollection = ChannelsService.getCurrentChannelCollection();
  if (!channelCollection?.useWatcher) {
    return <Col></Col>;
  }
  const channel = channelCollection.useWatcher({ id: channelId })[0];

  if (!channel) {
    return <Col></Col>;
  }

  const buttonsList: ButtonType[] = [
    {
      style: { backgroundColor: 'var(--grey-light)' },
      text: 'members',
      onClick: () => {
        return ModalManager.open(
          <ChannelMembersList
            channelId={props.channelId}
            channelName={'' /*channel.data.name*/}
            closable
          />,
          {
            position: 'center',
            size: { width: '500px', minHeight: '329px' },
          },
        );
      },
    },
    {
      style: {},
      text: 'activity',
      onClick: () => console.log('activity'),
    },
    {
      style: {},
      icon: 'ellipsis-h',
      onClick: () => console.log('members'),
    },
  ];

  return (
    <Row
      justify="space-between"
      align="middle"
      style={{ lineHeight: '47px', padding: 0, flexWrap: 'nowrap' }}
    >
      <Col>
        <span className="left-margin" style={{ display: 'flex', alignItems: 'center' }}>
          <div className="small-right-margin" style={{ lineHeight: 0, width: 16 }}>
            <Emojione type={channel.data.icon || ''} />
          </div>
          <Typography.Text className="small-right-margin" strong>
            {capitalize(channel.data.name)}
          </Typography.Text>
          {channel.data.visibility === 'private' && (
            <Lock size={16} className="small-right-margin" />
          )}
          <Typography.Text>{' ' + (channel.data.description || '')}</Typography.Text>
        </span>
      </Col>

      <Col>
        <Row align="middle" gutter={[8, 0]} style={{ flexWrap: 'nowrap' }}>
          {props.channelId &&
            buttonsList.map((button: ButtonType, index: number) => {
              return (
                <Col key={`key_${index}`}>
                  <Button
                    icon={
                      button.icon ? <Icon type={button.icon} className="m-icon-small" /> : false
                    }
                    onClick={button.onClick}
                    style={button.style ? button.style : {}}
                  >
                    {button.text && <Typography.Text>{capitalize(button.text)}</Typography.Text>}
                  </Button>
                </Col>
              );
            })}
          <Search />
        </Row>
      </Col>
    </Row>
  );
};
