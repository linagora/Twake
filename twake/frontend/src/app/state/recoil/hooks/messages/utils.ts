import { MessageWithReplies, NodeMessage } from 'app/models/Message';
import Numbers from 'app/services/utils/Numbers';

/**
 * This is the hook to work with feed window (from where to where we are looking the messages)
 * useful mostly in case of jumps
 */
type WindowType = { start: string; end: string; reachedStart: boolean; reachedEnd: boolean };
const windows: Map<string, WindowType> = new Map();
export const useMessagesWindow = (key: string) => {
  if (!windows.has(key))
    windows.set(key, { start: '', end: '', reachedEnd: false, reachedStart: false });
  const window = windows.get(key) as WindowType;

  const updateWindowFromIds = (ids: string[]) => {
    const min = ids.reduce((a, b) => Numbers.minTimeuuid(a, b), ids[0]);
    const max = ids.reduce((a, b) => Numbers.maxTimeuuid(a, b), ids[0]);
    if (max !== window.end || min !== window.start) {
      windows.set(key, {
        ...window,
        start: min,
        end: max,
      });
    }
  };

  const reachEdge = (status: { reachedStart?: boolean; reachedEnd?: boolean }) => {
    windows.set(key, {
      ...window,
      ...status,
    });
  };

  const isInWindow = (id: string) => {
    return (
      (Numbers.compareTimeuuid(id, window.start) >= 0 || !window.start) &&
      (Numbers.compareTimeuuid(id, window.end) <= 0 || !window.end)
    );
  };

  return {
    window,
    updateWindowFromIds,
    reachEdge,
    isInWindow,
  };
};

/**
 * This convert a NodeMessage to a MessageWithReply type to make things easier
 */
export const messageToMessageWithReplies = (m: NodeMessage | MessageWithReplies) => {
  const mwr: MessageWithReplies = {
    ...m,
    last_replies: (m as MessageWithReplies)?.last_replies || [],
    stats: (m as MessageWithReplies)?.stats || { last_activity: m.created_at, replies: 0 },
  };
  return mwr;
};
