import React from 'react';
import { Button, Col, Input, Row, Typography } from 'antd';
import Emojione from 'app/components/Emojione/Emojione';
import Icon from 'app/components/Icon/Icon';
import { capitalize } from 'lodash';
import ModalManager from 'services/Modal/ModalManager';
import ChannelMembersList from 'scenes/Client/ChannelsBar/Modals/ChannelMembersList';
import { ChannelResource } from 'app/models/Channel';
import RouterServices from 'app/services/RouterService';
import ChannelsService from 'app/services/channels/ChannelsService';

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

  const channelCollection = ChannelsService.getCurrentChannelCollection();
  if (!channelCollection) {
    return <></>;
  }

  let channel: ChannelResource;
  if (channelCollection.useWatcher) {
    channel = channelCollection.useWatcher({ id: channelId })[0];
  } else {
    channel = new ChannelResource({});
  }

  if (!channel) {
    return <></>;
  }

  const buttonsList: ButtonType[] = [
    {
      style: { backgroundColor: 'var(--grey-light)' },
      text: 'members',
      onClick: () => {
        return ModalManager.open(
          <ChannelMembersList
            channelId={props.channelId}
            channelName={channel.data.name}
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
          <div className="small-right-margin" style={{ lineHeight: 0 }}>
            <Emojione type={channel.data.icon || ''} />
          </div>
          <Typography.Text strong>{capitalize(channel.data.name)}</Typography.Text>
          <Typography.Text>{' ' + channel.data.description}</Typography.Text>
        </span>
      </Col>

      {props.channelId && (
        <Col>
          <Row align="middle" gutter={[8, 0]} style={{ flexWrap: 'nowrap' }}>
            {buttonsList.map((button: ButtonType, index: number) => {
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
            <Col>
              <Input
                prefix={
                  <Icon
                    type="search"
                    className="m-icon-small"
                    style={{ color: 'var(--grey-dark)' }}
                  />
                }
                placeholder={'search'}
              />
            </Col>
          </Row>
        </Col>
      )}
    </Row>
  );
};
