import { EditorState } from "draft-js";

type CaretCoordinates = {
  x: number;
  y: number;
};

export function getSelectionRange() {
  const selection = window.getSelection()
  if (selection?.rangeCount === 0) {
    return null
  }
  return selection?.getRangeAt(0)
}

export function getTrigger(trigger: string | RegExp) {
  if (typeof trigger === "string") {
    return getTriggerRange(trigger);
  } else if (trigger instanceof RegExp) {
    return getTriggerMatchRange(trigger);
  }
}

export function getTriggerMatchRange(regexp: RegExp) {
  const range = getSelectionRange();
  if (!range) {
    return null;
  }
  const text  = range && range?.startContainer?.textContent?.substring(0, range.startOffset);
  console.log("TRIGGER TEXT", `"${text}"`)
  if (!text || /\s+$/.test(text)) {
    return null;
  }

  const start = text.match(regexp);

  if (!start) {
    return;
  }

  const end = range.startOffset
  return {
    end,
    start,
    text: start[1],
  }
}

export function getTriggerRange(term: string) {
  const range = getSelectionRange();
  if (!range) {
    return null;
  }
  const text  = range && range?.startContainer?.textContent?.substring(0, range.startOffset)
  if (!text || /\s+$/.test(text))
    return null

  const start = text.lastIndexOf(term)
  if (start === -1) {
    return null
  }

  return {
    end: range.startOffset,
    start,
    text: text.substring(start),
  }
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

const currentCoordinates: CaretCoordinates = {
  x: 0,
  y: 0,
};

export function getCaretCoordinates(): CaretCoordinates {
  const range = getSelectionRange();
  if (range) {
    const { left: x, top: y }  = range.getBoundingClientRect();
    Object.assign(currentCoordinates, { x, y });
  }
  return currentCoordinates;
}