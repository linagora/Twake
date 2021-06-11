import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'react-feather';
import { EditorState } from 'draft-js';
import { Tooltip } from 'antd';
import InputOptions from './Parts/InputOptions';
import EphemeralMessages from './Parts/EphemeralMessages';
import MessageEditorsManager from 'app/services/Apps/Messages/MessageEditorServiceFactory';
import MessagesService from 'services/Apps/Messages/Messages.js';
import AttachedFiles from './Parts/AttachedFiles';
import RichTextEditorStateService from "app/components/RichTextEditor/EditorStateService";
import { EditorView } from "app/components/RichTextEditor";
import {fromString, toString} from "app/components/RichTextEditor/EditorDataParser";
import Languages from 'app/services/languages/languages';
import './Input.scss';

type Props = {
  messageId?: string;
  channelId: string;
  threadId: string;
  collectionKey: string;
  onResize?: (evt: any) => void;
  onEscape?: (evt: any) => void;
  onFocus?: () => void;
  ref?: (node: any) => void;
  onSend?: (text: string) => void;
  triggerApp?: (app: any, from_icon: any, evt: any) => void;
  localStorageIdentifier?: string;
  disableApps?: boolean;
  context?: string; //Main input or response input (empty string)
  format?: "markdown" | "raw";
};

export default (props: Props) => {
  const editorPlugins = ["emoji", "mention", "channel", "command"];
  const format = props.format || "markdown";
  const editorRef = useRef<EditorView>(null);
  const submitRef = useRef<HTMLDivElement>(null);
  const [hasEphemeralMessage, setHasEphemeralMessage] = useState(false);
  const [loading, setLoading] = useState(false);
  const messageEditorService = MessageEditorsManager.get(props.channelId);
  const [editorState, setEditorState] = useState(() => RichTextEditorStateService.get(props.channelId, { plugins: editorPlugins }));

  messageEditorService.useListener(useState);

  useEffect(() => {
    focusEditor();
    (async () => {
      const initialMessage = await messageEditorService.getContent(props.threadId, props.messageId || '');

      if (initialMessage && initialMessage.length) {
        setEditorState(
          RichTextEditorStateService.get(
            props.channelId,
            {
              plugins: editorPlugins,
              clearIfExists: true,
              initialContent: fromString(initialMessage, format),
            }
          )
        );
      }
    })();
  }, []);

  const disable_app: any = {};
  const hasFilesAttached = (): boolean => {
    return messageEditorService.filesAttachements[props.threadId || 'main']
      ?.length
      ? true
      : false;
  }

  const getContentOutput = (editorState: EditorState) => {
    return toString(editorState, format);
  };

  const onSend = () => {
    const content = getContentOutput(editorState);

    if (props.onSend) {
      props.onSend(content);
      return;
    }

    if (content || messageEditorService.filesAttachements[props.threadId || 'main']?.length) {
      sendMessage(content);
      setEditorState(RichTextEditorStateService.clear(props.channelId).get(props.channelId));
    }
  };

  const triggerApp = (app: any, from_icon: any, evt: any) => {
    if (disable_app[app.id] && new Date().getTime() - disable_app[app.id] < 1000) {
      return;
    }
    disable_app[app.id] = new Date().getTime();
    MessagesService.triggerApp(props.channelId, props.threadId, app, from_icon, evt);
  };

  const sendMessage = (val: string) => {
    setLoading(true);
    MessagesService.iamWriting(props.channelId, props.threadId, false);
    MessagesService.sendMessage(
      val,
      {
        channel_id: props.channelId,
        parent_message_id: props.threadId || '',
      },
      props.collectionKey,
    )
      .then(message => {
        setLoading(false);
        if (message) {
          if (
            messageEditorService.currentEditor ===
            messageEditorService.getEditorId(props.threadId, props.messageId || '', props.context)
          ) {
            focusEditor();
          }
          if (!message.parent_message_id) {
            messageEditorService.openEditor(message.id, props.messageId || '');
          }
        }
      })
      .finally(() => {
        messageEditorService.clearAttachments(props.threadId);
      });
  };

  const focus = () => {
    messageEditorService.openEditor(props.threadId || '', props.messageId || '', props.context);
  };

  const focusEditor = () => {
    requestAnimationFrame(() => editorRef.current?.focus());
  }

  const setRichTextEditorState = (editorState: EditorState): void => {
    setEditorState(editorState);
    RichTextEditorStateService.set(props.channelId, editorState);
  }

  const isEmpty = (): boolean => {
    return ((editorState.getCurrentContent().getPlainText().trim().length === 0) && !hasFilesAttached()); 
  }

  const onUpArrow = (e: any): void => {
    if (isEmpty()) {
      MessagesService.startEditingLastMessage({
        channel_id: props.channelId,
        parent_message_id: props.threadId,
      });
    }
  }

  const onChange = (editorState: EditorState) => {
    messageEditorService.setContent(props.threadId, props.messageId || '', getContentOutput(editorState));
    setRichTextEditorState(editorState);
  };

  const onFilePaste = (files: Blob[]) => {
    messageEditorService.getUploadZone(props.threadId).uploadFiles(files);
  };

  const isEditing = (): boolean => {
    return !!(props.messageId && props.messageId === messageEditorService.currentEditorMessageId);
  };

  return (
    <div
      className={
        'message-input ' +
        (loading ? 'loading ' : '') +
        (messageEditorService.currentEditor !==
        messageEditorService.getEditorId(props.threadId, props.messageId || '', props.context)
          ? 'unfocused '
          : '')
      }
      ref={props.ref}
      onClick={() => focus()}
    >
      <EphemeralMessages
        channelId={props.channelId}
        threadId={props.threadId}
        collectionKey={props.collectionKey}
        onHasEphemeralMessage={() => {
          if (!hasEphemeralMessage) {
            setHasEphemeralMessage(true);
          }
        }}
        onNotEphemeralMessage={() => {
          if (hasEphemeralMessage) {
            setHasEphemeralMessage(false);
          }
        }}
      />

      <AttachedFiles channelId={props.channelId} threadId={props.threadId} />

      {!hasEphemeralMessage && (
        <div className="editorview-submit">
          <EditorView
            ref={editorRef}
            onChange={(editorState) => onChange(editorState)}
            clearOnSubmit={true}
            outputFormat={format}
            plugins={editorPlugins}
            editorState={editorState}
            onSubmit={() => onSend()}
            onUpArrow={(e) => onUpArrow(e)}
            onFilePaste={onFilePaste}
            placeholder={Languages.t("scenes.apps.messages.input.placeholder", [], "Write a message. Use @ to quote a user.")}
          />
          { !isEditing() && (
            <Tooltip title={Languages.t("scenes.apps.messages.input.send_message", [], "Send message")} placement="top">
              <div
                ref={submitRef}
                className={`submit-button ${!isEmpty() ? "" : "disabled"}`}
                onClick={() => {
                  if (!isEmpty()) {
                    onSend();
                  }
                }}>
                <Send className="send-icon" size={20} />
              </div>
            </Tooltip>
          )}
       </div>
      )}

      {!hasEphemeralMessage && !props.messageId && (
        <InputOptions
          isEmpty={isEmpty()}
          channelId={props.channelId}
          threadId={props.threadId}
          onSend={() => onSend()}
          triggerApp={(app, fromIcon, evt) => triggerApp(app, fromIcon, evt)}
          onAddEmoji={emoji => {
            editorRef.current?.insertCommand("EMOJI", emoji);
          }}
          richTextEditorState={editorState}
          onRichTextChange={(editorState) => setRichTextEditorState(editorState)}
        />
      )}
    </div>
  );
};
