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
import { useMessage } from 'app/state/recoil/hooks/messages/useMessage';
import { MessageContext } from '../MessageWithReplies';
import { ViewContext } from 'app/scenes/Client/MainView/MainContent';
import {
  useMessageEditor,
  useVisibleMessagesEditorLocation,
} from 'app/state/recoil/hooks/messages/useMessageEditor';

type Props = {
  /**
   * The editor plugins to enable during edition
   */
  editorPlugins?: string[];
};

export default (props: Props) => {
  const context = useContext(MessageContext);
  let { message, remove, save: updateMessage } = useMessage(context);

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
        () => {},
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
        onSend={content => save()}
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
