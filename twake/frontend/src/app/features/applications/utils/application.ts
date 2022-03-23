import { Application } from '../types/application';

type DefaultApplicationEntries = Partial<Application>;

const defaultApplicationPayload: Application = {
  id: '',
  company_id: '',
  identity: {
    code: 'code',
    name: 'name',
    icon: 'icon',
    description: 'This is a cool application',
    website: 'website',
    categories: [],
    compatibility: [],
  },
  api: {
    hooks_url: 'hooksUrl',
    allowed_ips: '*',
  },
  access: {
    read: [],
    write: [],
    delete: [],
    hooks: [],
  },
  display: {
    twake: {
      version: 1,

      files: {
        editor: {
          preview_url: 'string',
          edition_url: 'string',
          extensions: [],

          // if file was created by the app, then the app is able to edit with or without extension
          empty_files: [
            {
              url: 'string',
              filename: 'string',
              name: 'string', // "Word Document";
            },
          ],
        },
        actions: [
          //List of action that can apply on a file
          {
            name: 'string',
            id: 'string',
          },
        ],
      },

      //Chat plugin
      chat: {
        input: undefined,
        commands: [
          {
            command: 'string',
            description: 'string',
          },
        ],
        actions: [
          //List of action that can apply on a message
          {
            name: 'string',
            id: 'string',
          },
        ],
      },

      //Allow app to appear as a bot user in direct chat
      direct: undefined,

      //Display app as a standalone application in a tab
      tab: { url: 'string' },

      //Display app as a standalone application on the left bar
      standalone: { url: 'string' },

      //Define where the app can be configured from
      configuration: ['global', 'channel'],
    },
  },
  publication: {
    requested: false, //Publication requested
  },
  stats: {
    created_at: 0,
    updated_at: 0,
    version: 0,
  },
};

export const buildDefaultApplicationPayload = (
  partials?: DefaultApplicationEntries,
): Application => ({
  ...defaultApplicationPayload,
  ...partials,
});
