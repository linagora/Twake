import { useChannelMembers } from "app/features/channel-members.global/hooks/members-hook"
import Languages from "app/features/global/services/languages-service";
import { MemberItem } from "./member-item";
import { Input } from 'app/atoms/input/input-text';
import { useChannelPendingEmails } from "app/features/channel-members.global/hooks/pending-emails-hook";
import { SearchIcon } from "@heroicons/react/solid";
import { InputDecorationIcon } from "app/atoms/input/input-decoration-icon";
import { EmailItem } from "./email-item";
import { useSearchChannelMember } from "app/features/channel-members.global/hooks/search-channel-member";
import { SearchChannelMemberInputState } from "app/features/channel-members.global/state/search-channel-member";
import { useRecoilState } from "recoil";
import { useSearchChannelPendingEmail } from "app/features/channel-members.global/hooks/search-pending-email";
import { useSearchUsers } from 'app/features/users/hooks/use-search-user-list';
import { UserItem } from "./user-item";
import { ChannelMemberWithUser } from "app/features/channel-members.global/types/channel-members";
import { UserType } from 'app/features/users/types/user';
import _ from "lodash";
import Strings from "app/features/global/utils/strings";

export const ChannelMembersListModal = (): JSX.Element => {
    const { channelMembers, refresh: refreshChannelMember } = useChannelMembers();
    const {listChannelMembers, loading: loadingSearchChannnelMemer} = useSearchChannelMember();

    const [searchState, setSearchState] = useRecoilState(SearchChannelMemberInputState);

    const { pendingEmails, refresh: refreshPendingEmail } = useChannelPendingEmails();
    const { filteredPendingEmails  } = useSearchChannelPendingEmail();

    const { result: filteredUsers, } = useSearchUsers({scope:'company'});

    const pendingEmailList = searchState ? filteredPendingEmails : pendingEmails;
    const channelMembersList = searchState ? listChannelMembers : channelMembers;
    
    const usersList = searchState ? 
        filteredUsers.filter(({ username, email, first_name, last_name }) =>
            searchState
                .split(' ')
                .every(
                    word =>
                    Strings.removeAccents(`${username} ${email} ${first_name} ${last_name}`)
                        .toLocaleLowerCase()
                        .indexOf(Strings.removeAccents(word).toLocaleLowerCase()) > -1,
                ),
        )
        : filteredUsers;
    

    const onRefreshPendingList = () => {
        refreshPendingEmail();
    }

    const onRefreshChannelMemberList = () => {
        refreshChannelMember();
    }

    return (
        <div className="flex flex-col max-w-full space-y-1">
            <div>
                <InputDecorationIcon
                    suffix={SearchIcon}
                    input={({ className }) => (
                        <Input
                            className={className}
                            placeholder={Languages.t('scenes.client.channelbar.channelmemberslist.autocomplete')}
                            onChange={e => setSearchState(e.target.value)}
                            value={searchState}
                        />
                    )}
                />
            </div>
            <div>
                <hr />
                { pendingEmailList && pendingEmailList.map((item, index) => {
                    return (
                        <div key={`key_${index}`}>
                            <EmailItem email={item} onRefreshPendingList={onRefreshPendingList} />
                        </div>
                    )
                })}
                <hr />
                { channelMembersList && channelMembersList.map(cMember => {
                    return (
                        <div key={cMember.user_id}>
                            <MemberItem 
                                userId={cMember.user_id}
                                member={cMember}
                                onRefreshChannelMemberList={onRefreshChannelMemberList}
                            />
                        </div>
                    )
                })}
                <hr />
                { 
                usersList &&
                _.differenceBy(usersList, channelMembersList || [], 
                    (item) => (item as ChannelMemberWithUser).user_id || (item as UserType).id).map(user => {
                    return (
                        <div key={user.id}>
                            <UserItem userId={user.id || ''} onRefreshChannelMemberList={onRefreshChannelMemberList} />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}