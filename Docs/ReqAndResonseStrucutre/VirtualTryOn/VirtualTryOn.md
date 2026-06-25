# Virtual Try On API

## Endpoint

```
POST /api/v1/virtual-try-on/outfit
```

---

## Authentication

Required

```
Bearer Token / Cookie
```

---

## Request Type

```
multipart/form-data
```

---

## Request Fields

| Field      | Type     | Required  | Description                                                    |
| ---------- | -------- | --------- | -------------------------------------------------------------- |
| modelPhoto | File     | Optional* | Uploaded model image. Takes priority over saved profile image. |
| cloth1     | File     | Optional* | First clothing image.                                          |
| cloth2     | File     | Optional* | Second clothing image.                                         |
| cloth3     | File     | Optional  | Third clothing image.                                          |
| cloth1Id   | ObjectId | Optional* | Existing ClothingItem id.                                      |
| cloth2Id   | ObjectId | Optional* | Existing ClothingItem id.                                      |
| cloth3Id   | ObjectId | Optional  | Existing ClothingItem id.                                      |
| prompt     | String   | Required  | AI generation prompt.                                          |
| ratio      | String   | Required  | Output aspect ratio.                                           |

---

## Validation Rules

### Model Image

One of the following must exist:

* Uploaded `modelPhoto`
* User profile image

Uploaded model image takes priority.

---

### Clothing Images

For each clothing input:

Only one of the following is allowed.

```
cloth1
OR
cloth1Id
```

Same applies for:

* cloth2
* cloth3

Providing both results in a validation error.

---

## Success Response

```json
{
    // TODO
}
```

---

## Error Responses

### 400 Bad Request

```json
{
    // TODO
}
```

---

### 401 Unauthorized

```json
{
    // TODO
}
```

---

### 404 Not Found

```json
{
    // TODO
}
```

---

### 500 Internal Server Error

```json
{
    // TODO
}
```

---

## Processing Flow

```text
Client
    │
    ▼
Authentication
    │
    ▼
Validation
    │
    ▼
Resolve Images
    │
    ▼
BlackAI
    │
    ▼
Upload Result
    │
    ▼
Persist Data
    │
    ▼
Cleanup
    │
    ▼
Response
```
