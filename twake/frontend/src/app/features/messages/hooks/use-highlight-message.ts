import { useGlobalEffect } from 'app/features/global/hooks/use-global-effect';
import useRouteState from 'app/features/router/hooks/use-route-state';
import { useEffect } from 'react';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { HighlightMessageState } from '../state/atoms/message-highlight';

export const useHighlightMessage = () => {
  const [highlight, setHighlight] = useRecoilState(HighlightMessageState);
  const { threadId, messageId } = useRouteState();

  const cancelHighlight = () => {
    if (highlight?.reached) {
      setHighlight(null);
    }
  };

  const reachedHighlight = (answer?: boolean) => {
    if (highlight) {
      setHighlight({
        ...highlight,
        reached: answer === true ? false : true,
        reachedAnswer: answer || false,
      });
    }
  };

  const updateHighlight = (highlight: { id: string; threadId: string }) => {
    setHighlight({ ...highlight, reached: false, reachedAnswer: false });
  };

  useGlobalEffect(
    'useHighlightMessage',
    () => {
      if (threadId) updateHighlight({ id: messageId || threadId, threadId });
    },
    [threadId, messageId],
  );

  return {
    highlight,
    updateHighlight,
    cancelHighlight,
    reachedHighlight,
  };
};
