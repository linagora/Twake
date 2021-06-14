import { ContentState, EditorState, convertToRaw, convertFromRaw} from "draft-js";
import { stateToMarkdown } from "draft-js-export-markdown";
import { stateFromMarkdown } from "draft-js-import-markdown";
import { EditorTextFormat } from "./Editor";

export function toString(editorState: EditorState, format: EditorTextFormat): string {
  let contentState = editorState.getCurrentContent();
  switch (format) {
    case "markdown": {
      let markdown: string = stateToMarkdown(contentState, { gfm: true }).trim();
      // when empty the stateToMarkdown lib returns a zero-width-space character in first position
      if (markdown.length === 1 && markdown.charCodeAt(0) === 8203) {
        markdown = "";
      }

      console.log("MARKDOWN", `${markdown}`)

      return markdown;
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