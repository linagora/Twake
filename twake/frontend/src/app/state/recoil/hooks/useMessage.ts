import MessageAPIClient from 'app/services/Apps/Messages/clients/MessageAPIClient';
import _ from 'lodash';
import User from 'app/services/user/UserService';
import { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import { AtomMessageKey, MessageState, MessageStateExtended } from '../atoms/Messages';
import { NodeMessage } from 'app/models/Message';
import { messageToMessageWithReplies } from './useMessages';

export const useMessage = (partialKey: AtomMessageKey) => {
  const key = { ...partialKey, id: partialKey.id || partialKey.threadId };
  const [message, setValue] = useRecoilState(MessageState(key));
  useEffect(() => {
    MessageStateExtended.setHandler(key.id, setValue, message);
  }, []);

  const get = async () => {
    const message = await MessageAPIClient.get(
      partialKey.companyId,
      partialKey.threadId,
      partialKey.id || '',
    );
    if (message) {
      MessageStateExtended.set(message.id, message);
    }
  };

  const save = async (message: NodeMessage) => {
    const updated = await MessageAPIClient.save(partialKey.companyId, partialKey.threadId, message);
    if (updated) setValue(messageToMessageWithReplies(updated));
  };

  const move = async (targetThread: string) => {
    const updated = await MessageAPIClient.save(
      partialKey.companyId,
      partialKey.threadId,
      { ...message, thread_id: targetThread },
      { movedFromThread: message.thread_id },
    );
    if (updated) setValue(messageToMessageWithReplies(updated));
  };

  const remove = async () => {
    const updated = await MessageAPIClient.delete(
      partialKey.companyId,
      partialKey.threadId,
      partialKey.id || '',
    );
    if (updated) setValue(messageToMessageWithReplies(updated));
  };

  const bookmark = async (bookmarkId: string, status: boolean = true) => {
    const updated = await MessageAPIClient.bookmark(
      partialKey.companyId,
      partialKey.threadId,
      partialKey.id || '',
      bookmarkId,
      status,
    );
    if (updated) setValue(messageToMessageWithReplies(updated));
  };

  const pin = async (status: boolean = true) => {
    const updated = await MessageAPIClient.pin(
      partialKey.companyId,
      partialKey.threadId,
      partialKey.id || '',
      status,
    );
    if (updated) setValue(messageToMessageWithReplies(updated));
  };

  const react = async (
    emojis: string[],
    mode: 'add' | 'toggle' | 'remove' | 'replace' = 'toggle',
  ) => {
    let userReactions = (message.reactions || [])
      ?.filter(r => r.users.includes(User.getCurrentUserId()))
      .map(e => e.name);
    if (mode === 'replace') {
      userReactions = emojis;
    } else {
      emojis.forEach(emoji => {
        if (mode === 'add') {
          userReactions = [...userReactions, emoji];
        } else if (mode === 'remove') {
          userReactions = userReactions.filter(e => emoji !== e);
        } else if (mode === 'toggle') {
          const existing = userReactions.filter(e => emoji === e);
          userReactions = [
            ...userReactions.filter(e => !emojis.includes(e)),
            ...emojis.filter(e => !existing.includes(e)),
          ];
        }
      });
    }
    const updated = await MessageAPIClient.reaction(
      partialKey.companyId,
      partialKey.threadId,
      partialKey.id || '',
      _.uniq(userReactions),
    );
    if (updated) setValue(messageToMessageWithReplies(updated));
  };

  return { message, get, react, pin, remove, bookmark, save, move };
};
