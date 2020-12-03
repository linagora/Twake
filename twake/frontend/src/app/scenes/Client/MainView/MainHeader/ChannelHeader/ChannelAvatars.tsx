import RouterServices from 'app/services/RouterService';
import { getChannelParts, useChannelListener } from 'app/components/Channel/UserChannelParts';
import Collections from 'app/services/CollectionsReact/Collections';
import { ChannelMemberResource } from 'app/models/Channel';

export default (props: { workspaceId: string }): JSX.Element => {
  const { companyId, channelId } = RouterServices.useStateFromRoute();

  const collectionPath: string = `/channels/v1/companies/${companyId}/workspaces/${props.workspaceId}/channels/${channelId}/members/`;
  const channelMembersCollection = Collections.get(collectionPath, ChannelMemberResource);

  const members = channelMembersCollection
    .useWatcher({}, { limit: 10 })
    .map(i => i.data.user_id || '');
  useChannelListener(members);
  const [avatar] = getChannelParts({ usersIds: members, keepMyself: true, max: 10 });

  return avatar;
};
