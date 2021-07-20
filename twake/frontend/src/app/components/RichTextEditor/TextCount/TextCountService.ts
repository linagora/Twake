import { EditorState } from 'draft-js';

class TextCountService {
  MAX_TEXT_LENGTH = 12000;

  getCurrentTextLength(editorState: EditorState) {
    const currentContent = editorState.getCurrentContent();
    return currentContent.getPlainText('').length;
  }

  textIsTooLong(editorState: EditorState): boolean {
    const currentContentLength = this.getCurrentTextLength(editorState);

    return currentContentLength > this.MAX_TEXT_LENGTH ? true : false;
  }

  shouldLimitText(editorState: EditorState): boolean {
    const currentContentLength = this.getCurrentTextLength(editorState);

    return currentContentLength > this.MAX_TEXT_LENGTH - 1 ? true : false;
  }

  shouldDisplayTextCountComponent(editorState: EditorState): boolean {
    const currentContentLength = this.getCurrentTextLength(editorState);
    const percentage = Math.round((currentContentLength / this.MAX_TEXT_LENGTH) * 100);

    return percentage >= 70 ? true : false;
  }
}

export default new TextCountService();
