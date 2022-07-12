import { useChannelMembers } from "app/features/channel-members.global/hooks/members-hook"
import Languages from "app/features/global/services/languages-service";
import { MemberItem } from "./member-item";
import { Input } from 'app/atoms/input/input-text';
import { useChannelPendingEmails } from "app/features/channel-members.global/hooks/pending-emails-hook";
import { SearchIcon } from "@heroicons/react/solid";
import { InputDecorationIcon } from "app/atoms/input/input-decoration-icon";
import { EmailItem } from "./email-item";
import { useSearchChannelMembers } from "app/features/channel-members.global/hooks/search-channel-member";
import { SearchChannelMemberInputState } from "app/features/channel-members.global/state/search-channel-member";
import { useRecoilState } from "recoil";
import { useSearchChannelPendingEmail } from "app/features/channel-members.global/hooks/search-pending-email";
import { useSearchUsers } from 'app/features/users/hooks/use-search-user-list';
import { UserItem } from "./user-item";
import { ChannelMemberWithUser } from "app/features/channel-members.global/types/channel-members";
import { UserType } from 'app/features/users/types/user';
import _ from "lodash";
import Strings from "app/features/global/utils/strings";
import { useEffect, useState } from "react";
import { Button } from "app/atoms/button/button";
import { PlusIcon } from '@heroicons/react/solid';
import useRouterChannel from "app/features/router/hooks/use-router-channel";
import { usePendingEmail } from "app/features/channel-members.global/hooks/pending-email-hook";
import PerfectScrollbar from 'react-perfect-scrollbar';

export const ChannelMembersListModal = (props: { channelId: string}): JSX.Element => {
    const channelId = useRouterChannel();

    const { channelMembers } = useChannelMembers();
    const {listChannelMembers, } = useSearchChannelMembers(props.channelId || channelId);

    const [searchState, setSearchState] = useRecoilState(SearchChannelMemberInputState);

    const { pendingEmails } = useChannelPendingEmails();
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
    
    const [addEmailSuggestion, setEmailSuggestion] = useState<boolean>(false);
    useEffect(() => {
        if(!pendingEmailList.length && !!searchState.length) {
            setEmailSuggestion(true)
        }

    }, [searchState]);

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
                <PerfectScrollbar
                    options={{ suppressScrollX: true, suppressScrollY: false }}
                    component="div"
                    style={{ width: '100%', height: '200px' }}
                >
                    <div>
                        {addEmailSuggestion && (
                            <EmailSuggestion email={searchState} />
                        )}
                        { pendingEmailList && pendingEmailList.map((item, index) => {
                            return (
                                <div key={`key_${index}`}>
                                    <EmailItem email={item} />
                                </div>
                            )
                        })}
                        { channelMembersList && channelMembersList.map(cMember => {
                            return (
                                <div key={cMember.user_id}>
                                    <MemberItem 
                                        userId={cMember.user_id}
                                        member={cMember}
                                    />
                                </div>
                            )
                        })}
                        { 
                        usersList &&
                        _.differenceBy(usersList, channelMembersList || [], 
                            (item) => (item as ChannelMemberWithUser).user_id || (item as UserType).id).map(user => {
                            return (
                                <div key={user.id}>
                                    <UserItem userId={user.id || ''} />
                                </div>
                            )
                        })}
                    </div>
                </PerfectScrollbar>
            </div>
        </div>
    )
}

const EmailSuggestion = ({ email }: {email: string}) => {
    const { addInvite } = usePendingEmail(email);

    if (!email || !Strings.verifyMail(email)) {
        return <></>;
    }

    return (
        <div className="flex p-2 hover:bg-zinc-200">
            <Button
                className="my-2 mx-2"
                theme="outline"
                icon={PlusIcon}
                onClick={() => addInvite()}
            >
                { email }
            </Button>
        </div>
    )
}
