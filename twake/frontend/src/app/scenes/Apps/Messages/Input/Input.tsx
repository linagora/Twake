import React, { useState, useRef, useEffect } from 'react';
import classNames from 'classnames';
import { Send } from 'react-feather';
import { EditorState } from 'draft-js';
import { Tooltip } from 'antd';
import InputOptions from './Parts/InputOptions';
import EphemeralMessages from './Parts/EphemeralMessages';
import MessageEditorsManager from 'app/services/Apps/Messages/MessageEditorServiceFactory';
import MessagesService from 'services/Apps/Messages/Messages';
import AttachedFiles from './Parts/AttachedFiles';
import RichTextEditorStateService from 'app/components/RichTextEditor/EditorStateService';
import { EditorView } from 'app/components/RichTextEditor';
import Languages from 'app/services/languages/languages';
import { TextCountService } from 'app/components/RichTextEditor/TextCount/';

import './Input.scss';
import UploadZone from 'app/components/Uploads/UploadZone';
import Workspaces from 'services/workspaces/workspaces';

type FileType = { [key: string]: any };

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
  onChange?: (editorState: EditorState) => void;
  triggerApp?: (app: any, from_icon: any, evt: any) => void;
  localStorageIdentifier?: string;
  disableApps?: boolean;
  context?: string; //Main input or response input (empty string)
  format?: 'markdown' | 'raw';
  editorPlugins?: Array<string>;
  editorState?: EditorState;
};

export default (props: Props) => {
  const editorPlugins = props.editorPlugins || ['emoji', 'mention', 'channel', 'command'];
  const editorId = `channel:${props.channelId || ''}/thread:${props.threadId || ''}/message:${
    props.messageId || ''
  }`;
  const format = props.format || 'markdown';
  const editorRef = useRef<EditorView>(null);
  const submitRef = useRef<HTMLDivElement>(null);
  const [hasEphemeralMessage, setHasEphemeralMessage] = useState(false);
  const [loading, setLoading] = useState(false);
  const messageEditorService = MessageEditorsManager.get(props.channelId);
  const [editorState, setEditorState] = useState(() =>
    RichTextEditorStateService.get(editorId, { plugins: editorPlugins }),
  );
  const disable_app: any = {};

  messageEditorService.useListener(useState);

  useEffect(() => {
    focusEditor();

    (async () => {
      const initialMessage = await messageEditorService.getContent(props.threadId, props.messageId);

      if (initialMessage && initialMessage.length) {
        setEditorState(
          RichTextEditorStateService.get(editorId, {
            plugins: editorPlugins,
            clearIfExists: true,
            initialContent: RichTextEditorStateService.getDataParser(editorPlugins).fromString(initialMessage, format),
          }),
        );
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (props.editorState && props.editorState !== editorState) {
      setEditorState(props.editorState);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.editorState]);

  const getContentOutput = (editorState: EditorState) => {
    return RichTextEditorStateService.getDataParser(editorPlugins).toString(editorState, format);
  };

  const onSend = () => {
    const content = getContentOutput(editorState);

    if (props.onSend) {
      props.onSend(content);
      return;
    }

    if (content || messageEditorService.hasAttachments(props.threadId)) {
      sendMessage(content);
      setEditorState(RichTextEditorStateService.clear(editorId).get(editorId));
    }
  };

  const triggerApp = (app: any, from_icon: any, evt: any) => {
    if (disable_app[app.id] && new Date().getTime() - disable_app[app.id] < 1000) {
      return;
    }
    disable_app[app.id] = new Date().getTime();
    MessagesService.triggerApp(props.channelId, props.threadId, app, from_icon, evt);
  };

  const sendMessage = (message: string) => {
    setLoading(true);
    MessagesService.iamWriting(props.channelId, props.threadId, false);
    MessagesService.sendMessage(
      message,
      {
        channel_id: props.channelId,
        parent_message_id: props.threadId || '',
      },
      props.collectionKey,
    )
      .then((message: any) => {
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
        messageEditorService.clearMessage(props.threadId, props.messageId || '');
      });
  };

  const focus = () => {
    messageEditorService.openEditor(props.threadId || '', props.messageId || '', props.context);
  };

  const focusEditor = () => {
    requestAnimationFrame(() => editorRef.current?.focus());
  };

  const setRichTextEditorState = (editorState: EditorState): void => {
    setEditorState(editorState);
    RichTextEditorStateService.set(editorId, editorState);
  };

  const isEmpty = (): boolean => {
    return (
      editorState.getCurrentContent().getPlainText().trim().length === 0 &&
      !messageEditorService.hasAttachments(props.threadId)
    );
  };

  const onUpArrow = (e: any): void => {
    if (isEmpty()) {
      MessagesService.startEditingLastMessage({
        channel_id: props.channelId,
        parent_message_id: props.threadId,
      });
    }
  };

  const onChange = async (editorState: EditorState) => {
    await messageEditorService.setContent(
      props.threadId,
      props.messageId || '',
      getContentOutput(editorState),
    );

    if (props.onChange) {
      props.onChange(editorState);
      return;
    }
    setRichTextEditorState(editorState);
    //props.onChange && props.onChange(editorState);
  };

  const onFilePaste = (files: Blob[]) => {
    messageEditorService.getUploadZone(props.threadId).uploadFiles(files);
  };

  const isEditing = (): boolean => {
    return !!(props.messageId && props.messageId === messageEditorService.currentEditorMessageId);
  };

  const setUploadZoneRef = (node: UploadZone): void =>
    messageEditorService.setUploadZone(props.messageId || '', node);

  const onUploaded = (file: FileType) =>
    messageEditorService.onAddAttachment(props.messageId || props.threadId, file);

  const onDragEnter = (): void => {
    messageEditorService.getUploadZone(props.threadId);
  };
  return (
    <div
      className={classNames('message-input', {
        loading,
        unfocused:
          messageEditorService.currentEditor !==
          messageEditorService.getEditorId(props.threadId, props.messageId || '', props.context),
      })}
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
          <UploadZone
            className="thread-centerer"
            ref={setUploadZoneRef}
            disableClick
            parent={''}
            driveCollectionKey={props.collectionKey}
            uploadOptions={{ workspace_id: Workspaces.currentWorkspaceId, detached: true }}
            onUploaded={onUploaded}
            onDragEnter={onDragEnter}
            multiple={true}
            allowPaste={true}
          >
            <EditorView
              ref={editorRef}
              onChange={editorState => onChange(editorState)}
              clearOnSubmit={true}
              outputFormat={format}
              plugins={editorPlugins}
              editorState={editorState}
              onSubmit={() => onSend()}
              onUpArrow={e => onUpArrow(e)}
              onFilePaste={onFilePaste}
              placeholder={Languages.t(
                'scenes.apps.messages.input.placeholder',
                [],
                'Write a message. Use @ to quote a user.',
              )}
            />
          </UploadZone>
          {!isEditing() && (
            <Tooltip
              title={Languages.t('scenes.apps.messages.input.send_message', [], 'Send message')}
              placement="top"
            >
              <div
                ref={submitRef}
                className={classNames('submit-button', {
                  disabled: isEmpty() || TextCountService.textIsTooLong(editorState),
                })}
                onClick={() => {
                  if (!isEmpty() && !TextCountService.textIsTooLong(editorState)) {
                    onSend();
                  }
                }}
              >
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
          onAddEmoji={emoji => editorRef.current?.insertCommand('EMOJI', emoji)}
          richTextEditorState={editorState}
          onRichTextChange={editorState => setRichTextEditorState(editorState)}
        />
      )}
    </div>
  );
};
