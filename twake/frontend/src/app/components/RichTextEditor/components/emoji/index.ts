import { ContentBlock, ContentState } from "draft-js";
import { Emoji } from "./Emoji";
import EmojiService from 'services/emojis/emojis';
import { EditorSuggestionPlugin } from "../../Editor";

export type EmojiSuggestionType = {
  name: string;
  colons: string;
  native: any;
};

const findEmojiEntities = (contentBlock: ContentBlock, callback: any, contentState: ContentState) => {
  contentBlock.findEntityRanges(
    (character: any) => {
      const entityKey = character.getEntity();
      return (
        entityKey !== null &&
        contentState.getEntity(entityKey).getType() === 'EMOJI'
      );
    },
    callback
  );
}

const resolver = (text: string, max: number, callback: (emojis: EmojiSuggestionType[]) => void) => {
  EmojiService.search(text, (suggestions: EmojiSuggestionType[]) => {
    const result: Array<EmojiSuggestionType & { autocomplete_id: number }> = [];

    for (let j = 0; j < max; j++) {
      result[j] = {...suggestions[j], ...{ autocomplete_id: j }};
    }
    callback(result);
  });
}

export default (options: { maxSuggestions: number } = { maxSuggestions: 10 }): EditorSuggestionPlugin<EmojiSuggestionType> => ({
  resolver: (text, callback) => resolver(text, options.maxSuggestions, callback),
  decorator: {
    strategy:  findEmojiEntities,
    component: Emoji,
  },
  trigger: /\B:([\-+\w]+)$/,
});
