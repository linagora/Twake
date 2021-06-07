export type Languages = {
  default: string;
  availables: string[];
};

export type ServerConfiguration = {
  status: "ready";
  version: {
    current: string;
    minimal: {
      web: string;
      mobile: string;
    };
  };
  configuration: {
    help_link: string | null;
    accounts: {
      type: "console" | "internal";
      console: null | {
        authority: string;
        client_id: string;
        account_management_url: string;
        company_management_url: string;
        collaborators_management_url: string;
      };
      internal: null | {
        disable_account_creation: boolean;
        disable_email_verification: boolean;
      };
    };
  };
};
