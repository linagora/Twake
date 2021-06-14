import { ContentBlock, EditorState, Modifier } from "draft-js";
import { getSelectedBlock } from "draftjs-utils";

export function getCurrentBlock(editorState: EditorState): ContentBlock {
  return editorState.getCurrentContent().getBlockForKey(editorState.getSelection().getStartKey())
};

/**
 * Add a block after the current one with given type and initial content
 *
 * @param editorState
 * @param newType 
 * @param initialContent 
 */
export const splitBlockWithType = (editorState: EditorState, type = "unstyled", splitOffset: number, deleteAfter: boolean): EditorState => {
  let contentState = editorState.getCurrentContent();
  const selection = editorState.getSelection();
  let updatedSelection = selection.merge({
    anchorOffset: splitOffset,
    focusOffset: splitOffset,
  });

  let newEditorState = EditorState.acceptSelection(editorState, updatedSelection);

  contentState = Modifier.splitBlock(contentState, updatedSelection);
  newEditorState = EditorState.push(editorState, contentState, "split-block")
  newEditorState = resetBlockWithType(newEditorState, type, "");

  if (deleteAfter) {
    let contentState = newEditorState.getCurrentContent();
    const selectedBlock = getSelectedBlock(newEditorState);

    updatedSelection = newEditorState.getSelection().merge({
      anchorOffset: 0,
      focusOffset: selectedBlock.getText().length,
    });

    contentState = Modifier.replaceText(
      newEditorState.getCurrentContent(),
      updatedSelection,
      "",
      newEditorState.getCurrentInlineStyle(),
    );

    newEditorState = EditorState.push(editorState, contentState, 'insert-characters');
  }

  return newEditorState;
}

/**
 * Will reset the current block with the given type and the initial content
 * Note that it will remove all the text already existing
 *
 * @param editorState 
 * @param newType 
 * @param initialContent 
 * @returns 
 */
export const resetBlockWithType = (editorState: EditorState, newType = "unstyled", initialContent = ""): EditorState => {
  let contentState = editorState.getCurrentContent();
  const focusOffset = editorState.getSelection().getFocusOffset();
  const updatedSelection = editorState.getSelection().merge({
    anchorOffset: 0,
    focusOffset,
  });
  const newEditorState = EditorState.acceptSelection(editorState, updatedSelection);
  contentState = Modifier.replaceText(
    newEditorState.getCurrentContent(),
    updatedSelection,
    initialContent,
    newEditorState.getCurrentInlineStyle(),
  );

  contentState = Modifier.setBlockType(contentState, updatedSelection, newType);
  
  return EditorState.push(editorState, contentState, 'change-block-type');
};


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

export const getSelection = (root: Window = window): Selection | null => {
  let selection: Selection | null = null;
  if (root.getSelection) {
    selection = root.getSelection();
  } else if (root.document.getSelection) {
    selection = root.document.getSelection();
  }
  return selection;
};

export function getSelectionRange(): Range | null {
  const selection = getSelection();

  if (!selection) {
    return null;
  }

  if (selection?.rangeCount === 0) {
    return null
  }

  return selection?.getRangeAt(0);
}

export function getCaretCoordinates(): DOMRect | null {
  const selection = getSelectionRange();

  if (!selection) {
    return null;
  }

  return selection.getBoundingClientRect();
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