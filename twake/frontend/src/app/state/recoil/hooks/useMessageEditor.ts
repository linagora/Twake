import { NodeMessage } from 'app/models/Message';
import MessageAPIClient from 'app/services/Apps/Messages/clients/MessageAPIClient';
import { useRealtimeRoom } from 'app/services/Realtime/useRealtime';
import _ from 'lodash';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import {
  MessagesEditorState,
  VisibleMessagesEditorLocationActiveSelector,
  VisibleMessagesEditorLocationState,
} from '../atoms/MessagesEditor';
import { useMessage } from './useMessage';

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
  if (key.messageId)
    message = useMessage({
      companyId: key.companyId,
      threadId: key.threadId || '',
      id: key.messageId,
    }).message;

  const send = async () => {
    if (key.threadId || key.messageId) {
      const editedMessage: Partial<NodeMessage> = _.cloneDeep(message) || {
        text: editor.value,
        files: editor.files,
      };
      const newMessage = await MessageAPIClient.save(
        key.companyId,
        key.threadId || '',
        editedMessage,
      );
    }
    console.log('send', editor.value, editor.files);
  };

  return {
    editor,
    key: location,
    send,
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
  return { active, set };
};
