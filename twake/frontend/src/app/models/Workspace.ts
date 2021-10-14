export type WorkspaceType = {
  id: string;
  company_id: string;
  archived: boolean;
  default: boolean;
  name: string;
  mininame?: string;
  logo: string;
  role: string;
  stats: {
    created_at: Date;
    total_members: number;
  };
};
