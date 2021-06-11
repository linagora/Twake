import React, { KeyboardEvent } from "react";
import classNames from "classnames";
import { Editor, EditorState, Modifier, RichUtils, DraftEditorCommand, DraftHandleValue, KeyBindingUtil, ContentBlock } from "draft-js";
import { toString } from "./EditorDataParser";
import { SuggestionList } from "./plugins/suggestion/SuggestionList";
import { getCaretCoordinates, getCurrentBlock, getTextToMatch, isMatching, resetBlockWithType, splitBlockWithType } from "./EditorUtils";
import { EditorSuggestionPlugin, SupportedSuggestionTypes, getPlugins } from "./EditorPlugins";
import "./Editor.scss";

const { isSoftNewlineEvent } = KeyBindingUtil;

export type EditorTextFormat = "raw" | "markdown";
type SyntheticKeyboardEvent = KeyboardEvent<{}> & {code: string};

type CurrentSuggestion<T> = {
  /**
   * The position of the caret the suggestion is linked to
   */
  position: DOMRect | null;
  /**
   * The text which has been searched for the current suggestion
   */
  searchText: string;
  /**
   * The items for the current suggestion
   */
  items: Array<T>;
};

type EditorProps = {
  editorState: EditorState;
  plugins: Array<string>;
  onSubmit?: (content: string, editorState?: EditorState) => void;
  onChange?: (editorState: EditorState) => void;
  onTab?: () => void;
  onFilePaste?: (files: Blob[]) => void;
  clearOnSubmit: boolean;
  outputFormat: EditorTextFormat;
  placeholder?: string;
  onUpArrow?: (e: SyntheticKeyboardEvent) => void;
};

