import { NodeMessage } from 'app/models/Message';
import MessageAPIClient from 'app/services/Apps/Messages/clients/MessageAPIClient';
import {} from 'app/services/Realtime/useRealtime';
import _ from 'lodash';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import {
  MessagesEditorState,
  VisibleMessagesEditorLocationActiveSelector,
  VisibleMessagesEditorLocationState,
} from '../../atoms/MessagesEditor';
import { useMessage } from './useMessage';
import { v1 as uuidv1 } from 'uuid';
import MessageThreadAPIClient from 'app/services/Apps/Messages/clients/MessageThreadAPIClient';
import { useAddMessage } from './utils';
import Login from 'app/services/login/LoginService';

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

  const propagateMessage = useAddMessage(key);

  const send = async () => {
    const editedMessage: Partial<NodeMessage> = _.cloneDeep(message) || {
      thread_id: key.threadId || uuidv1(),
      created_at: new Date().getTime(),
      user_id: Login.currentUserId,
    };
    editedMessage.text = editor.value || editedMessage.text;
    editedMessage.files = editor.files || editedMessage.files;

    const tempMessage = {
      ..._.cloneDeep(editedMessage as NodeMessage),
      _status: 'sending',
      id: uuidv1(),
    };
    propagateMessage(tempMessage as NodeMessage);

    try {
      let newMessage = null;
      if (key.threadId || key.messageId) {
        newMessage = await MessageAPIClient.save(key.companyId, key.threadId || '', editedMessage);
      } else {
        newMessage = await MessageThreadAPIClient.save(key.companyId, {
          message: editedMessage as NodeMessage,
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
