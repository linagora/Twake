import React, { useEffect } from 'react';
import { Button, Col, Input, Row, Typography } from 'antd';
import Emojione from 'app/components/Emojione/Emojione';
import Icon from 'app/components/Icon/Icon';
import { capitalize } from 'lodash';
import ModalManager from 'services/Modal/ModalManager';
import ChannelMembersList from 'scenes/Client/ChannelsBar/ChannelMembersList';
import Shortcuts, { defaultShortcutsMap, ShortcutType } from 'app/services/ShortcutService';
import WorkspaceChannelList from 'app/components/WorkspaceChannelList';

type PropsType = {
  channelName: string;
  channelIcon: any;
  channelId: string;
};

type ButtonType = {
  style?: object;
  text?: string;
  onClick?: () => any;
  icon?: string;
};

export default (props: PropsType): JSX.Element => {
  const openWorkspaceChannelList: ShortcutType = {
    shortcut: defaultShortcutsMap.SEARCH_CHANNEL,
    handler: (event: any) => {
      event.preventDefault();
      if (ModalManager.isOpen() === false) {
        return ModalManager.open(<WorkspaceChannelList />, {
          position: 'center',
          size: { width: '500px' },
        });
      } else return ModalManager.close();
    },
  };

  useEffect(() => {
    Shortcuts.addShortcut(openWorkspaceChannelList);
    return () => {
      Shortcuts.removeShortcut(openWorkspaceChannelList);
    };
  }, []);

  const buttonsList: ButtonType[] = [
    {
      style: { backgroundColor: 'var(--grey-light)' },
      text: 'members',
      onClick: () => {
        return ModalManager.open(
          <ChannelMembersList
            channelId={props.channelId}
            channelName={props.channelName}
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
            <Emojione type={props.channelIcon} />
          </div>
          <Typography.Text>{capitalize(props.channelName)}</Typography.Text>
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
