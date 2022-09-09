import React, { useContext, useEffect, useState } from 'react';
import 'moment-timezone';
import MessageInput from '../../input/input';
import Button from 'components/buttons/button.js';
import AlertManager from 'app/features/global/services/alert-manager-service';
import Languages from 'app/features/global/services/languages-service';
import EditorToolbar from 'app/components/rich-text-editor/editor-toolbar';
import RichTextEditorStateService from 'app/components/rich-text-editor/editor-state-service';
import './MessageEdition.scss';
import { EditorState } from 'draft-js';
import { useMessage } from 'app/features/messages/hooks/use-message';
import { MessageContext } from '../message-with-replies';
import { ViewContext } from 'app/views/client/main-view/MainContent';
import { useVisibleMessagesEditorLocation } from 'app/features/messages/hooks/use-message-editor';

type Props = {
  /**
   * The editor plugins to enable during edition
   */
  editorPlugins?: string[];
};

export default (props: Props) => {
  const context = useContext(MessageContext);
  const { message, remove, save: updateMessage } = useMessage(context);

  const location = `message-${context.id}`;
  const subLocation = useContext(ViewContext).type;
  const editorId = `thread:${context.threadId}/message:${context.id}`;
  const { close } = useVisibleMessagesEditorLocation(location, subLocation);

  const editorPlugins = props.editorPlugins || ['emoji', 'mention', 'channel'];
  const format = 'markdown';

  const [editorState, setEditorState] = useState<EditorState>();
  const [isReady, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const dataParser = RichTextEditorStateService.getDataParser(editorPlugins);
      const initialContent = message?.text || '';

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

  const getContentOutput = (editorState: EditorState) => {
    return RichTextEditorStateService.getDataParser(editorPlugins).toString(editorState, format);
  };

  const save = () => {
    let content = null;
    if (editorState) content = getContentOutput(editorState);
    if (!content) {
      AlertManager.confirm(
        () => {
          remove();
        },
        () => undefined,
        {
          title: Languages.t('scenes.apps.messages.chatbox.chat.delete_message_btn', [], 'Delete'),
        },
      );
    } else {
      updateMessage({ ...message, text: content });
    }
    close();
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
        threadId={context.threadId}
        messageId={context.id}
        context={'edition'}
        onSend={() => save()}
        editorState={editorState}
        onChange={editorState => {
          setRichTextEditorState(editorState);
        }}
      />

      <div className="message-edition-toolbar message-input px-1 pl-2 mt-1">
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
              save();
            }}
            value={Languages.t('scenes.apps.messages.message.save_button', [], 'Save')}
          ></Button>

          <Button
            className="secondary-light"
            small
            onClick={() => close()}
            value={Languages.t('scenes.apps.messages.message.cancel_button', [], 'Cancel')}
          ></Button>
        </div>
      </div>
    </div>
  );
};
