---
description: Tags API
---

## GET a tag

Used to get a tag

**URL** : `/internal/services/tags/v1/companies/:company_id/tags/:tag_id`

**Method** : `GET`

**Auth required** : Yes

### Success Response

**Code** : `200 OK`

**Content example**

```javascript
{
  {
    company_id: string,
    tag_id: string,
    name: string,
    colour: string,
  };
}
```

## LIST a tags

Used to get a tag

**URL** : `/internal/services/tags/v1/companies/:company_id/tags`

**Method** : `LIST`

**Auth required** : Yes

### Success Response

**Code** : `200 OK`

**Content example**

```javascript
{
  {
    company_id: string,
    tag_id: string,
    name: string,
    colour: string,
  }[];
}
```

## Create a tag

Used to create a tag

**URL** : `/internal/services/tags/v1/companies/:company_id/tags`

**Method** : `POST`

**Auth required** : Yes

**Owner/admin right required** : Yes

**Data constraints**

```javascript
{
  name: string,
  colour: string,
}
```

### Success Response

**Code** : `201 CREATED`

## Update a tag

Used to update a tag

**URL** : `/internal/services/tags/v1/companies/:company_id/tag/:tag_id`

**Method** : `POST`

**Auth required** : Yes

**Owner/admin right required** : Yes

**Data constraints**

```javascript
{
  name: string,
  colour: string,
}
```

### Success Response

**Code** : `201 OK`

## Delete a tag

Used to delete a tag

**URL** : `/internal/services/tags/v1/companies/:company_id/tags/:tag_id`

**Method** : `DELETE`

**Auth required** : Yes

**Owner/admin right required** : Yes

### Success Response

**Code** : `200 OK`
