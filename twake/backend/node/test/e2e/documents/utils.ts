import { DriveFile } from "../../../src/services/documents/entities/drive-file";
import { FileVersion } from "../../../src/services/documents/entities/file-version";
import { TestPlatform } from "../setup";

const url = "/internal/services/messages/v1";
export const e2e_createDocument = async (
  platform: TestPlatform,
  item: Partial<DriveFile>,
  version: Partial<FileVersion>,
) => {
  const token = await platform.auth.getJWTToken();

  const response = await platform.app.inject({
    method: "POST",
    url: `${url}/companies/${platform.workspace.company_id}/item`,
    headers: {
      authorization: `Bearer ${token}`,
    },
    payload: {
      item,
      version,
    },
  });

  await new Promise(resolve => setTimeout(resolve, 200));

  return response;
};
