# Virtual Try-On API

## Endpoint

```http
POST /api/v1/virtual-try-on/outfit
```

---

# Authentication

Authentication is required.

Supported authentication methods:

* Bearer Token
* Session Cookie

---

# Request Type

```text
multipart/form-data
```

---

# Supported Roles

The endpoint supports two authenticated roles:

* **USER**
* **SELLER**

The controller automatically routes the request to the appropriate service based on the authenticated user's role.

---

# User Request

## Required Fields

| Field                  | Required |
| ---------------------- | :------: |
| prompt                 |     ✓    |
| ratio                  |     ✓    |
| cloth1Id **or** cloth1 |     ✓    |
| cloth2Id **or** cloth2 |     ✓    |

### Optional Fields

| Field      |
| ---------- |
| cloth3Id   |
| cloth3     |
| modelPhoto |

If `modelPhoto` is not provided, the authenticated user's profile image is used.

---

# Seller Request

## Required Fields

| Field                       | Required |
| --------------------------- | :------: |
| prompt                      |     ✓    |
| ratio                       |     ✓    |
| productId1 **or** cloth1    |     ✓    |
| aiModelId **or** modelPhoto |     ✓    |

### Optional Fields

| Field      |
| ---------- |
| productId2 |
| productId3 |
| cloth2     |
| cloth3     |

---

# Validation Rules

## Model Image Resolution

### User

A model image is resolved using the following priority:

1. Uploaded `modelPhoto`
2. User profile image

If neither exists, the request is rejected.

---

### Seller

A model image is resolved using the following priority:

1. Uploaded `modelPhoto`
2. Existing `aiModelId`

If neither exists, the request is rejected.

---

## Clothing & Product Images

Each image slot accepts **only one source**.

Valid examples:

```text
cloth1
OR
cloth1Id
```

```text
cloth2
OR
cloth2Id
```

```text
cloth3
OR
cloth3Id
```

The Seller flow follows the same rule.

```text
cloth1
OR
productId1
```

Providing both a file and an existing document ID for the same slot results in a validation error.

---

# User Business Rules

* Every `ClothingItem` must belong to the authenticated user.
* Uploaded model images always take priority over the user's profile image.
* Temporary Cloudinary uploads are deleted after processing.
* A successful request creates a new `VirtualTryOn` document.

---

# Seller Business Rules

* Every `Product` must belong to the authenticated seller.
* Product images may be supplied either as uploads or existing Product IDs.
* Uploaded model images always take priority over an existing AI Model.
* The generated AI preview is stored only on the primary Product.
* Temporary Cloudinary uploads are deleted after processing.

---

# Product Validation

Whenever a Product is created or updated:

* Only one fit section may contain values.
* The selected product type must match the populated fit section.
* Invalid fit combinations are rejected before the document is saved.

---

# Success Response

```json
{
    "statusCode": 200,
    "data": "...",
    "message": "Virtual try on generated successfully"
}
```

The shape of `data` depends on the authenticated role.

| Role   | Response                                              |
| ------ | ----------------------------------------------------- |
| USER   | Newly created `VirtualTryOn` document                 |
| SELLER | Updated `Product` containing the generated AI preview |

---

# Error Responses

## 400 Bad Request

Examples:

* Missing required images
* Both uploaded file and document ID supplied for the same slot
* Invalid prompt
* Invalid aspect ratio
* Invalid product fit data

---

## 401 Unauthorized

Returned when the request is not authenticated.

---

## 404 Not Found

Examples:

* ClothingItem not found
* Product not found
* AI Model not found
* Resource does not belong to the authenticated owner

---

## 500 Internal Server Error

Returned when an unexpected server error occurs.

---

# Request Processing Flow

```text
Client
    │
    ▼
Authentication
    │
    ▼
Validate Request
    │
    ▼
Resolve Images
    │
    ▼
Repository Ownership Verification
    │
    ▼
Generate Outfit (BlackAI)
    │
    ▼
Persist Result
    │
    ▼
Delete Temporary Uploads
    │
    ▼
Response
```

---

# Notes

* Uploaded images are treated as temporary resources unless they become part of a permanent document.
* Ownership validation is enforced inside repositories.
* Image resolution is handled by dedicated resolvers, allowing services to remain independent of image sources.
* Temporary Cloudinary uploads are deleted in a `finally` block, ensuring cleanup even when generation fails.
