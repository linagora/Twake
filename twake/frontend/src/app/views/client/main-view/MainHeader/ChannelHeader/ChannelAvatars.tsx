import { getUserParts } from 'app/components/member/user-parts';
import { useUsersListener } from 'app/features/users/hooks/use-users-listener';
import useRouterCompany from 'app/features/router/hooks/use-router-company';
import useRouterChannel from 'app/features/router/hooks/use-router-channel';
import { useChannelMembers } from 'app/features/channel-members-search/hooks/members-hook';

export default ({ workspaceId }: { workspaceId: string }): JSX.Element => {
  const companyId = useRouterCompany();
  const channelId = useRouterChannel();

  const { channelMembers } = useChannelMembers({ companyId, workspaceId, channelId });

  const members = channelMembers.filter((_m, i) => i < 10).map(m => m.user_id || '');

  useUsersListener(members);

  const { avatar } = getUserParts({ usersIds: members, keepMyself: true, max: 7 });

  return avatar;
};
