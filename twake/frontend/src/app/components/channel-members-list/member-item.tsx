import Avatar from 'app/atoms/avatar';
import { Button } from 'app/atoms/button/button';
import { ChannelMemberWithUser } from 'app/features/channel-members-search/types/channel-members';
import Languages from 'app/features/global/services/languages-service';
import UsersService from 'app/features/users/services/current-user-service';
import useRouterCompany from 'app/features/router/hooks/use-router-company';
import useRouterWorkspace from 'app/features/router/hooks/use-router-workspace';
import useRouterChannel from 'app/features/router/hooks/use-router-channel';
import { useChannelMember } from 'app/features/channel-members-search/hooks/member-hook';
import { LogoutIcon } from '@heroicons/react/outline';
import { Tooltip } from 'antd';
import { ButtonConfirm } from 'app/atoms/button/confirm';

type IMemberProps = {
  member: ChannelMemberWithUser;
  userId?: string;
};

export const MemberItem = (props: IMemberProps): JSX.Element => {
  const { member, userId } = props;
  const { first_name, email } = member.user;
  const companyId = useRouterCompany();
  const workspaceId = useRouterWorkspace();
  const channelId = useRouterChannel();

  const parameters = { companyId, workspaceId, channelId };

  const { leave, loading } = useChannelMember(userId || '', parameters);

  const isCurrentUser = (): boolean => {
    const currentUserId: string = UsersService.getCurrentUserId();

    return props.userId === currentUserId;
  };

  return (
    <>
      <div className="w-8 flex items-center ">
        <Avatar className="" size="xs" avatar={UsersService.getThumbnail(member.user)} />
      </div>
      <div className="grow flex items-center overflow-hidden ">
        <div className="whitespace-nowrap overflow-hidden text-ellipsis">
          <span className="font-bold">{first_name}</span>
          <span className="pl-2">{email}</span>
        </div>
      </div>
      <div>
        {isCurrentUser() ? (
          <Tooltip placement="top" title={Languages.t('scenes.app.channelsbar.channel_leaving')}>
            <ButtonConfirm
              theme="danger"
              size="sm"
              icon={LogoutIcon}
              loading={loading}
              onClick={() => leave(props.userId || '')}
            />
          </Tooltip>
        ) : (
          <Tooltip
            placement="top"
            title={Languages.t('scenes.client.channelbar.channelmemberslist.menu.option_2')}
          >
            <ButtonConfirm
              theme="primary"
              size="sm"
              icon={LogoutIcon}
              loading={loading}
              onClick={() => leave(props.userId || '')}
            />
          </Tooltip>
        )}
      </div>
    </>
  );
};
