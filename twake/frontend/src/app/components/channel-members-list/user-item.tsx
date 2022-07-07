import Avatar from 'app/atoms/avatar';
import UsersService from 'app/features/users/services/current-user-service';
import { useUser } from 'app/features/users/hooks/use-user';
import { useRecoilState } from 'recoil';
import { LoadingState } from 'app/features/global/state/atoms/Loading';
import ChannelMembersAPIClient from "app/features/channel-members.global/api/members-api-client";
import useRouterCompany from 'app/features/router/hooks/use-router-company';
import useRouterChannel from 'app/features/router/hooks/use-router-channel';
import useRouterWorkspace from 'app/features/router/hooks/use-router-workspace';
import { Button } from 'app/atoms/button/button';
import Languages from "app/features/global/services/languages-service";
import { useState } from 'react';

type IUserProps = {
    userId: string;
    onRefreshChannelMemberList: () => void;
};

export const UserItem = (props : IUserProps): JSX.Element => {
    const { userId } = props;
    const user = useUser(userId || '');
    
    if (!user) {
        return <></>;
    }

    const companyId = useRouterCompany();
    const workspaceId = useRouterWorkspace();
    const channelId = useRouterChannel();
    const [full_name, avatar] = [UsersService.getFullName(user), UsersService.getThumbnail(user)];
    const [loading, setLoading] = useRecoilState(LoadingState(`addUserAsChannelMember#${userId}`));

    const addUserAsChannelMember = async (userId: string) => {
        setLoading(true);
        
        await ChannelMembersAPIClient.addMember({user_id: userId}, {
            companyId,
            workspaceId,
            channelId
        })
        .then(() => {
            setLoading(false);
            props.onRefreshChannelMemberList();
        });
    }

    return (
        <div className="flex justify-between py-1 hover:bg-zinc-200" key={userId}>
            <div className="flex items-center space-x-1">
                <Avatar size="xs" avatar={avatar} />
                <div>
                    <span className="font-bold">{ full_name }</span>
                    <span className="pl-2">{ user.email }</span>
                </div>
            </div>
            <div>
                <Button
                    theme="primary"
                    size="sm"
                    loading={loading}
                    onClick={() => addUserAsChannelMember(userId || '')}
                >
                    {Languages.t('general.add')}
                </Button>
            </div>
        </div>
    )
};
