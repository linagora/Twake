import { ContentState, EditorState, convertToRaw, convertFromRaw} from "draft-js";
import { stateToMarkdown } from "draft-js-export-markdown";
import { stateFromMarkdown } from "draft-js-import-markdown";
import { EditorTextFormat } from "./Editor";

export function toString(editorState: EditorState, format: EditorTextFormat): string {
  let contentState = editorState.getCurrentContent();
  switch (format) {
    case "markdown": {
      return stateToMarkdown(contentState);
    }
    case "raw": {
      return JSON.stringify(convertToRaw(contentState));
    }
    default: {
      throw new Error(`${format} format not supported`);
    }
  }
}

export function fromString(markup: string, format: EditorTextFormat): ContentState {
  switch (format) {
    case "markdown": {
      return stateFromMarkdown(markup);
    }
    case "raw": {
      return convertFromRaw(JSON.parse(markup));
    }
    default: {
      throw new Error(`${format} format not supported`);
    }
  }
}