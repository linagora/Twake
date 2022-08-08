import { useRecoilValue, useSetRecoilState } from 'recoil'
import { MessageQuoteReplyEditorActiveSelector, MessageQuoteReplyEditorState } from '../state/atoms/message-quote-reply'
import { useVisibleMessagesEditorLocation } from './use-message-editor';

/**
 * Manage the state of the message quote reply editor
 * 
 * @param {String} message - The message id to quote
 * @param {String} channel - The channel id to quote from
 */
export const useMessageQuoteReply = (message: string, channel: string) => {
  const setReplyState = useSetRecoilState(MessageQuoteReplyEditorState);
  const isActive = useRecoilValue(MessageQuoteReplyEditorActiveSelector({ message, channel }));
  const { set: setEditorState } = useVisibleMessagesEditorLocation(`thread-${message}`, 'main');

  return {
    isActive,
    set: ({ message, channel }: MessageQuoteReplyEditorState) => {
      setEditorState({ location: `thread-${message}`, subLocation: 'main' });
      setReplyState({ message, channel });
    },
    close: () => setReplyState({ message: '', channel: '' }),
  }
}
