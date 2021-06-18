export type EnvironmentType = {
  env_dev: boolean;
  mixpanel_enabled: boolean;
  sentry_dsn: boolean;
  mixpanel_id: boolean;
  front_root_url: string;
  api_root_url: string;
  socketio_url: string;
  websocket_url: string;
  version_detail: string;
};

export type EnvironmentVersionType = {
  version: string;
  version_detail: string;
  version_name: string;
};
