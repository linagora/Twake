import Avatar from "app/atoms/avatar";
import { Button } from "app/atoms/button/button";
import { ChannelMemberWithUser } from "app/features/channel-members.global/types/channel-members";
import Languages from "app/features/global/services/languages-service";
import UsersService from 'app/features/users/services/current-user-service';
import useRouterCompany from "app/features/router/hooks/use-router-company";
import useRouterWorkspace from "app/features/router/hooks/use-router-workspace";
import useRouterChannel from "app/features/router/hooks/use-router-channel";
import ChannelMembersAPIClient from "app/features/channel-members.global/api/members-api-client";
import { useState } from "react";


type IMemberProps = {
    member: ChannelMemberWithUser,
    userId?: string;
    onRefreshChannelMemberList: () => void;
};

export const MemberItem = (props: IMemberProps): JSX.Element => {
    const { member } = props;
    const { first_name, email } = member.user;
    const [loading, setLoading] = useState<boolean>(false);

    const companyId = useRouterCompany();
    const workspaceId = useRouterWorkspace();
    const channelId = useRouterChannel();

    const isCurrentUser = () : boolean => {
        const currentUserId: string = UsersService.getCurrentUserId();

        return props.userId === currentUserId;
    };


    const leaveChannel = async (userId: string) => {
        setLoading(true);
        
        await ChannelMembersAPIClient.deleteMember(userId, {
            companyId,
            workspaceId,
            channelId
        })
        .then(() => {
            setLoading(false);
            props.onRefreshChannelMemberList();
        });
    }

    const removeFromChannel = async (userId: string) => {
        setLoading(true);
        
        await ChannelMembersAPIClient.deleteMember(userId, {
            companyId,
            workspaceId,
            channelId
        })
        .then(() => {
            setLoading(false)
            props.onRefreshChannelMemberList();
        });
    }

    const renderUserAction = () : JSX.Element => {

        return isCurrentUser() ?
            (
                <Button 
                    theme="danger"
                    size="sm"
                    loading={loading}
                    onClick={() => leaveChannel(props.userId || '')}
                >
                    {Languages.t('scenes.app.channelsbar.channel_leaving')}
                </Button>
            ) : (
                <Button
                    theme="primary"
                    size="sm"
                    loading={loading}
                    onClick={() => removeFromChannel(props.userId || '')}
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