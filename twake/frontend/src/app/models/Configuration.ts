import { Resource } from 'services/CollectionsReact/Collections';

export type ConfigurationType = {
  auth?: {
    internal?: {
      disable_account_creation?: any | null;
      disable_email_verification?: any | null;
      use?: boolean;
    };
  };
  auth_mode?: string[];
  elastic_search_available?: boolean;
  help_link?: string;
  ready?: boolean;
  version?: {
    current?: string;
    minimal?: {
      web?: string;
      mobile?: string;
    };
  };
};

export class ConfigurationResource extends Resource<ConfigurationType> {
  _type = 'configuration';
}
