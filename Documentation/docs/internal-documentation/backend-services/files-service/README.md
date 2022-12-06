---
description: File on Twake
---

# 📄 Files

## description

**Files** is everything related to file upload in Twake after the migration to Node.js. Note that the Twake Drive isn't part of this migration because it will be replaced by Linshare.

Twake Files upload support chunk upload and file encryption.

## Wording

**File:** document to upload, no constraint on the type of document \(image, text, pdf ..\)

**Chunk:** Large file are split in multiple chunk for the upload process

## Encryption

Files and Storage services in Twake feature encryption at rest in **aes-256-cbc**.

Each file is encrypted with two layers:

- A file encryption key and iv stored in database and different for each file.
- A global encryption key and iv used in addition to the previous one and equal for each file.

## Models and APIs

[database-models](database-models.md)

## Miscellaneous

[resumablejs](resumablejs.md)
