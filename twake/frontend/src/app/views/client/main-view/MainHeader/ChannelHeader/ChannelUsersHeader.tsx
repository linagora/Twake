import { Col, Typography } from 'antd';

import * as Text from 'app/atoms/text';
import { getUserParts } from 'app/components/member/user-parts';
import { ChannelType } from 'app/features/channels/types/channel';
import Languages from 'app/features/global/services/languages-service';
import { useCurrentUser } from 'app/features/users/hooks/use-current-user';
import { useOnlineUser } from 'app/features/users/hooks/use-online-user';
import { useUser } from 'app/features/users/hooks/use-user';
import { useUsersListener } from 'app/features/users/hooks/use-users-listener';
import moment from 'moment';

type Props = {
  channel: ChannelType;
};

export default (props: Props) => {
  useUsersListener(props.channel.members);
  const { avatar, name } = getUserParts({
    usersIds: props.channel.members || [],
  });

  const { user: currentUser } = useCurrentUser();

  const otherMembers = (props.channel.members || []).filter(u => u !== currentUser?.id) || [];
  const user = useUser(otherMembers[0] || '');
  const userOnlineStatus = useOnlineUser(user?.id as string);
  const lastSeen = userOnlineStatus?.lastSeen || user?.last_seen || 0;

  return (
    <Col>
      <span
        className="left-margin text-overflow overflow-hidden whitespace-nowrap text-ellipsis"
        style={{ display: 'flex', alignItems: 'center' }}
      >
        <div className="small-right-margin" style={{ lineHeight: 0 }}>
          {avatar}
        </div>
        <Typography.Text
          className="small-right-margin"
          style={{ textTransform: 'capitalize' }}
          strong
        >
          {name}
        </Typography.Text>
        {otherMembers.length === 1 &&
          lastSeen > 0 &&
          lastSeen > Date.now() - 1000 * 60 * 60 * 24 * 70 &&
          currentUser?.id !== user?.id && (
            <>
              {!userOnlineStatus.connected && (
                <Text.Info className="small-right-margin">
                  {Languages.t('general.user.connected')} {moment(lastSeen).fromNow()}
                </Text.Info>
              )}
              {!!userOnlineStatus.connected && (
                <Text.Info className="small-right-margin">
                  {Languages.t('general.user.connected')}
                </Text.Info>
              )}
            </>
          )}
      </span>
    </Col>
  );
};
