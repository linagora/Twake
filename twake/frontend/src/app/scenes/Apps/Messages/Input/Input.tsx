import React, { useState, useRef, useEffect } from 'react';
import classNames from 'classnames';
import { Send } from 'react-feather';
import { EditorState } from 'draft-js';
import { Tooltip } from 'antd';
import InputOptions from './Parts/InputOptions';
import EphemeralMessages from './Parts/EphemeralMessages';
import MessageEditorsManager from 'app/services/Apps/Messages/MessageEditorServiceFactory';
import MessagesService from 'services/Apps/Messages/Messages';
import PendingAttachments from './Parts/PendingAttachments';
import RichTextEditorStateService from 'app/components/RichTextEditor/EditorStateService';
import { EditorView } from 'app/components/RichTextEditor';
import Languages from 'app/services/languages/languages';
import { TextCount, TextCountService } from 'app/components/RichTextEditor/TextCount/';
import UploadZone from 'app/components/Uploads/UploadZone';
import Workspaces from 'services/workspaces/workspaces';
import './Input.scss';
import { FileType } from 'app/models/File';
import { useUploadZones } from 'app/state/recoil/hooks/useUploadZones';
import { useMessageEditor } from 'app/state/recoil/hooks/messages/useMessageEditor';
import useRouterCompany from 'app/state/recoil/hooks/router/useRouterCompany';
import { delayRequest } from 'app/services/utils/managedSearchRequest';
import { useChannel } from 'app/state/recoil/hooks/useChannels';
import IsWriting from './Parts/IsWriting';
import {
  useChannelWritingActivityEmit,
  useWritingDetector,
} from 'app/state/recoil/hooks/useChannelWritingActivity';

