import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { HighlightMessageState } from '../state/atoms/message-highlight';

export const useHighlightMessage = () => {
  const [highlight, setHighlight] = useRecoilState(HighlightMessageState);

  const cancelHighlight = () => {
    if (highlight?.reached) {
      setHighlight(null);
    }
  };

  const reachedHighlight = () => {
    if (highlight) {
      setHighlight({ ...highlight, reached: true });
    }
  };

  const updateHighlight = (highlight: { id: string; threadId: string }) => {
    setHighlight({ ...highlight, reached: false });
  };

  return {
    highlight,
    updateHighlight,
    cancelHighlight,
    reachedHighlight,
  };
};
