import { ContentBlock, EditorState, Modifier } from "draft-js";
import { getSelectedBlock } from "draftjs-utils";

type CaretCoordinates = {
  x: number;
  y: number;
};

const currentCoordinates: CaretCoordinates = {
  x: 0,
  y: 0,
};

export function getSelectionRange() {
  const selection = window.getSelection()
  if (selection?.rangeCount === 0) {
    return null
  }
  return selection?.getRangeAt(0)
}

export function isMatching(trigger: string | RegExp, textToMatch: string) {
  if (typeof trigger === "string") {
    return getTriggerRange(trigger, textToMatch);
  } else if (trigger instanceof RegExp) {
    return getTriggerMatchRange(trigger, textToMatch);
  }
}

export function getTriggerMatchRange(regexp: RegExp, text: string) {
  if (!text || /\s+$/.test(text)) {
    return null;
  }

  const start = text.match(regexp);

  if (!start) {
    return;
  }

  return {
    text: start[1],
  };
}

export function getTriggerRange(term: string, text: string) {
  if (!text || /\s+$/.test(text))
    return null;

  const start = text.lastIndexOf(term);
  if (start === -1) {
    return null;
  }

  return {
    text: text.substring(start),
  };
}

export function getTextToMatch(editorState: EditorState, separator: string = " "): string | null {
  let result: string | null = null;
  const selection = editorState.getSelection();
  const selectedBlock: ContentBlock = getSelectedBlock(editorState);
  const selectedBlockText = selectedBlock.getText();
  const focusOffset = selection.getFocusOffset();
  const lastSeparator = (selectedBlockText.lastIndexOf(separator, focusOffset));

  // check on first character or after last space
  if ((lastSeparator === -1 && focusOffset > 1) || (lastSeparator >= 0 && lastSeparator <= focusOffset)) {
    result = selectedBlockText.substring(lastSeparator === -1 ? 0 : lastSeparator, focusOffset);
  }

  return result;
}

export function getInsertRange(editorState: EditorState, firstCharacter: string): { start: number, end: number } {
  const selection = editorState.getSelection();
  const content = editorState.getCurrentContent();
  const anchorKey = selection.getAnchorKey();
  const end = selection.getAnchorOffset();
  const block = content.getBlockForKey(anchorKey);
  const text = block.getText();
  const start = text.substring(0, end).lastIndexOf(firstCharacter);

  return {
    start,
    end,
  };
}

export function getCaretCoordinates(): CaretCoordinates {
  const range = getSelectionRange();
  if (range) {
    const { left: x, top: y }  = range.getBoundingClientRect();
    Object.assign(currentCoordinates, { x, y });
  }
  return currentCoordinates;
}

export function insertText(text: string, editorState: EditorState): EditorState {
  const selection = editorState.getSelection();
  const cs = Modifier.insertText(editorState.getCurrentContent(), selection, text);
  const newEditorState = EditorState.push(
    editorState,
    cs,
    'insert-characters'
  );

  return newEditorState;
}