type Props = {
  messageId?: string;
  channelId?: string;
  threadId: string;
  collectionKey?: string;
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
  const { channel } = useChannel(props.channelId || '');

  const {
    editor,
    setValue,
    setFiles,
    send,
    key: editorId,
  } = useMessageEditor({
    companyId: useRouterCompany(),
    workspaceId: channel.workspace_id || '',
    channelId: props.channelId,
    threadId: props.threadId,
    messageId: props.messageId,
  });

  const { upload, clear: clearUploads } = useUploadZones(editorId);
  const format = props.format || 'markdown';
  const editorRef = useRef<EditorView>(null);
  const submitRef = useRef<HTMLDivElement>(null);
  const [hasEphemeralMessage, setHasEphemeralMessage] = useState(false);
  const messageEditorService = MessageEditorsManager.get(props.channelId || '');

  const editorPlugins = props.editorPlugins || ['emoji', 'mention', 'channel', 'command'];
  const [editorState, setEditorState] = useState(() =>
    RichTextEditorStateService.get(editorId, { plugins: editorPlugins }),
  );
  const [isTooLong, setTooLong] = useState(false);

  const { iAmWriting } = useChannelWritingActivityEmit(props.channelId || '', props.threadId);

  const { onKeydown: onKeydownRealtimeListener } = useWritingDetector();

  useEffect(() => {
    setTooLong(TextCountService.getStats(editorState).isTooLong);
  }, [editorState]);

  useEffect(() => {
    focusEditor();
    (async () => {
      if (editor.value && editor.value.length) {
        setEditorState(
          RichTextEditorStateService.get(editorId, {
            plugins: editorPlugins,
            clearIfExists: true,
            initialContent: RichTextEditorStateService.getDataParser(editorPlugins).fromString(
              editor.value,
              format,
            ),
          }),
        );
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const disable_app: any = {};

  useEffect(() => {
    if (props.editorState && props.editorState !== editorState) {
      setEditorState(props.editorState);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.editorState]);

  const getContentOutput = (editorState: EditorState) => {
    return RichTextEditorStateService.getDataParser(editorPlugins).toString(editorState, format);
  };

  const onSend = async () => {
    const content = getContentOutput(editorState);
    setValue(content);

    if (props.onSend) {
      props.onSend(content);
      return;
    }

    if (content || editor.files.length > 0) {
      setEditorState(RichTextEditorStateService.clear(editorId).get(editorId));
      clearUploads();
      await send();
    }
  };

  const triggerApp = (app: any, from_icon: any, evt: any) => {
    if (disable_app[app.id] && new Date().getTime() - disable_app[app.id] < 1000) {
      return;
    }
    disable_app[app.id] = new Date().getTime();
    MessagesService.triggerApp(channel, props.threadId, app, from_icon, evt);
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
      editorState.getCurrentContent().getPlainText().trim().length === 0 && !editor.files.length
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
    //Delay request make the input faster (getContentOutput is a heavy call)
    delayRequest(`editor-${editorId}`, () => {
      setValue(getContentOutput(editorState));
    });

    if (props.onChange) {
      props.onChange(editorState);
      return;
    }
    setRichTextEditorState(editorState);
  };

  const onWrintingActivity = () => {
    onKeydownRealtimeListener((state: boolean) => iAmWriting(state));
  };

  const onFilePaste = (files: Blob[]) => {
    messageEditorService.getUploadZone(props.threadId).upload(files);
  };

  const isEditing = (): boolean => {
    return !!(props.messageId && props.messageId === messageEditorService.currentEditorMessageId);
  };

  const setUploadZoneRef = (node: UploadZone): void =>
    messageEditorService.setUploadZone(props.messageId || props.threadId || '', node);

  const onUploaded = (file: FileType) =>
    messageEditorService.onAddAttachment(props.messageId || props.threadId, file);

  const onDragEnter = (): void => {
    messageEditorService.getUploadZone(props.threadId);
  };

  const getFilesLimit = () => {
    const attachements = messageEditorService.getAttachements(editorId) || [];
    const limit = messageEditorService.ATTACHEMENTS_LIMIT;

    return attachements.length ? limit - attachements.length : limit;
  };

  const onAddFiles = async (files: File[]) => {
    await upload(files);
  };

  const disabled = isEmpty() || isTooLong;
  return (
    <div className={'message-input'} ref={props.ref} onClick={() => focus()}>
      <UploadZone
        className="upload-zone-centerer"
        ref={setUploadZoneRef}
        disableClick
        parent={''}
        driveCollectionKey={props.collectionKey}
        uploadOptions={{ workspace_id: Workspaces.currentWorkspaceId, detached: true }}
        onUploaded={onUploaded}
        onDragEnter={onDragEnter}
        multiple={true}
        allowPaste={true}
        filesLimit={getFilesLimit()}
        onAddFiles={onAddFiles}
      >
        <EphemeralMessages
          channelId={props.channelId || ''}
          workspaceId={channel.workspace_id || ''}
          threadId={props.threadId}
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

        <PendingAttachments
          zoneId={editorId}
          initialValue={editor.files || []}
          onChange={list => setFiles(list)}
        />

        {!hasEphemeralMessage && (
          <div className="editorview-submit">
            <EditorView
              ref={editorRef}
              onChange={editorState => {
                onChange(editorState);
              }}
              clearOnSubmit={true}
              outputFormat={format}
              plugins={editorPlugins}
              editorState={editorState}
              onSubmit={() => onSend()}
              onUpArrow={e => onUpArrow(e)}
              onFilePaste={onFilePaste}
              placeholder={Languages.t('scenes.apps.messages.input.placeholder')}
              onKeydown={onWrintingActivity}
            />
            {!isEditing() && (
              <Tooltip
                title={Languages.t('scenes.apps.messages.input.send_message')}
                placement="top"
              >
                <div
                  ref={submitRef}
                  className={classNames('submit-button', {
                    disabled: disabled,
                    skew_in_right: !disabled,
                  })}
                  onClick={() => {
                    if (!isEmpty() && !isTooLong) {
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

        <div className="counter-right">
          <TextCount editorState={editorState} displayOnlyAfterThresold={true} />
        </div>

        {!hasEphemeralMessage && !props.messageId && (
          <InputOptions
            isEmpty={isEmpty()}
            channelId={props.channelId || ''}
            threadId={props.threadId}
            onSend={() => onSend()}
            triggerApp={(app, fromIcon, evt) => triggerApp(app, fromIcon, evt)}
            onAddEmoji={emoji => editorRef.current?.insertCommand('EMOJI', emoji)}
            richTextEditorState={editorState}
            onRichTextChange={editorState => setRichTextEditorState(editorState)}
          />
        )}
      </UploadZone>
    </div>
  );
};
