---
description: Documents API
---

## Fetch a drive item

Used to fetch a drive item

**URL** : `/internal/services/documents/v1/companies/:company_id/item/:id`

**Method** : `GET`

**Auth required** : Yes

### Success Response

**Code** : `200 OK`

**Content example**

```javascript
{
  item: {
      id: string;
      company_id: string;

      parent_id: string;
      in_trash: boolean;
      is_directory: string;
      name: string;
      extension: string;
      description: string;
      tags: [];

      added: string;
      last_modified: string;
      last_version_cache: DriveItemVersion;

      access_info: DriveItemAccessInfo;
  };
  versions: {
      id: string;

      provider: string | 'drive' | 'internal';
      file_id: string;
      file_metadata: FileMetadata;

      date_added: number;
      creator_id: string;
      application_id: string;
  }[];
  children: {
      id: string;
      company_id: string;

      parent_id: string;
      in_trash: boolean;
      is_directory: string;
      name: string;
      extension: string;
      description: string;
      tags: [];

      added: string;
      last_modified: string;
      last_version_cache: DriveItemVersion;

      access_info: DriveItemAccessInfo;
  }[];
};
```

## Create a drive item

Used to create a drive item

**URL** : `/internal/services/documents/v1/companies/:company_id/item`

**Method** : `POST`

**Auth required** : Yes

**Data constraints**

```javascript
{
  item: {
      id: string;
      company_id: string;

      parent_id: string;
      in_trash: boolean;
      is_directory: string;
      name: string;
      extension: string;
      description: string;
      tags: [];

      added: string;
      last_modified: string;
      last_version_cache: DriveItemVersion;

      access_info: DriveItemAccessInfo;
  },
  version: {
      id: string;

      provider: string | 'drive' | 'internal';
      file_id: string;
      file_metadata: FileMetadata;

      date_added: number;
      creator_id: string;
      application_id: string;
  },
}
```

### Success Response

**Code** : `200 OK`

## Update a drive item

Used to update a drive item

**URL** : `/internal/services/documents/v1/companies/:company_id/item/:id`

**Method** : `POST`

**Auth required** : Yes

**Data constraints**

```javascript
{

  id: string;
  company_id: string;

  parent_id: string;
  in_trash: boolean;
  is_directory: string;
  name: string;
  extension: string;
  description: string;
  tags: [];

  added: string;
  last_modified: string;
  last_version_cache: DriveItemVersion;

  access_info: DriveItemAccessInfo;
}
```

### Success Response

**Code** : `200 OK`

## Delete a drive item

Used to delete a drive item

**URL** : `/internal/services/documents/v1/companies/:company_id/item/:id`

**Method** : `DELETE`

**Auth required** : Yes

### Success Response

**Code** : `200 OK`


## Create a drive item version

Used to create a drive item version

**URL** : `/internal/services/documents/v1/companies/:company_id/item/:id/version`

**Method** : `POST`

**Auth required** : Yes

**Data constraints**

```javascript
{
  id: string;

  provider: string | 'drive' | 'internal';
  file_id: string;
  file_metadata: {
      source: 'internal' | 'drive' | string;
      external_id: string | any;

      name?: string;
      mime?: string;
      size?: number;
      thumbnails?: {
          index: number;
          id: string;

          type: string;
          size: number;
          width: number;
          height: number;

          url: string;
          full_url?: string;
      }[];
  };

  date_added: number;
  creator_id: string;
  application_id: string;
}
```

### Success Response

**Code** : `200 OK`

## zip download

Used to create a zip archive containing the requested drive items ( files and folders ).

**URL** : `/internal/services/documents/v1/companies/:company_id/item/:id/download/zip`

**Method** : `POST`

**Auth required** : Yes

**Data constraints**

```javascript
{
  items: string[]
}
```
