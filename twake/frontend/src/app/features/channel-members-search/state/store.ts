import { atomFamily, selectorFamily, SerializableParam } from "recoil";
import { ChannelMemberType, ChannelPendingEmail, ChannelMemberWithUser } from "../types/channel-members";

// ChannelMemberType
export const listChannelMembersStateFamily = atomFamily<ChannelMemberWithUser[], SerializableParam>({
    key: 'list-channel-members-state',
    default: []
})

export const listPendingEmailsStateFamily = atomFamily<ChannelPendingEmail[], SerializableParam>({
    key: 'list-pending-emails-state',
    default: []
})

export const getChannelMember = selectorFamily<ChannelMemberWithUser | null, {channelId: string, userId: string}>({
    key: 'get-channel-member',
    get: 
        ({ channelId, userId }) => 
        ({ get }) => {
            const members = get(listChannelMembersStateFamily(channelId));

            const member = (members || []).find(m => m.user_id === userId);

            if(member) {
                return member;
            }

            return null;
        }
});

export const getPendingEmail = selectorFamily<ChannelPendingEmail | null, {channelId: string, email: string}>({
    key: 'get-pending-email',
    get: 
        ({ channelId, email }) =>
        ({ get }) => {
            const pendingEmails = get(listPendingEmailsStateFamily(channelId));

            const guest = (pendingEmails || []).find(m => m.email === email);

            if(guest) {
                return guest;
            }

            return null;
        }
});
