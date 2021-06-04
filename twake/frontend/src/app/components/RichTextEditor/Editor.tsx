import React, { KeyboardEvent } from "react";
import { Editor, EditorState, Modifier, CompositeDecorator, RichUtils, DraftEditorCommand, DraftHandleValue, DraftDecorator, KeyBindingUtil } from "draft-js";
import { toString } from "./EditorDataParser";
import { SuggestionList } from "./plugins/suggestion/SuggestionList";
import { getCaretCoordinates, getTrigger, insertText } from "./EditorUtils";
import { EditorSuggestionPlugin, SupportedSuggestionTypes, getPlugins } from "./EditorPlugins";
import "./Editor.scss";

const { isSoftNewlineEvent } = KeyBindingUtil;

export type EditorTextFormat = "raw" | "markdown";
type SyntheticKeyboardEvent = KeyboardEvent<{}> & {code: string};

type CaretCoordinates = {
  x: number;
  y: number;
};

type CurrentSuggestion<T> = {
  position: CaretCoordinates;
  searchText: string;
  items: Array<T>;
};

type EditorProps = {
  editorState: EditorState;
  plugins: Array<string>;
  onSubmit?: (content: string, editorState?: EditorState) => void;
  onChange?: (editorState: EditorState) => void;
  onTab?: () => void;
  clearOnSubmit: boolean;
  outputFormat: EditorTextFormat;
  placeholder?: string;
};

type EditorViewState = {
  activeSuggestion: CurrentSuggestion<SupportedSuggestionTypes> | null;
  suggestionType: string;
  suggestionIndex: number;
};

export class EditorView extends React.Component<EditorProps, EditorViewState> {
  outputFormat: EditorTextFormat;
  editor!: Editor | null;
  plugins: Map<EditorSuggestionPlugin<any>["resourceType"], EditorSuggestionPlugin<any>> = new Map();

  constructor(props: EditorProps) {
    super(props);

    getPlugins(this.props.plugins || []).forEach(p => this.enablePlugin(p));
    this.outputFormat = this.props.outputFormat || "markdown";
    this.state = this.getInitialState();
  }

  private enablePlugin(plugin: EditorSuggestionPlugin<any>): void {
    this.plugins.set(plugin.resourceType, plugin);
  }

  private getInitialState(): EditorViewState {
    return {
      activeSuggestion: null,
      suggestionIndex: 0,
      suggestionType: "",
    }
  }

  private resetState(callback?: () => void | undefined): void {
    this.setState(this.getInitialState(), callback);
  }

  private resetStateAndFocus(): void {
    this.resetState(() => { (requestAnimationFrame(() => this.focus())) });
  }

  private isDisplayingSuggestions(): boolean {
    return !!(this.state.activeSuggestion?.items.length);
  }

  handleKeyCommand(command: DraftEditorCommand, editorState: EditorState): DraftHandleValue {
    const newState = RichUtils.handleKeyCommand(editorState, command);

    if (newState) {
      this.onChange(newState);
      return 'handled';
    }

    return 'not-handled';
  }

  handleReturn(e: SyntheticKeyboardEvent, editorState: EditorState): DraftHandleValue {
    if (this._handleReturnSoftNewline(e, editorState)) {
      return 'handled';
    }
    
    if (this.isDisplayingSuggestions()) {
      const result = this.onSuggestionSelected(this.state.activeSuggestion?.items[this.state.suggestionIndex]);

      if (result) {
        return 'handled';
      }
    }

    if (this.submit(editorState)) {
      return 'handled';
    }
    
    return 'handled';
  }
  
  submit(editorState: EditorState): boolean {
    this.props.onSubmit && this.props.onSubmit(toString(editorState, this.outputFormat));
    if (this.props.clearOnSubmit) {
      this.resetStateAndFocus();
    }

    return true;
  }

  /**
   * Handle shift + enter
   * 
   * @param e 
   * @param editorState 
   * @returns 
   */
  _handleReturnSoftNewline(e: SyntheticKeyboardEvent, editorState: EditorState): boolean {
    if (isSoftNewlineEvent(e)) {
      const selection = editorState.getSelection();

      if (selection.isCollapsed()) {
        this.onChange(RichUtils.insertSoftNewline(editorState));
      } else {
        let content = editorState.getCurrentContent();
        let newContent = Modifier.removeRange(content, selection, 'forward');
        let newSelection = newContent.getSelectionAfter();
        let block = newContent.getBlockForKey(newSelection.getStartKey());
        newContent = Modifier.insertText(
          newContent,
          newSelection,
          '\n',
          block.getInlineStyleAt(newSelection.getStartOffset()),
        );
        this.onChange(EditorState.push(editorState, newContent, 'insert-fragment'));
      }
      return true;
    }
    return false;
  }
  
