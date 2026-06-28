# Virtual Try-On Architecture

## Goal

The Virtual Try-On feature allows both **Users** and **Sellers** to generate AI-powered virtual try-ons while keeping the architecture:

- Easy to understand
- Easy to extend
- Easy to maintain

The controller is responsible only for determining who is making the request. All business logic lives inside the appropriate service.

---

# Overall Flow

```text
Controller
    │
    ├── UserVirtualTryOnService
    │
    └── SellerVirtualTryOnService
```

---

# User Virtual Try-On Flow

```text
Controller
      │
      ▼
UserVirtualTryOnService
      │
      ├── Validate Prompt & Aspect Ratio
      ├── Resolve Model Image
      ├── Resolve Clothing Images
      ├── Repository Ownership Checks
      ├── Generate Outfit (BlackAI)
      ├── Create VirtualTryOn Document
      ├── Delete Temporary Uploads
      └── Return Response
```

The User service coordinates the entire generation flow while delegating image resolution, database operations, and AI communication to dedicated components.

---

# Seller Virtual Try-On Flow

```text
Controller
      │
      ▼
SellerVirtualTryOnService
      │
      ├── Validate Prompt & Aspect Ratio
      ├── Resolve AI Model
      ├── Resolve Product Images
      ├── Repository Ownership Checks
      ├── Generate Outfit (BlackAI)
      ├── Store AI Preview
      ├── Delete Temporary Uploads
      └── Return Response
```

Unlike the User flow, the Seller flow stores the generated preview inside the primary Product instead of creating a separate `VirtualTryOn` document.

Only the **first product** receives the generated preview.

This avoids storing duplicate AI previews across multiple products.

---

# Image Source Resolver

The `imageSourceResolver()` has a single responsibility:

> Return an image regardless of where it originates.

Possible image sources include:

- Uploaded file
- ClothingItem (User flow)
- Product (Seller flow)

The resolver never performs database queries itself.

Instead, the service supplies a repository callback.

```ts
imageSourceResolver({
    filePath,
    docId,
    ownerId,
    fetchImage
});
```

Every image source returns the same structure.

```ts
{
    url,
    publicId
}
```

Because every source shares the same return type, the services do not need separate logic for uploaded files and stored images.

---

# Model Image Resolver

Model images follow different rules than clothing images.

Resolution priority:

1. Uploaded model image
2. Existing User profile image
3. Existing Seller AI model image

If no valid model image can be resolved, the request is rejected.

Keeping this logic separate prevents the generic image resolver from becoming filled with role-specific conditions.

---

# Repository Responsibilities

Repositories have two responsibilities:

1. Read and write MongoDB documents.
2. Enforce resource ownership.

```text
Service
    │
    ▼
Image Resolver
    │
    ▼
Repository
    │
Ownership Check
    │
    ▼
MongoDB
```

Example:

```ts
Product.findOne({
    _id: productId,
    seller: ownerId
});
```

Clothing items follow the same ownership pattern.

Ownership validation is hidden inside repositories, allowing services and resolvers to remain database-agnostic.

---

# Product Validation

The Product schema owns all business rules related to fit information.

Before saving, it validates that:

- Only one fit section contains data.
- The selected product type matches the populated fit section.
- Empty fit sections are removed automatically.

This guarantees invalid product configurations never reach the database.

---

# Temporary Images

Images uploaded specifically for a single request are considered temporary.

Each temporary upload receives a Cloudinary `publicId`.

After the Virtual Try-On process finishes, the service removes every temporary upload inside a `finally` block.

```text
Temporary Upload
        │
        ▼
Cloudinary
        │
        ▼
Virtual Try-On Finished
        │
        ▼
Delete Temporary Images
```

Permanent images that belong to:

- ClothingItem
- Product
- AI Model

are never deleted.

---

# Layer Responsibilities

## Controller

- Receive the request
- Determine the authenticated role
- Call the correct service
- Return the response

---

## Service

- Execute the Virtual Try-On workflow
- Validate request data
- Coordinate resolvers
- Coordinate repositories
- Coordinate AI services
- Clean temporary uploads

---

## Resolver

- Decide where an image comes from
- Return a consistent image object
- Remain independent of database logic

---

## Repository

- Read MongoDB documents
- Update MongoDB documents
- Enforce ownership rules
- Hide persistence details

---

## BlackAI Service

- Receive prepared images
- Generate the virtual try-on
- Return the generated outfit

---

## Cloudinary Utility

- Upload temporary images
- Delete temporary uploads after processing

---

# Design Principles

The architecture follows several design principles:

- **Single Responsibility Principle** — each component has one job.
- **Dependency Injection** — repositories are supplied to resolvers.
- **Separation of Concerns** — controllers, services, resolvers, repositories, and external services each have clearly defined responsibilities.
- **Consistent Data Contracts** — all image sources return the same object structure.
- **Ownership Enforcement** — repositories ensure users can only access resources they own.
- **Automatic Cleanup** — temporary uploads are always deleted, even if generation fails.