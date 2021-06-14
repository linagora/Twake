import { ContentBlock, ContentState, EditorState, Modifier } from "draft-js";
import WorkspacesApps from 'services/workspaces/workspaces_apps';
import { Command } from "./Command";
import { getInsertRange } from "../../EditorUtils";
import CommandSuggestion from "./CommandSuggestion";
import { EditorSuggestionPlugin } from "../";

export type CommandSuggestionType = {
  command: string;
  description: string;
  autocomplete_id: number;
};

export const CommandResourceType = "COMMAND";

const findEntities = (contentBlock: ContentBlock, callback: any, contentState: ContentState) => {
  contentBlock.findEntityRanges(
    (character: any) => {
      const entityKey = character.getEntity();
      return (
        entityKey !== null &&
        contentState.getEntity(entityKey).getType() === CommandResourceType
      );
    },
    callback
  );
}

const resolver = (text: string, max: number, callback: (commands: CommandSuggestionType[]) => void) => {
  let commands: CommandSuggestionType[] = [];

  WorkspacesApps.getApps().map(app => {
    if (app) {
      commands = commands.concat(
        (((app.display || {}).messages_module || {}).commands || [])
          .map((c: any) => ({ command: `/${app.simple_name} ${c.command}`, description: c.description }))
      );
    }
  });
  callback(commands
    .filter(c => c.command.startsWith(`/${text}`))
    .map((c, index) => ({...c, ...{ autocomplete_id: index }}))
  );
}

const addCommand = (command: CommandSuggestionType, editorState: EditorState): EditorState => {
  const { start, end } = getInsertRange(editorState, "/")
  const contentState = editorState.getCurrentContent()
  const currentSelection = editorState.getSelection()
  const selection = currentSelection.merge({
    anchorOffset: start,
    focusOffset: end,
  })
  
  const entity = contentState.createEntity(CommandResourceType, 'IMMUTABLE', command);
  const entityKey = entity.getLastCreatedEntityKey();
  const newContentState = Modifier.replaceText(
    entity,
    selection,
    command.command.split('[')[0].split('"')[0],
    undefined,
    entityKey);

  const newEditorState = EditorState.push(
    editorState, newContentState, "insert-fragment"
  );

  return EditorState.forceSelection(
    newEditorState,
    newContentState.getSelectionAfter());
}

export default (options: { maxSuggestions: number } = { maxSuggestions: 10 }): EditorSuggestionPlugin<CommandSuggestionType> => ({
  resolver: (text, callback) => resolver(text, options.maxSuggestions, callback),
  decorator: {
    strategy:  findEntities,
    component: Command,
  },
  trigger: /^\/([a-z0-9]*)$/,
  resourceType: CommandResourceType,
  onSelected: (command: CommandSuggestionType, editorState: EditorState) => addCommand(command, editorState),
  renderSuggestion: (command: CommandSuggestionType) => CommandSuggestion(command),
});