  focus() {
    this.editor?.focus();
  }
  
  onChange(editorState: EditorState) {
    this.updateSuggestionsState();
    this.props.onChange && this.props.onChange(editorState);
  }
  
  updateSuggestionsState(): void {
    const triggered = Array.from(this.plugins.values()).some(plugin => {
      const trigger = getTrigger(plugin.trigger);

      if (trigger) {
        plugin.resolver(trigger.text, items => {
          const activeSuggestion = {
            position: getCaretCoordinates(),
            searchText: trigger.text,
            items,
          };
          this.setState({
            activeSuggestion,
            suggestionType: plugin.resourceType,
            suggestionIndex: 0,
          });  
        });
        return true;
      }

      return false;
    });

    if (!triggered && this.isDisplayingSuggestions()) {
      this.resetState();
    }
  }

  onSuggestionSelected(suggestion: any): boolean {
    if (!suggestion) {
      return false;
    }

    const type = this.state.suggestionType;
    const plugin = this.plugins.get(type);
    if (!plugin) {
      return false;
    }

    if (!plugin.onSelected) {
      return false;
    }

    const editorState = plugin.onSelected(suggestion, this.props.editorState);
    const newEditorState = insertText(" ", editorState);
    this.resetStateAndFocus();
    this.onChange(newEditorState);

    return true;
  }

  renderSuggestion(props: any, type: string): JSX.Element {
    const plugin = this.plugins.get(type);

    if (!plugin) {
      return <></>;
    }

    if (!plugin.renderSuggestion) {
      return <></>;
    }

    return plugin.renderSuggestion(props);
  }

  insertCommand(type: string, data: SupportedSuggestionTypes): void {
    const plugin = this.plugins.get(type);

    if (!plugin || !plugin.insert) {
      return;
    }


    this.onChange(plugin.insert(data, this.props.editorState));
    this.resetStateAndFocus();
  }

  onDownArrow(e: SyntheticKeyboardEvent): void {
    if (this.isDisplayingSuggestions()) {
      e.preventDefault();
      this.setState({ suggestionIndex: (this.state.suggestionIndex - 1) < 0 ? 0 : this.state.suggestionIndex - 1 })
    }
  }
  
  onUpArrow(e: SyntheticKeyboardEvent): void {
    if (this.isDisplayingSuggestions()) {
      e.preventDefault();
      const suggestionsLength = this.state.activeSuggestion?.items.length || 0;
      const suggestionIndex = this.state.suggestionIndex === suggestionsLength - 1 ? suggestionsLength - 1 : this.state.suggestionIndex + 1;
      this.setState({ suggestionIndex })
    }
  }

  onEscape(e: SyntheticKeyboardEvent): void {
    if (this.isDisplayingSuggestions()) {
      e.preventDefault();
      this.resetStateAndFocus();
    }
  }

  onTab(e: SyntheticKeyboardEvent): void {
    e.preventDefault();
    
    if (this.isDisplayingSuggestions()) {
      this.resetStateAndFocus();
    }

    this.props.onTab && this.props.onTab();
  }

  render() {
    return <div 
      className="editor" 
      onClick={ this.focus.bind(this) }>
      
      <Editor
        ref={ node => this.editor = node }
        editorState={ this.props.editorState } 
        onChange={this.onChange.bind(this)}
        handleKeyCommand={this.handleKeyCommand.bind(this)}
        handleReturn={this.handleReturn.bind(this)}
        onDownArrow={this.onDownArrow.bind(this)}
        onUpArrow={this.onUpArrow.bind(this)}
        onEscape={this.onEscape.bind(this)}
        onTab={this.onTab.bind(this)}
        placeholder={this.props.placeholder || ""}
        />
        
        {(
          this.isDisplayingSuggestions() &&  
            <div style={{ position: "relative", top: "-40px" }} className="suggestions">
              {(
                this.state.activeSuggestion?.items.length && this.state.suggestionType &&
                <SuggestionList<any>
                  list={this.state.activeSuggestion?.items}
                  position={"top"}
                  renderItem={(props: any) => this.renderSuggestion(props, this.state.suggestionType)}
                  onSelected={this.onSuggestionSelected.bind(this)}
                  selectedIndex={this.state.suggestionIndex}
                />
              )}
          </div>
        )}
    </div>
  }
}
