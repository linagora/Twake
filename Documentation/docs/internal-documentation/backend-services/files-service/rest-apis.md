---
description: Rest api for files
---

# REST APIs

**Prefix**: /internal/services/files/v1/

## General

{% swagger baseUrl="/internal/services/files/v1" path="/:company_id/files/:file_id" method="get" summary="Get file metadata (check user belongs to comapny)" %}
{% swagger-description %}
This route is called to get the metadata related to the 

`file_id`

 mentioned in the URL
{% endswagger-description %}

{% swagger-response status="200" description="" %}
```
Response:
  {
    "resource": {
        "company_id": "uuid-v4",
        "id": "uuid-v4",
        "application_id": "string",
        "created_at": "number",
        "encryption_key": "",
        "metadata": {
            "name": "string",
            "mime": "string"
        },
        "thumbnails": [
            {
                "index": number,
                "id": "string,
                "size": number,
                "type": "string",
                "width": number,
                "height": number
            }
        ],
        "updated_at": number,
        "upload_data": {
            "size": number,
            "chunks": number
        },
        "user_id": "uuid-v4"
    }
  }
```
{% endswagger-response %}
{% endswagger %}

{% swagger baseUrl="/internal/services/files/v1" path="/companies/:company_id/files/:file_id/download" method="get" summary="Download a file " %}
{% swagger-description %}
This route is called to download the file related to the 

`file_id`

 mentionned in the URL
{% endswagger-description %}

{% swagger-response status="200" description="" %}
```
```
{% endswagger-response %}
{% endswagger %}

{% swagger baseUrl="/internal/services/files/v1" path="/companies/:company_id/files/:file_id/thumbnails/:id" method="get" summary="Download thumbnails" %}
{% swagger-description %}
This route is called to download the thumbnail related to the 

`file_id`

 mentionned in the URL
{% endswagger-description %}

{% swagger-response status="200" description="" %}
```
```
{% endswagger-response %}
{% endswagger %}

****

{% swagger baseUrl="/internal/services/files/v1" path="/companies/:company_id/files/:file_id" method="delete" summary="Delete a file" %}
{% swagger-description %}
This route is called to delete the file related to the 

`file_id`

 mentionned in the URL
{% endswagger-description %}

{% swagger-response status="200" description="" %}
```
```
{% endswagger-response %}
{% endswagger %}

## Classic upload

To upload a single file, you must call this route and put the file binary data into a "file" multipart section.

{% swagger baseUrl="/internal/services/files/v1" path="/companies/:company_id/files?thumbnail_sync=1" method="post" summary="Upload a file " %}
{% swagger-description %}
This route is called to upload a file when chunk upload is not necessary.

\


Thumbnail_sync: when set then backend will wait up to 10 seconds for preview to be generated before reply.
{% endswagger-description %}

{% swagger-parameter in="query" name="thumbnail_sync" type="boolean" %}

{% endswagger-parameter %}

{% swagger-parameter in="body" name="File " type="object" %}
The file which will be uploaded
{% endswagger-parameter %}

{% swagger-response status="200" description="" %}
```
response : 
  {
    "resource": {
        "company_id": "uuid-v4",
        "metadata": {
            "name": "string",
            "mime": "string"
        },
        "thumbnails": [],
        "application_id": string,
        "upload_data": {
            "size": number,
            "chunks": number
        },
        "id": "uuid-v4",
        "updated_at": number,
        "created_at": number
  }
}
  
```
{% endswagger-response %}
{% endswagger %}

## Upload with chunk

To upload a file in multiple chunk you must first initial the file itself, and then upload into the file.

The file initialization and following upload calls takes this parameters as **a query string**:

* **filename**: string, file name
* **type**: string, mime type for the file
* **total\_chunks**: number, total number of chunk to be uploaded
* **total\_Size**: number, sum of every chunk size (total file size)
* **chunk\_number**: number, current chunk uploaded, set it to undefined during file creation process.
* **thumbnail\_sync:** when set then backend will wait up to 10 seconds for the preview to be generated before to reply.

{% swagger baseUrl="/internal/services/files/v1" path="/companies/:company_id/files/?filename..." method="post" summary="Upload a file with chunk" %}
{% swagger-description %}
This route should first be called without data to initialise the entity for multi-chunk, then chunks must be sent on other route below
{% endswagger-description %}

{% swagger-response status="200" description="" %}
```
```
{% endswagger-response %}
{% endswagger %}

{% swagger baseUrl="/internal/services/files/v1" path="/companies/:company_id/files/:file_id/?totalChunks..." method="post" summary="Overwrite a file " %}
{% swagger-description %}
Overwrite a file 

\


(check user belongs to company)

\


User can call this if the file was not already uploaded. If file already exist only apps can do this (users cannot directly overwrite a file).
{% endswagger-description %}

{% swagger-response status="200" description="" %}
```
```
{% endswagger-response %}
{% endswagger %}
