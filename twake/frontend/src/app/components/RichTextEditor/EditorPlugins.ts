import mentionPlugin, { MentionSuggestionType } from "./plugins/mentions";
import emojiPlugin, { EmojiSuggestionType } from "./plugins/emoji";
import channelPlugin, { ChannelSuggestionType } from "./plugins/channel";
import commandPlugin, { CommandSuggestionType } from "./plugins/commands";
import { DraftDecorator, EditorState } from "draft-js";

export type SupportedSuggestionTypes = MentionSuggestionType | EmojiSuggestionType | ChannelSuggestionType | CommandSuggestionType;

export type EditorSuggestionPlugin<T extends SupportedSuggestionTypes> = {
  resolver: (text: string, callback: (items: T[]) => void) => void;
  decorator: DraftDecorator;
  trigger: string | RegExp;
  resourceType: string;
  getTextDisplay?: (item: T) => string;
  onSelected?: (item: T, editorState: EditorState) => EditorState;
  insert?: (item: T, editorState: EditorState) => EditorState;
  renderSuggestion?: (item: T) => JSX.Element;
};

const plugins = new Map<EditorSuggestionPlugin<any>["resourceType"], EditorSuggestionPlugin<any>>();

addPlugin(emojiPlugin());
addPlugin(mentionPlugin());
addPlugin(channelPlugin());
addPlugin(commandPlugin());

function addPlugin(plugin: EditorSuggestionPlugin<any>): void {
  plugins.set(plugin.resourceType.toLocaleLowerCase(), plugin);
}

export function getPlugins(types: string[] = []): Array<EditorSuggestionPlugin<any>> {
  const result: Array<EditorSuggestionPlugin<any>> = [];
  types.forEach(type => {
    const t = type.toLocaleLowerCase();
    if (plugins.has(t)) {
      result.push(plugins.get(t)!);
    }
  })
  
  return result.filter(Boolean);
}