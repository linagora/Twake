import { MessageWithReplies, NodeMessage } from 'app/models/Message';
import MessageAPIClient from 'app/services/Apps/Messages/clients/MessageAPIClient';
import {} from 'app/services/Realtime/useRealtime';
import _ from 'lodash';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import {
  MessagesEditorState,
  VisibleMessagesEditorLocationActiveSelector,
  VisibleMessagesEditorLocationState,
} from '../../atoms/MessagesEditor';
import { useMessage, useSetMessage } from './useMessage';
import { v1 as uuidv1 } from 'uuid';
import MessageThreadAPIClient from 'app/services/Apps/Messages/clients/MessageThreadAPIClient';
import Login from 'app/services/login/LoginService';
import { messageToMessageWithReplies } from './utils';
import { useAddMessageToChannel, useRemoveMessageFromChannel } from './useChannelMessages';
import { useAddMessageToThread, useRemoveMessageFromThread } from './useThreadMessages';

export type EditorKey = {
  companyId: string;
  workspaceId?: string;
  channelId?: string;
  threadId?: string;
  messageId?: string;
};

export const useMessageEditor = (key: EditorKey) => {
  const location = key.messageId
    ? `edit-${key.messageId}`
    : key.threadId
    ? `reply-${key.threadId}`
    : `new-${key.channelId}`;
  const [editor, setEditor] = useRecoilState(MessagesEditorState(location));

  let message: NodeMessage | null = null;
  if (key.messageId) {
    message = useMessage({
      companyId: key.companyId,
      threadId: key.threadId || '',
      id: key.messageId,
    }).message;
  }

  const propagateMessage = useAddMessageFromEditor(key);

  const send = async (message?: Partial<NodeMessage>) => {
    if (!message) {
      message = {
        text: editor.value,
        files: editor.files,
      };
    }

    const editedMessage = {
      thread_id: key.threadId || uuidv1(),
      created_at: new Date().getTime(),
      user_id: Login.currentUserId,
      ...message,
    } as NodeMessage;

    const tempMessage = {
      ...editedMessage,
      _status: 'sending',
      id: key.threadId ? uuidv1() : editedMessage.thread_id,
    };
    propagateMessage(tempMessage as NodeMessage);

    try {
      let newMessage = null;
      if (key.threadId || key.messageId) {
        newMessage = await MessageAPIClient.save(key.companyId, key.threadId || '', editedMessage);
      } else {
        newMessage = await MessageThreadAPIClient.save(key.companyId, {
          message: editedMessage,
          participants: [
            {
              type: 'channel',
              id: key.channelId || '',
              company_id: key.companyId,
              workspace_id: key.workspaceId || '',
            },
          ],
        });
      }
      if (!newMessage) {
        throw new Error('Not sent');
      }

      propagateMessage({ ...tempMessage, _status: 'sent' });
      propagateMessage(newMessage);
    } catch (err) {
      propagateMessage({ ...tempMessage, _status: 'failed' });
    }
  };

  const retry = async (message: MessageWithReplies) => {
    propagateMessage({ ...message, _status: 'cancelled' });
    //Fixme, to do the update we use the recoil snapshot that is not updated between two changes
    window.requestAnimationFrame(() => send({ ...message, id: undefined, _status: undefined }));
  };

  const cancel = (message: MessageWithReplies) => {
    propagateMessage({ ...message, _status: 'cancelled' });
  };

  return {
    editor,
    key: location,
    send,
    retry,
    cancel,
    setEditor,
    setValue: (value: string) => setEditor({ ...editor, value }),
    setFiles: (files: any[]) => setEditor({ ...editor, files }),
  };
};

export const useVisibleMessagesEditorLocation = (location: string, subLocation: string = '') => {
  const set = useSetRecoilState(VisibleMessagesEditorLocationState);
  const active = useRecoilValue(
    VisibleMessagesEditorLocationActiveSelector({ location, subLocation }),
  );
  return {
    active,
    set,
    close: () => {
      set({ location: '', subLocation: '' });
    },
  };
};

export const useAddMessageFromEditor = (key: {
  companyId: string;
  workspaceId?: string;
  channelId?: string;
}) => {
  const addToThread = useAddMessageToThread(key.companyId);
  const removeFromThread = useRemoveMessageFromThread(key.companyId);
  const channelKey = {
    companyId: key.companyId,
    workspaceId: key.workspaceId || '',
    channelId: key.channelId || '',
  };
  const addToChannel = useAddMessageToChannel(channelKey);
  const removeFromChannel = useRemoveMessageFromChannel(channelKey);
  const setMessage = useSetMessage(key.companyId);

  return (message: NodeMessage) => {
    const isThread = message.thread_id === message.id;

    setMessage(messageToMessageWithReplies(message));
    if (message._status === 'sent' || message._status === 'cancelled') {
      if (!isThread) removeFromThread([message], { threadId: message.thread_id });
      if (isThread) removeFromChannel([message]);
    } else {
      if (!isThread) addToThread([message], { atBottom: true, threadId: message.thread_id });
      if (isThread) addToChannel([message], { atBottom: true });
    }
  };
};
