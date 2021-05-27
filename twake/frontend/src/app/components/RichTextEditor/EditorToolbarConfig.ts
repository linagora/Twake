export type StyleConfig = {
  label: string;
  style: string;
  className?: string;
};

export type StyleConfigList = Array<StyleConfig>;

export type GroupName = 'INLINE_STYLE_BUTTONS' | 'BLOCK_ALIGNMENT_BUTTONS' | 'BLOCK_TYPE_BUTTONS' | 'LINK_BUTTONS' | 'BLOCK_TYPE_DROPDOWN' | 'HISTORY_BUTTONS' | 'IMAGE_BUTTON';

export type ToolbarConfig = {
  display: Array<GroupName>;
  extraProps?: Object;
  INLINE_STYLE_BUTTONS: StyleConfigList;
  BLOCK_ALIGNMENT_BUTTONS: StyleConfigList;
  BLOCK_TYPE_DROPDOWN: StyleConfigList;
  BLOCK_TYPE_BUTTONS: StyleConfigList;
};

export const INLINE_STYLE_BUTTONS: StyleConfigList = [
  {label: 'Bold', style: 'BOLD'},
  {label: 'Underline', style: 'UNDERLINE'},
  {label: 'Italic', style: 'ITALIC'},
  {label: 'Strikethrough', style: 'STRIKETHROUGH'},
  {label: 'Monospace', style: 'CODE'},
];

export const BLOCK_ALIGNMENT_BUTTONS: StyleConfigList = [
  {label: 'Align Left', style: 'ALIGN_LEFT'},
  {label: 'Align Center', style: 'ALIGN_CENTER'},
  {label: 'Align Right', style: 'ALIGN_RIGHT'},
  {label: 'Align Justify', style: 'ALIGN_JUSTIFY'},
];

export const BLOCK_TYPE_DROPDOWN: StyleConfigList = [
  {label: 'Normal', style: 'unstyled'},
  {label: 'Heading Large', style: 'header-one'},
  {label: 'Heading Medium', style: 'header-two'},
  {label: 'Heading Small', style: 'header-three'},
  {label: 'Code Block', style: 'code-block'},
];
export const BLOCK_TYPE_BUTTONS: StyleConfigList = [
  {label: 'UL', style: 'unordered-list-item'},
  {label: 'OL', style: 'ordered-list-item'},
  {label: 'Blockquote', style: 'blockquote'},
];

let EditorToolbarConfig: ToolbarConfig = {
  //display: ['INLINE_STYLE_BUTTONS', 'BLOCK_ALIGNMENT_BUTTONS', 'BLOCK_TYPE_BUTTONS', 'LINK_BUTTONS', 'IMAGE_BUTTON', 'BLOCK_TYPE_DROPDOWN', 'HISTORY_BUTTONS'],
  display: ['INLINE_STYLE_BUTTONS'],
  INLINE_STYLE_BUTTONS,
  BLOCK_ALIGNMENT_BUTTONS,
  BLOCK_TYPE_DROPDOWN,
  BLOCK_TYPE_BUTTONS,
};

export default EditorToolbarConfig;