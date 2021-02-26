import RouterServices from 'app/services/RouterService';
import { getUserParts, useUsersListener } from 'app/components/Member/UserParts';
import Collections from 'app/services/CollectionsReact/Collections';
import { ChannelMemberResource } from 'app/models/Channel';

export default (props: { workspaceId: string }): JSX.Element => {
  const { companyId, channelId } = RouterServices.useRouteState(({ companyId, channelId }) => {
    return { companyId, channelId };
  });

  const collectionPath: string = `/channels/v1/companies/${companyId}/workspaces/${props.workspaceId}/channels/${channelId}/members/`;
  const channelMembersCollection = Collections.get(collectionPath, ChannelMemberResource);

  const members = channelMembersCollection
    .useWatcher({}, { limit: 10 })
    .map(i => i.data.user_id || '');
  useUsersListener(members);
  const { avatar } = getUserParts({ usersIds: members, keepMyself: true, max: 7 });

  return avatar;
};
