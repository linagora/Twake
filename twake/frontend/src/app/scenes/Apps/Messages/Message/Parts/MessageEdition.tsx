import React, { useEffect, useState } from 'react';
import 'moment-timezone';
import MessagesService from 'services/Apps/Messages/Messages.js';
import MessageEditorsManager from 'app/services/Apps/Messages/MessageEditorServiceFactory';
import MessageInput from '../../Input/Input';
import Button from 'components/Buttons/Button.js';
import PseudoMarkdownCompiler from 'services/Twacode/pseudoMarkdownCompiler.js';
import AlertManager from 'app/services/AlertManager/AlertManager';
import Languages from 'services/languages/languages.js';
import { Message } from 'app/services/Apps/Messages/Message';
import EditorToolbar from 'app/components/RichTextEditor/EditorToolbar';
import RichTextEditorStateService from "app/components/RichTextEditor/EditorStateService";
import { fromString } from "app/components/RichTextEditor/EditorDataParser";
import "./MessageEdition.scss";
import { EditorState } from 'draft-js';

type Props = {
  /**
   * The message to edit
   */
  message: Message;

  /**
   * The collection key
   */
  collectionKey: string;

  /**
   * The editor plugins to enable during edition
   */
  editorPlugins?: string[];

  /**
   * On message deleted callback
   */
  onDeleted?: () => void;

  /**
   * On message edited callback called with the new message content
   */
  onEdited?: (content?: string) => void;
};

export default (props: Props) => {
  const editorPlugins = props.editorPlugins || ["emoji", "mention", "channel"];
  const format = "markdown";
  const channelId = props.message?.channel_id || "";
  const threadId = props.message?.parent_message_id || "";
  const messageId = props.message?.id || "";
  const editorId = `channel:${channelId}/thread:${threadId}/message:${messageId}`;
  const messageEditorService = MessageEditorsManager.get(channelId);
  const [editorState, setEditorState] = useState<EditorState>();
  const [isReady, setReady] = useState(false);

  messageEditorService.useListener(useState);

  useEffect(() => {
    (async () => {
      const initialContent = PseudoMarkdownCompiler.transformBackChannelsUsers(
        typeof props.message?.content === 'string'
          ? props.message?.content
          : props.message?.content?.original_str,
      );

      await messageEditorService.setContent(threadId, messageId, initialContent)      

      setEditorState(() =>
        RichTextEditorStateService.get(
          editorId,
          {
            plugins: editorPlugins,
            clearIfExists: true,
            initialContent: fromString(initialContent, format),
          }
        )
      );
      setReady(true);
    })();
  }, []);

  const save = (content: string) => {
    if (!content) {
      AlertManager.confirm(
        () => {
          MessagesService.deleteMessage(props.message, props.collectionKey);
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
  }

  return (!isReady || !editorState) ? <></> : (
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
        onChange={(editorState) => { setRichTextEditorState(editorState)}}
      />

      <div className="message-edition-toolbar">
        <div className="message-edition-richtext">
          <EditorToolbar
            editorState={editorState}
            onChange={(editorState) => {setRichTextEditorState(editorState)}}
          />
        </div>
        <div className="message-edition-buttons">
          <Button
            className="primary small-right-margin"
            small
            onClick={async () => {
              const message = await messageEditorService.getContent(threadId, messageId);
              save(message);
            }}
            value={Languages.t("scenes.apps.messages.message.save_button", [], "Save")}
          ></Button>

          <Button
            className="secondary-light"
            small
            onClick={() => messageEditorService.closeEditor()}
            value={Languages.t("scenes.apps.messages.message.cancel_button", [], "Cancel")}
          ></Button>
        </div>
      </div>
    </div>
  )
};
