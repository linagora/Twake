import { CharacterMetadata, ContentBlock, ContentState } from "draft-js";
import { Mention } from "./Mention";
import WorkspacesUser from 'services/workspaces/workspaces_users';
import { EditorSuggestionPlugin } from "../../Editor";

export type MentionSuggestionType = {
  username: string;
};

const findSuggestionEntities = (contentBlock: ContentBlock, callback: (start: number, end: number) => void, contentState: ContentState) => {
  contentBlock.findEntityRanges(
    (character: CharacterMetadata) => {
      const entityKey = character.getEntity();
      return (
        entityKey !== null &&
        contentState.getEntity(entityKey).getType() === 'MENTION'
      );
    }, callback);
}

const resolver = (text: string, max: number, callback: (mentions: MentionSuggestionType[]) => void) => {
  WorkspacesUser.searchUserInWorkspace(text, (users: Array<any>) => {
    const result: Array<MentionSuggestionType & { autocomplete_id: number }> = [];

    for (let j = 0; j < Math.min(max, users.length); j++) {
      result[j] = {...users[j], ...{ autocomplete_id: j }};
    }
    callback(result);
  });
}

export default (options: { maxSuggestions: number } = { maxSuggestions: 10 }): EditorSuggestionPlugin<MentionSuggestionType>  => ({
  resolver: (text, callback) => resolver(text, options.maxSuggestions, callback),
  decorator: {
    strategy:  findSuggestionEntities,
    component: Mention,
  },
  trigger: "@",
});