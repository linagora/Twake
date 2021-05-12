import { MessageFileMetadata } from "./entities/message-files";

/* Blocks objects */

export type Block = { block_id?: string } & (
  | BlockFile
  | BlockActions
  | BlockContext
  | BlockHeader
  | BlockDivider
  | BlockImage
  | BlockInput
  | BlockSection
  | BlockIframe
);

type BlockActions = {
  type: "actions";
  elements: BlockElement[];
};

type BlockContext = {
  type: "context";
  elements: (BlockElementImage | CompositionTextObject)[];
};

type BlockHeader = {
  type: "header";
  text: CompositionPlainTextObject;
};

type BlockDivider = {
  type: "divider";
};

type BlockFile = {
  type: "file";
  external_id: string;
  source: string;
  metadata?: MessageFileMetadata;
};

type BlockImage = BlockElementImage & {
  title?: CompositionPlainTextObject;
};

type BlockInput = {
  type: "input";
  label: string;
  element: BlockElement;
  dispatch_action?: boolean;
  hint?: CompositionPlainTextObject;
  optional?: boolean;
};

type BlockSection = {
  type: "section";
  text?: CompositionTextObject;
  fields?: CompositionTextObject[];
  accessory: BlockElement;
};

type BlockIframe = {
  type: "iframe";
  iframe_url: string;
  width: number;
  height: number;
};

/* Elements objects */

export type BlockElement =
  | BlockElementImage
  | BlockElementButton
  | BlockElementCheckboxes
  | BlockElementDatePicker
  | BlockElementMultiselectMenu
  | BlockElementPlaintextInput
  | BlockElementRadioButtonInput
  | BlockElementSelectMenus
  | BlockElementOverflowMenus
  | BlockElementTimePicker;

type BlockElementImage = {
  type: "image";
  image_url: string;
  alt_text: string;
  metadata?: MessageFileMetadata;
};

type BlockElementButton = {
  type: "button";
  text: CompositionPlainTextObject;
  action_id: string;
  url?: string;
  value?: string;
  style?: "primary" | "danger" | "default";
  confirm?: CompositionConfirmationDialog;
};

type BlockElementCheckboxes = {
  type: "checkboxes";
  action_id: string;
  options: CompositionOption[];
  initial_options?: CompositionOption[];
  confirm?: CompositionConfirmationDialog;
};

type BlockElementPlaintextInput = {
  type: "plain_text_input";
  action_id: string;
  placeholder?: CompositionPlainTextObject;
  initial_value?: string;
  multiline?: boolean;
  min_length?: number;
  max_length?: number;
  dispatch_action_config?: DispatchActionConfiguration;
};

type BlockElementRadioButtonInput = {
  type: "radio_buttons";
  action_id: string;
  options: CompositionOption[];
  initial_option?: CompositionOption;
  confirm?: CompositionConfirmationDialog;
};

type BlockElementDatePicker = {
  type: "datepicker";
  action_id: string;
  placeholder?: CompositionPlainTextObject;
  initial_date?: string;
  confirm?: CompositionConfirmationDialog;
};

type BlockElementTimePicker = {
  type: "timepicker";
  action_id: string;
  placeholder?: CompositionPlainTextObject;
  initial_time?: string;
  confirm?: CompositionConfirmationDialog;
};

type BlockElementOverflowMenus = {
  type: "overflow";
  action_id: string;
  options: CompositionOption[];
  confirm?: CompositionConfirmationDialog;
};

type BlockElementSelectMenus = {
  type: "";
}; //TODO

type BlockElementMultiselectMenu = {
  type: "";
}; //TODO

/* Composition objects */

type CompositionTextObject = CompositionPlainTextObject | CompositionMarkdownTextObject;

type CompositionPlainTextObject = {
  type: "plain_text";
  text: string;
};

type CompositionMarkdownTextObject = {
  type: "mrkdwn";
  text: string;
};

type CompositionConfirmationDialog = {
  title: CompositionPlainTextObject;
  text: CompositionMarkdownTextObject;
  confirm: CompositionPlainTextObject;
  deny: CompositionPlainTextObject;
  style: "confirm" | "danger" | "default";
};

type CompositionOption = {
  text: CompositionPlainTextObject;
  value: string;
  description?: CompositionPlainTextObject;
  url?: string;
};

type CompositionOptionGroup = {
  label: CompositionPlainTextObject;
  options: CompositionOption[];
};

type DispatchActionConfiguration = {
  trigger_actions_on: ("on_enter_pressed" | "on_character_entered")[];
};
