import { ContentState, EditorState, convertToRaw, convertFromRaw} from "draft-js";
import { draftToMarkdown, markdownToDraft, DraftToMarkdownOptions } from "markdown-draft-js";
import { EditorTextFormat } from "./Editor";
import { EditorSuggestionPlugin } from "./plugins";


export default class EditorDataParser {
  private entityItems: DraftToMarkdownOptions["entityItems"] = {};
  private styleItems: DraftToMarkdownOptions["styleItems"] = {};

  constructor(private plugins: EditorSuggestionPlugin<any>[] = []) {
    this.plugins.forEach(plugin => {
      if (plugin.serializer) {
        this.entityItems![plugin.resourceType] = {
          open: entity => plugin.serializer?.open(entity) || "",
          close: entity => plugin.serializer?.close(entity) || "",
        };
      }
    });

    // adding custom support for underline since it is not natively available in markdown
    this.styleItems!["UNDERLINE"] = {
      open: () => "__",
      close: () => "__"
    };
  }

  toString(editorState: EditorState, format: EditorTextFormat): string {
    let contentState = editorState.getCurrentContent();

    switch (format) {
      case "markdown": {
        let markdown = draftToMarkdown(convertToRaw(contentState), {
          entityItems: this.entityItems,
          styleItems: this.styleItems,
          escapeMarkdownCharacters: false,
          // types definition are not up to date...
        } as DraftToMarkdownOptions).trim();

        // when empty the stateToMarkdown lib returns a zero-width-space character in first position
        if (markdown.length === 1 && markdown.charCodeAt(0) === 8203) {
          markdown = "";
        }

        return this.replaceElements(markdown);
      }

      case "raw": {
        return JSON.stringify(convertToRaw(contentState));
      }

      default: {
        throw new Error(`${format} format not supported`);
      }
    }
  }

  fromString(markup: string, format: EditorTextFormat): ContentState {
    switch (format) {
      case "markdown": {
        return convertFromRaw(markdownToDraft(markup));
      }
      case "raw": {
        return convertFromRaw(JSON.parse(markup));
      }
      default: {
        throw new Error(`${format} format not supported`);
      }
    }
  }

  private replaceElements(content: string): string {
    this.plugins.forEach(plugin => {
      if (plugin.serializer && plugin.serializer.replace) {
        content = plugin.serializer.replace(content);
      }
    });
    return content;
  }
}
