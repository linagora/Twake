import { EditorState, CompositeDecorator } from "draft-js";
import mentionsPlugin from "./components/mentions";
import channelsPlugin from "./components/channel";
import emojisPugin from "./components/emoji";
import commandsPugin from "./components/commands";

type EditorOptions = {};

class EditorStateService {
  private states: Map<string, EditorState>;
  
  // TODO: Add decorators
  constructor(options: EditorOptions) {
    this.states = new Map();
  }

  /**
   * Get editor state for given ID is already exists, else create a new one
   * 
   * @param editorId
   * @returns 
   */
  get(editorId: string): EditorState {
    if (!editorId) {
      throw new Error("Editor id is required");
    }

    let editor = this.states.get(editorId);
    if (!editor) {
      editor = this.createEditor();
      this.states.set(editorId, editor);
    }

    return editor;
  }

  set(editorId: string, editorState: EditorState): this {
    this.states.set(editorId, editorState);

    return this;
  }

  clear(editorId: string): this {
    this.states.delete(editorId);

    return this;
  }

  private createEditor(): EditorState {
    const emojis = emojisPugin();
    const mentions = mentionsPlugin();
    const channels = channelsPlugin();
    // TODO: apps/commands can be disabled cf InputAutoComplete -> props -> disableApps
    const commands = commandsPugin();
    const decorators = new CompositeDecorator([emojis.decorator, mentions.decorator, channels.decorator, commands.decorator]);

    return EditorState.createEmpty(decorators);
  }
}

const instance = new EditorStateService({});

export default instance;