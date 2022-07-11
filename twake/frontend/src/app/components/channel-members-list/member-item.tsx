import Avatar from "app/atoms/avatar";
import { Button } from "app/atoms/button/button";
import { ChannelMemberWithUser } from "app/features/channel-members.global/types/channel-members";
import Languages from "app/features/global/services/languages-service";
import UsersService from 'app/features/users/services/current-user-service';
import useRouterCompany from "app/features/router/hooks/use-router-company";
import useRouterWorkspace from "app/features/router/hooks/use-router-workspace";
import useRouterChannel from "app/features/router/hooks/use-router-channel";
import { useChannelMember } from "app/features/channel-members.global/hooks/member-hook";


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

    const parameters = { companyId, workspaceId, channelId};

    const {leave, loading} = useChannelMember(userId || '', parameters);

    const isCurrentUser = () : boolean => {
        const currentUserId: string = UsersService.getCurrentUserId();

        return props.userId === currentUserId;
    };

    const renderUserAction = () : JSX.Element => {

        return isCurrentUser() ?
            (
                <Button 
                    theme="danger"
                    size="sm"
                    loading={loading}
                    onClick={() => leave(props.userId || '')}
                >
                    {Languages.t('scenes.app.channelsbar.channel_leaving')}
                </Button>
            ) : (
                <Button
                    theme="primary"
                    size="sm"
                    loading={loading}
                    onClick={() => leave(props.userId || '')}
                >
                    {Languages.t('scenes.client.channelbar.channelmemberslist.menu.option_2')}
                </Button>
            );
    }

    return (
        <div className="flex justify-between py-1 hover:bg-zinc-200" key={member.user_id}>
            <div className="flex items-center space-x-1">
                <Avatar className="" size="xs" avatar={UsersService.getThumbnail(member.user)} />
                <div>
                    <span className="font-bold">{ first_name }</span>
                    <span className="pl-2">{ email }</span>
                </div>
            </div>
            <div>
                {renderUserAction()}
            </div>
        </div>
    )
}