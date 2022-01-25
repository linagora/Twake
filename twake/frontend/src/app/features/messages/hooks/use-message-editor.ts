import { MessageWithReplies, NodeMessage } from 'app/features/messages/types/message';
import MessageAPIClient from 'app/features/messages/api/message-api-client';
import {} from 'app/features/global/hooks/use-realtime';
import _ from 'lodash';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import {
  MessagesEditorState,
  VisibleMessagesEditorLocationActiveSelector,
  VisibleMessagesEditorLocationState,
} from '../state/atoms/messages-editor';
import { useMessage, useSetMessage } from './use-message';
import { v1 as uuidv1 } from 'uuid';
import MessageThreadAPIClient from 'app/features/messages/api/message-thread-api-client';
import Login from 'app/services/login/LoginService';
import { messageToMessageWithReplies } from '../utils/message-with-replies';
import { useAddMessageToChannel, useRemoveMessageFromChannel } from './use-channel-messages';
import { useAddMessageToThread, useRemoveMessageFromThread } from './use-thread-messages';
import { useRef } from 'react';

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
  const editorRef = useRef(editor);

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
        text: editorRef.current.value,
        files: editorRef.current.files,
      };
    }

    setEditorRef({ value: '', files: [] });

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

  const setEditorRef = (editor: { value: string; files: any[] }) => {
    editorRef.current = editor;
    setEditor(editorRef.current);
  };

  return {
    editor,
    key: location,
    send,
    retry,
    cancel,
    setEditor: setEditorRef,
    setValue: (value: string) => setEditorRef({ ...editor, value }),
    setFiles: (files: any[]) => setEditorRef({ ...editor, files }),
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
