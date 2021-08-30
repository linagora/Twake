export type PreviewPubsubRequest = {
  document: {
    id: string;
    path: string;
    provider: string;
    mime?: string;
    filename?: string;
  };
  output: {
    path: string;
    provider: string;
    pages?: number; //Max number of pages for the document
    width?: number; //Max width for the thumbnails
    height?: number; //Max height for the thumbnails
  };
};

export type PreviewPubsubCallback = {
  document: {
    id: string;
    path: string;
    provider: string;
  };
  thumbnails: {
    path: string;
    provider: string;
    index: number;
    width: number;
    height: number;
  }[];
};
