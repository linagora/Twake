import { useRealtimeRoom } from 'app/services/Realtime/useRealtime';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import {
  MessagesEditorState,
  VisibleMessagesEditorLocationActiveSelector,
  VisibleMessagesEditorLocationState,
} from '../atoms/MessagesEditor';

export const useMessageEditor = (location: string) => {
  const [editor, setEditor] = useRecoilState(MessagesEditorState(location));

  return {
    editor,
    setEditor,
    setValue: (value: string) => setEditor({ ...editor, value }),
    setFiles: (files: any[]) => setEditor({ ...editor, files }),
  };
};

export const useVisibleMessagesEditorLocation = (location: string, subLocation: string = '') => {
  const set = useSetRecoilState(VisibleMessagesEditorLocationState);
  const active = useRecoilValue(
    VisibleMessagesEditorLocationActiveSelector({ location, subLocation }),
  );
  return { active, set };
};
