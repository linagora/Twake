export type EnvironmentType = {
  env_dev: boolean;
  api_root_url: string;
  front_root_url: string;
  websocket_url: string;
  socketio_url?: string;
  mixpanel_enabled?: boolean;
  mixpanel_id?: string;
  sentry_dsn: boolean;
  version_detail: string;
};

export type EnvironmentVersionType = {
  version: string;
  version_detail: string;
  version_name: string;
};
