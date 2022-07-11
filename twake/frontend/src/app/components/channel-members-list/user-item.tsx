import Avatar from 'app/atoms/avatar';
import UsersService from 'app/features/users/services/current-user-service';
import { useUser } from 'app/features/users/hooks/use-user';
import { Button } from 'app/atoms/button/button';
import Languages from "app/features/global/services/languages-service";
import { useChannelMember } from 'app/features/channel-members.global/hooks/member-hook';

type IUserProps = {
    userId: string;
};

export const UserItem = (props : IUserProps): JSX.Element => {
    const { userId } = props;
    const user = useUser(userId || '');
    
    if (!user) {
        return <></>;
    }

    const {addMember, loading} = useChannelMember(userId || '');
    const [full_name, avatar] = [UsersService.getFullName(user), UsersService.getThumbnail(user)];

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
                    onClick={() => addMember(userId || '')}
                >
                    {Languages.t('general.add')}
                </Button>
            </div>
        </div>
    )
};
