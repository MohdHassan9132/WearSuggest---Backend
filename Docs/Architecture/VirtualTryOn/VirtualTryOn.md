# Virtual Try On Architecture

## Goal

The goal of this feature is to let both Users and Sellers generate AI virtual try-ons while keeping the code easy to understand and easy to change later.

The controller only decides who is making the request.

```text
Controller
        │
        ├── User Service
        └── Seller Service
```

After that, each service handles its own business logic.

---

## How the User Service works

The service follows the same order every time.

```text
Validate Request
        │
        ▼
Get Model Image
        │
        ▼
Get Clothing Images
        │
        ▼
Send Images to BlackAI
        │
        ▼
Save Generated Image
        │
        ▼
Create VirtualTryOn Document
        │
        ▼
Delete Temporary Images
```

The service doesn't decide where images come from.

It simply asks another function to provide them.

---

## Image Source Resolver

The image source resolver has only one job.

Figure out where the clothing image should come from.

Possible sources:

* Uploaded file.
* ClothingItem stored in the database.
* Product (Seller flow).

No matter where the image comes from, it always returns:

```js
{
    url,
    publicId
}
```

Because every source returns the same format, the service can use the image without caring where it came from.

---

## Model Image Resolver

The model image has different rules from clothing images.

Priority:

1. Use the uploaded model image if one was provided.
2. Otherwise use the user's profile image.
3. If neither exists, stop the request.

Keeping this logic in its own resolver keeps the service much smaller.

---

## Repository

The repository is the only place that talks to MongoDB.

The resolver never queries the database directly.

Instead, it receives a repository function.

Example:

```text
Service
    │
    ▼
Image Resolver
    │
    ▼
Repository
    │
    ▼
MongoDB
```

Because of this, the resolver doesn't know whether the image comes from a ClothingItem, Product, or something else.

---

## Temporary Images

Images uploaded only for the current request are temporary.

These images receive a Cloudinary `publicId`.

After the request finishes, they are deleted inside the `finally` block.

Images that already belong to ClothingItems or Products are never deleted because they are permanent data.

---

## Responsibility of each layer

### Controller

* Receive the request.
* Decide whether it should go to the User Service or Seller Service.
* Return the response.

### Service

* Run the complete Virtual Try-On flow step by step.
* Call validators, resolvers, repositories and AI services.

### Resolver

* Decide where an image should come from.
* Return the image in a consistent format.

### Repository

* Read or write data in MongoDB.
* Hide database details from the service.

### BlackAI Service

* Send images to the BlackAI API.
* Return the generated result.

### Cloudinary Utility

* Upload temporary images.
* Delete temporary images after they are no longer needed.
