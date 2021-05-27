import React, { ReactNode } from "react";
import { EditorState, RichUtils } from "draft-js";
import { Button } from "antd";
import { BoldOutlined, UnderlineOutlined, ItalicOutlined, StrikethroughOutlined, CodeOutlined } from '@ant-design/icons';
import DefaultToolbarConfig, { GroupName, StyleConfig, ToolbarConfig } from "./EditorToolbarConfig";
import "./EditorToolbar.scss";

// Todo: Check this https://github.com/sstur/react-rte/blob/master/src/lib/EditorToolbar.js
// https://dev.to/rose/rich-text-editing-on-the-web-formatting-text-and-keyboard-shortcuts-in-draft-js-4g9f

type ChangeHandler = (state: EditorState) => any;

type EditorToolbarProps = {
  toobarConfig?: ToolbarConfig;
  editorState: EditorState;
  onChange: ChangeHandler;
};

export default (props: EditorToolbarProps) => {
  const toolbarConfig = props.toobarConfig || DefaultToolbarConfig;
  const buttonGroups = toolbarConfig.display.map(groupName => {
    switch (groupName) {
      case 'INLINE_STYLE_BUTTONS': {
        return _renderInlineStyleButtons(groupName, toolbarConfig);
      }
      // TODO: Other options will come here
    }
  });

  return (
    <div className="editor-toolbar">
      {buttonGroups}
    </div>
  );

  function _renderInlineStyleButtons(groupName: GroupName, config: ToolbarConfig) {
    const { editorState } = props;
    const currentStyle = editorState.getCurrentInlineStyle();
    const buttons = (config.INLINE_STYLE_BUTTONS || []).map((type, index) => (
      <Button
        key={`${index}`}
        type="text"
        onMouseDown={e => {
          e.preventDefault();
          _toggleInlineStyle(type.style)
        }}
        className={`inline ${type.className} ${currentStyle.has(type.style) ? "active" : "not-active"}`}
        icon={getIcon(type)}
      />
    ));

    return (
      <div key={groupName} className="button-group">
        {buttons}
      </div>
    );
  }

  function getIcon(style: StyleConfig): ReactNode {
    switch (style.style) {
      case "BOLD":
        return <BoldOutlined/>;
      case "ITALIC":
        return <ItalicOutlined/>;
      case "UNDERLINE":
        return <UnderlineOutlined/>;
      case "STRIKETHROUGH":
        return <StrikethroughOutlined/>;
      case "CODE":
        return <CodeOutlined/>;
      default:
        return <></>;
    }

  }

  function _toggleInlineStyle(inlineStyle: string) {
    props.onChange(RichUtils.toggleInlineStyle(props.editorState, inlineStyle));
  }
};