type EditorViewState = {
  activeSuggestion: CurrentSuggestion<SupportedSuggestionTypes> | null;
  suggestionType: string;
  suggestionIndex: number;
  displaySuggestion: boolean;
  editorPosition: DOMRect | null;
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
      displaySuggestion: false,
      editorPosition: null,
    }
  }

  private resetState(callback?: () => void | undefined): void {
    this.setState(this.getInitialState(), callback);
  }

  private resetStateAndFocus(): void {
    this.resetState(() => { (requestAnimationFrame(() => this.focus())) });
  }

  private isDisplayingSuggestions(): boolean {
    return this.state.displaySuggestion && !!this.state.activeSuggestion?.items.length;
  }

  handleKeyCommand(command: DraftEditorCommand, editorState: EditorState): DraftHandleValue {
    const newState = RichUtils.handleKeyCommand(editorState, command);

    if (newState) {
      this.onChange(newState);
      return 'handled';
    }

    return 'not-handled';
  }

  /**
   * Handle return before a new block is added to the editor state
   */
  handleReturn(e: SyntheticKeyboardEvent, editorState: EditorState): DraftHandleValue {
    // Shift+Enter adds a soft new line
    if (this._handleReturnSoftNewline(e, editorState)) {
      return 'handled';
    }
    
    // when displaying suggestion, enter will select the current one
    if (this.isDisplayingSuggestions()) {
      const result = this.onSuggestionSelected(this.state.activeSuggestion?.items[this.state.suggestionIndex]);

      if (result) {
        return 'handled';
      }
    }

    if (!e.altKey && !e.metaKey && !e.ctrlKey) {
      const selection = editorState.getSelection();
      const currentBlock = getCurrentBlock(editorState);
      const blockType = currentBlock.getType();

      // When on a list, pressing Enter 2 times will add a new unstyled block
      if (currentBlock.getLength() === 0) {
        if (["unordered-list-item", "ordered-list-item"].includes(blockType)) {
          // Update the current block as unstyled one
          this.onChange(resetBlockWithType(editorState, "unstyled"));
          return "handled";
        } else {
          this.submit(editorState);
          return "handled";
        }
      }
      
      if (selection.isCollapsed() && currentBlock.getLength() === selection.getStartOffset()) {
        if (blockType === "unstyled") {
          this.submit(editorState);
          return "handled";
        }
      }
    }
    return 'not-handled';
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
    this.props.onChange && this.props.onChange(editorState);
    setTimeout(() => {
      this.updateSuggestionsState();
    });
  }
  
  updateSuggestionsState(): void {
    const textToMatch = getTextToMatch(this.props.editorState, " ");
    if (!textToMatch) {
      return;
    }

    const triggered = Array.from(this.plugins.values()).some(plugin => {
      const trigger = isMatching(plugin.trigger, textToMatch);

      if (trigger && trigger.text) {
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

    if (triggered && this.state.activeSuggestion?.items.length) {
      this.setState({ displaySuggestion: true });
    } else {
      this.resetState();
    }
  }

  onSuggestionSelected(suggestion: SupportedSuggestionTypes | undefined): boolean {
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
    this.resetStateAndFocus();
    this.onChange(editorState);

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
    this.props.onUpArrow && this.props.onUpArrow(e);
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

  handlePastedFiles(files: Blob[]): DraftHandleValue {
    if (this.props.onFilePaste) {
      this.props.onFilePaste(files);
      return "handled";
    }

    return "not-handled";
  }

  handleBeforeInput(inputString: string, editorState: EditorState): DraftHandleValue {
    const mapping: {[index: string]: string} = {
      "*.": "unordered-list-item",
      "* ": "unordered-list-item",
      "- ": "unordered-list-item",
      "1.": "ordered-list-item",
    };

    const selection = editorState.getSelection();
    const block = getCurrentBlock(editorState);
    const currentBlockType = block.getType();
    const blockLength = block.getLength();
    const blockText = block.getText();
    const regex = new RegExp("\r|\n", "gm");

    if (currentBlockType.indexOf("atomic") === 0) {
      return "not-handled";
    }

    let textToMatch = "";
    let resetBlock = false;
    let insertIndex = 0;

    if (selection.getAnchorOffset() === 1 && blockLength === 1) {
      // first line of the block, reset block with new one
      resetBlock = true;
      textToMatch = blockText[0] + inputString;
    } else {
      // check if we are at a new line
      const matches = [...blockText.matchAll(regex)];
      
      if (matches.length) {
        const lastMatch = matches[matches.length - 1];
        if (lastMatch) {
          insertIndex = (lastMatch.index ? lastMatch.index : 0) + 1;
          const afterLastSoftLine = blockText.substring(insertIndex, blockText.length);
          textToMatch = `${afterLastSoftLine}${inputString}`;
        }
      }
    }

    if (textToMatch === "") {
      return "not-handled";
    }

    const blockTo = mapping[textToMatch];

    if (!blockTo) {
      return "not-handled";
    }
    
    const finalType = blockTo.split(':');
    
    if (finalType.length < 1 || finalType.length > 3) {
      return "not-handled";
    }
    
    let mappingBlockType = finalType[0];
    
    if (finalType.length === 1) {
      if (currentBlockType === finalType[0]) {
        return "not-handled";
      }
    } else if (finalType.length === 2) {
      if (currentBlockType === finalType[1]) {
        return "not-handled";
      }
      if (currentBlockType === finalType[0]) {
        mappingBlockType = finalType[1];
      }
    } else if (finalType.length === 3) {
      if (currentBlockType === finalType[2]) {
        return "not-handled";
      }
      if (currentBlockType === finalType[0]) {
        mappingBlockType = finalType[1];
      } else {
        mappingBlockType = finalType[2];
      }
    }

    if (resetBlock) {
      this.onChange(resetBlockWithType(editorState, mappingBlockType, ""));
    } else {
      this.onChange(splitBlockWithType(editorState, mappingBlockType, insertIndex, true))
    }

    return "handled";
  }

  handleBlockStyle(contentBlock: ContentBlock): string {
    const type = contentBlock.getType();
    
    if (type === 'blockquote') {
      return 'editor-blockquote';
    }

    if (type === 'code-block') {
      return 'editor-code-block';
    }

    return '';
  }

  shouldHidePlaceHolder(): boolean {
    const contentState = this.props.editorState.getCurrentContent();

    return !contentState.hasText() && contentState.getBlockMap().first().getType() !== 'unstyled';
  }

  render() {
    return <div 
      className={classNames("editor", { "editor-hide-placeholder": this.shouldHidePlaceHolder.bind(this)() })} 
      onClick={ this.focus.bind(this) }>
      
      <Editor
        ref={ node => this.editor = node }
        editorState={ this.props.editorState } 
        onChange={this.onChange.bind(this)}
        handleKeyCommand={this.handleKeyCommand.bind(this)}
        handleReturn={this.handleReturn.bind(this)}
        handleBeforeInput={this.handleBeforeInput.bind(this)}
        onDownArrow={this.onDownArrow.bind(this)}
        onUpArrow={this.onUpArrow.bind(this)}
        onEscape={this.onEscape.bind(this)}
        onTab={this.onTab.bind(this)}
        handlePastedFiles={this.handlePastedFiles.bind(this)}
        blockStyleFn={this.handleBlockStyle.bind(this)}
        placeholder={this.props.placeholder || ""}
        />
        
        {(
          this.state.displaySuggestion &&  
            <div style={{ position: "relative", top: "-40px" }} className="suggestions">
              {(
                this.state.displaySuggestion && this.state.suggestionType &&
                <SuggestionList<any>
                  list={this.state.activeSuggestion?.items}
                  position={this.state.activeSuggestion ? this.state.activeSuggestion.position : null}
                  editorPosition={(this.editor as any)?.editorContainer?.getBoundingClientRect()}
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
