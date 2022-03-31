import React, { createRef, useEffect } from 'react';
import { Col, Row, Typography } from 'antd';
import { getUserParts } from 'app/components/member/user-parts';
import './ChannelRow.scss';
import RouterServices from 'app/features/router/services/router-service';
import ModalManager from 'app/components/modal/modal-manager';
import UserServices from 'app/features/users/services/current-user-service';
import { useDirectChannels } from 'app/features/channels/hooks/use-direct-channels';

type PropsType = {
  userIds: string[];
  key?: string;
  type?: string;
  active?: boolean;
};

const DirectChannelRow = ({ key, userIds, active }: PropsType) => {
  const { companyId } = RouterServices.getStateFromRoute();
  const { openDiscussion } = useDirectChannels();

  const { avatar, name, companyRole, users } = getUserParts({
    usersIds: userIds,
  });

  const upsertDirectMessage = async (): Promise<any> => {
    await openDiscussion(userIds);
    return ModalManager.closeAll();
  };

  const ref = createRef<HTMLDivElement>();

  useEffect(() => {
    if (active) {
      ref.current?.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
    }
  });

  return (
    <Row
      key={key}
      ref={ref}
      justify="space-between"
      align="middle"
      className={`channel-row ${active ? 'channel-row-selected' : ''}`}
      onClick={upsertDirectMessage}
    >
      <Col className="small-right-margin" style={{ display: 'flex', alignItems: 'center' }}>
        {avatar}
      </Col>
      <Col flex="auto">
        <Typography.Text strong>{name}</Typography.Text>
      </Col>
      {UserServices.getUserRole(users[0], companyId) === 'guest' && <Col>{companyRole}</Col>}
    </Row>
  );
};

export default DirectChannelRow;
