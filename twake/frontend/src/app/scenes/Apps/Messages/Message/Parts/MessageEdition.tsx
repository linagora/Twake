import React, { useContext, useEffect, useState } from 'react';
import 'moment-timezone';
import MessagesService from 'services/Apps/Messages/Messages';
import MessageEditorsManager from 'app/services/Apps/Messages/MessageEditorServiceFactory';
import MessageInput from '../../Input/Input';
import Button from 'components/Buttons/Button.js';
import PseudoMarkdownCompiler from 'services/Twacode/pseudoMarkdownCompiler';
import AlertManager from 'app/services/AlertManager/AlertManager';
import Languages from 'services/languages/languages';
import { Message } from 'app/models/Message';
import EditorToolbar from 'app/components/RichTextEditor/EditorToolbar';
import RichTextEditorStateService from 'app/components/RichTextEditor/EditorStateService';
import './MessageEdition.scss';
import { EditorState } from 'draft-js';
import { useMessage } from 'app/state/recoil/hooks/useMessage';
import { MessageContext } from '../MessageWithReplies';

type Props = {
  /**
   * The editor plugins to enable during edition
   */
  editorPlugins?: string[];
  onDeleted?: () => void;
  onEdited?: (content?: string) => void;
};

export default (props: Props) => {
  const context = useContext(MessageContext);
  let { message } = useMessage(context);

  return <></>; /*

  const editorPlugins = props.editorPlugins || ['emoji', 'mention', 'channel'];
  const format = 'markdown';
  const threadId = message?.thread_id || '';
  const messageId = message?.id || '';
  const editorId = `thread:${threadId}/message:${messageId}`;
  const messageEditorService = MessageEditorsManager.get(channelId);
  const [editorState, setEditorState] = useState<EditorState>();
  const [isReady, setReady] = useState(false);

  messageEditorService.useListener(useState);

  useEffect(() => {
    (async () => {
      const dataParser = RichTextEditorStateService.getDataParser(editorPlugins);
      const initialContent = PseudoMarkdownCompiler.transformBackChannelsUsers(
        typeof message?.content === 'string' ? message?.content : message?.content?.original_str,
      );

      await messageEditorService.setContent(threadId, messageId, initialContent);

      setEditorState(() =>
        RichTextEditorStateService.get(editorId, {
          plugins: editorPlugins,
          clearIfExists: true,
          initialContent: dataParser.fromString(initialContent, format),
        }),
      );
      setReady(true);
    })();
  }, []);

  const save = (content: string) => {
    if (!content) {
      AlertManager.confirm(
        () => {
          MessagesService.deleteMessage(message, props.collectionKey);
          props.onDeleted && props.onDeleted();
        },
        () => {},
        {
          title: Languages.t('scenes.apps.messages.chatbox.chat.delete_message_btn', [], 'Delete'),
        },
      );
    } else {
      MessagesService.editMessage(messageId, content, props.collectionKey);
      props.onEdited && props.onEdited(content);
    }
    messageEditorService.closeEditor();
  };

  const setRichTextEditorState = (editorState: EditorState): void => {
    setEditorState(editorState);
    RichTextEditorStateService.set(editorId, editorState);
  };

  return !isReady || !editorState ? (
    <></>
  ) : (
    <div className="message-edition">
      <MessageInput
        ref={node => messageEditorService.setInputNode(threadId, messageId, 'edition', node)}
        channelId={channelId}
        threadId={threadId}
        messageId={messageId}
        collectionKey={props.collectionKey}
        context={'edition'}
        onSend={content => save(content)}
        editorState={editorState}
        onChange={editorState => {
          setRichTextEditorState(editorState);
        }}
      />

      <div className="message-edition-toolbar message-input">
        <div className="input-options-toolbar">
          <div className="richtext-toolbar input-toolbar fade_in">
            <EditorToolbar
              editorState={editorState}
              onChange={editorState => {
                setRichTextEditorState(editorState);
              }}
            />
          </div>
        </div>
        <div className="message-edition-buttons">
          <Button
            className="primary small-right-margin"
            small
            onClick={async () => {
              const message = await messageEditorService.getContent(threadId, messageId);
              save(message);
            }}
            value={Languages.t('scenes.apps.messages.message.save_button', [], 'Save')}
          ></Button>

          <Button
            className="secondary-light"
            small
            onClick={() => messageEditorService.closeEditor()}
            value={Languages.t('scenes.apps.messages.message.cancel_button', [], 'Cancel')}
          ></Button>
        </div>
      </div>
    </div>
  );
  */
};
