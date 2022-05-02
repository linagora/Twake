import { atom } from 'recoil';

export type AtomHighlightKey = {
  threadId: string;
  id: string;
  reached: boolean;
  reachedAnswer: boolean;
};

export const HighlightMessageState = atom<AtomHighlightKey | null>({
  key: 'HighlightMessageState',
  default: null,
});
