import { File, PublicFile } from "./entities/file";

const formatPublicFile = (file: Partial<File | PublicFile>): PublicFile => {
  if ((file as Partial<File>).getPublicObject) file = (file as Partial<File>).getPublicObject();
  return {
    ...file,
    thumbnails: [
      ...file.thumbnails.map(thumbnail => ({
        ...thumbnail,
        full_url: thumbnail.url.match(/https?:\/\//)
          ? "/internal/services/files/v1/" + thumbnail.url.replace(/^\//, "")
          : thumbnail.url,
      })),
    ],
  } as PublicFile;
};
