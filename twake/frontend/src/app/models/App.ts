/**
 * DEPRECATED
 * We should remove this when we are sure that new application format is implemented everywhere in Twake
 */
export type AppType = { [key: string]: any };

/**
 * Preview file (full screen or inline)
 */
export type FilePluginPreview = {
  /**
   * Url to preview file (full screen or inline)
   */
  url: string;
  inline: boolean;

  /**
   * Main extensions app can read
   * @example ['docx', 'xlsx']
   */
  main_ext: string[];

  /**
   * Secondary extensions app can read
   * @example ['txt', 'html']
   */
  other_ext: string[];
};

export type PluginAction = {
  name: string;
  id: string;
};

export type FilePlugin = {
  /**
   * Preview file (full screen or inline)
   */
  preview?: FilePluginPreview;

  /**
   * List of action that can apply on a file
   */
  actions?: PluginAction[];
};

/**
 * @example { icon: "path/to/icon.png", type: "file" }
 */
export type ChatPluginInput = {
  /**
   * If defined replace original icon url of your app
   */
  icon: string;

  /**
   * To add in existing apps folder / default icon
   */
  type: 'file' | 'call';
};

/**
 * @example { command: "my_command_name", description: "My command description" }
 * @usage my_app_name my_command_name
 */
export type ChatPluginCommand = {
  /**
   * Name of the command
   */
  command: string;

  /**
   * Description of the command
   */
  description: string;
};

/**
 * Direct plugin object
 * Chat plugin object
 */
export type ChatPlugin = {
  input?: ChatPluginInput;

  /**
   * List of commands that can apply on a message
   */
  commands?: ChatPluginCommand[];

  /**
   * List of action that can apply on a message
   */
  actions?: PluginAction[];
};

/**
 * Direct plugin object
 * Allow app to appear as a bot user in direct chat
 * @example { name: "My app bot"}
 */
export type DirectPlugin = {
  /**
   * User bot name
   */
  name: string;

  /**
   * If defined replace original icon url of your app
   */
  icon: string;
};

/**
 * Display app as a standalone application in a tab
 */
export type TabPlugin = {
  url: string;
};

/**
 * Standalone plugin object
 * Display app as a standalone application on the left bar
 */
export type StandalonePlugin = {
  url: string;
};

export type ApplicationDisplay = {
  twake?: {
    version?: number;

    /**
     * File plugin object
     */
    files?: FilePlugin;

    /**
     * Chat plugin object
     */
    chat?: ChatPlugin;

    /**
     * Direct plugin object
     * Allow app to appear as a bot user in direct chat
     */
    direct?: DirectPlugin;

    /**
     * Tab plugin object
     * Display app as a standalone application in a tab
     */
    tab?: TabPlugin;

    /**
     * Standalone plugin object
     * Display app as a standalone application on the left bar
     */
    standalone?: StandalonePlugin;

    /**
     * Define where the app can be configured from
     * @example ['global', 'channel']
     */
    configuration?: string[];
  };
};

export type ApplicationAccess = {
  delete: string[];
  hooks: string[];
  read: string[];
  write: string[];
};

export type ApplicationIdentity = {
  key: string;
  name: string;
  icon: string;
  description: string;
  website: string;
  categories: string[];
  compatibility: string[];
};

type ApplicationPublication = {
  published?: boolean;
  pending?: boolean;
};

type ApplicationStatistics = {
  createdAt: number;
  updatedAt: number;
  version: number;
};

export type Application = {
  id: string;
  company_id: string;
  access: ApplicationAccess;
  display: ApplicationDisplay;
  identity: ApplicationIdentity;
  publication: ApplicationPublication;
  stats: ApplicationStatistics;
};
