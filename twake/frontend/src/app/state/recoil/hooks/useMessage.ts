import MessageAPIClient from 'app/services/Apps/Messages/clients/MessageAPIClient';
import _ from 'lodash';
import User from 'app/services/user/UserService';
import { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import { AtomMessageKey, MessageState, MessageStateExtended } from '../atoms/Messages';
import { NodeMessage } from 'app/models/Message';

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
    await MessageAPIClient.save(partialKey.companyId, partialKey.threadId, message);
    get();
  };

  const move = async (targetThread: string) => {
    await MessageAPIClient.save(
      partialKey.companyId,
      partialKey.threadId,
      { ...message, thread_id: targetThread },
      { movedFromThread: message.thread_id },
    );
    get();
  };

  const remove = async () => {
    await MessageAPIClient.delete(partialKey.companyId, partialKey.threadId, partialKey.id || '');
    get();
  };

  const bookmark = async (bookmarkId: string, status: boolean = true) => {
    await MessageAPIClient.bookmark(
      partialKey.companyId,
      partialKey.threadId,
      partialKey.id || '',
      bookmarkId,
      status,
    );
    get();
  };

  const pin = async (status: boolean = true) => {
    await MessageAPIClient.pin(
      partialKey.companyId,
      partialKey.threadId,
      partialKey.id || '',
      status,
    );
    get();
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
            ...userReactions.filter(e => existing.includes(e)),
            ...emojis.filter(e => !existing.includes(e)),
          ];
        }
      });
    }
    await MessageAPIClient.reaction(
      partialKey.companyId,
      partialKey.threadId,
      partialKey.id || '',
      _.uniq(userReactions),
    );
    get();
  };

  return { message, get, react, pin, remove, bookmark, save, move };
};
