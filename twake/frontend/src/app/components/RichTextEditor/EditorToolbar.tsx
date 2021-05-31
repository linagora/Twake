import React, { ReactNode } from "react";
import { EditorState, RichUtils } from "draft-js";
import { Button, Tooltip } from "antd";
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
  buttonSize?: number;
};

export default (props: EditorToolbarProps) => {
  const toolbarConfig = props.toobarConfig || DefaultToolbarConfig;
  const buttonSize = props.buttonSize || 16;
  const buttonGroups = toolbarConfig.display.map(groupName => {
    switch (groupName) {
      case 'INLINE_STYLE_BUTTONS': {
        return _renderInlineStyleButtons(groupName, toolbarConfig);
      }
      // TODO: Other options will come here, list, etc
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
        size="small"
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
        return <BoldOutlined style={{fontSize: buttonSize}}/>;
      case "ITALIC":
        return <ItalicOutlined style={{fontSize: buttonSize}}/>;
      case "UNDERLINE":
        return <UnderlineOutlined style={{fontSize: buttonSize}}/>;
      case "STRIKETHROUGH":
        return <StrikethroughOutlined style={{fontSize: buttonSize}}/>;
      case "CODE":
        return <CodeOutlined style={{fontSize: buttonSize}}/>;
      default:
        return <></>;
    }
  }

  function _toggleInlineStyle(inlineStyle: string) {
    props.onChange(RichUtils.toggleInlineStyle(props.editorState, inlineStyle));
  }
};
