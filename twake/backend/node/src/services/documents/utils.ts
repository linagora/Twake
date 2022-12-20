import { merge } from "lodash";
import { DriveFile } from "./entities/drive-file";
import { CompanyExecutionContext } from "./types";
import crypto from "crypto";
import { FileVersion } from "./entities/file-version";

/**
 * Returns the default DriveFile object using existing data
 *
 * @param {Partial<DriveFile>} item - the partial drive file item.
 * @param {CompanyExecutionContext} context - the company execution context
 * @returns {DriveFile} - the Default DriveFile
 */
export const getDefaultDriveItem = (
  item: Partial<DriveFile>,
  context: CompanyExecutionContext,
): DriveFile => {
  const defaultDriveItem = merge(new DriveFile(), {
    company_id: context.company.id,
    added: item.added || new Date().getTime().toString(),
    creator: item.creator || context.user.id,
    is_directory: item.is_directory || false,
    is_in_trash: false,
    last_user: item.last_user || context.user.id,
    last_modified: new Date().getTime().toString(),
    parent_id: item.parent_id || "",
    root_group_folder: item.root_group_folder || "",
    attachements: item.attachements || [],
    content_keywords: item.content_keywords || "",
    description: item.description || "",
    access_info: item.access_info || {
      authorized_entities: [
        {
          id: context.user.id,
          type: "user",
        },
      ],
      unauthorized_entities: [],
      public_access_token: generateAccessToken(),
    },
    detached_file: item.detached_file || false,
    extension: item.extension || "",
    external_storage: item.external_storage || false,
    has_preview: item.has_preview || false,
    hidden_data: item.hidden_data || {},
    last_version_cache: item.last_version_cache,
    object_link_cache: item.object_link_cache || "",
    name: item.name || "",
    preview_link: item.preview_link || "",
    shared: item.shared || false,
    size: item.size || 0,
    tags: item.tags || [],
    url: item.url || "",
    public_access_key: item.public_access_key || generateAccessToken(),
    workspace_id: item.workspace_id || "",
  });

  if (item.id) {
    defaultDriveItem.id = item.id;
  }

  return defaultDriveItem;
};

/**
 * Returns the default FileVersion item.
 *
 * @param {Partial<FileVersion>} version - the partial version item
 * @param {CompanyExecutionContext} context - the execution context
 * @returns
 */
export const getDefaultDriveItemVersion = (
  version: Partial<FileVersion>,
  context: CompanyExecutionContext,
): FileVersion => {
  const defaultVersion = merge(new FileVersion(), {
    application_id: version.application_id || "",
    creator_id: version.creator_id || context.user.id,
    data: version.data || {},
    date_added: version.date_added || new Date().getTime(),
    file_id: version.file_id || "",
    file_metadata: version.file_metadata,
    file_size: version.file_size || 0,
    filename: version.filename || "",
    key: version.key || "",
    mode: version.mode || "OpenSSL-2",
    provider: version.provider,
    realname: version.realname,
  });

  if (version.id) {
    defaultVersion.id = version.id;
  }

  return defaultVersion;
};

/**
 * Generates a random sha1 access token
 *
 * @returns {String} - the random access token ( sha1 hex digest ).
 */
const generateAccessToken = (): string => {
  const randomBytes = crypto.randomBytes(32);

  return crypto.createHash("sha1").update(randomBytes).digest("hex");
};
