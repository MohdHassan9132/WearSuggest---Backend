# Session - June 30, 2026

## Repository Responsibility & Hiding Infrastructure Details

While working on the Seller Virtual Try-On flow, I noticed that my repository method was receiving Cloudinary-specific values:

```ts
addVirtualTryOnImage(
  productId,
  sellerId,
  secure_url,
  public_id
)
```

This meant the repository knew that images were stored using Cloudinary and even knew the names of Cloudinary's response fields.

That did not feel right because the repository's responsibility is only to persist application data.

I changed the flow so that `uploadFromUrl()` converts Cloudinary's response into the application's image object.

```ts
{
  url,
  publicId
}
```

Now the service simply does:

```ts
const virtualTryOnImage = await uploadFromUrl(generatedImageUrl);

await productRepository.addVirtualTryOnImage(
  productId,
  sellerId,
  virtualTryOnImage
);
```

The repository no longer knows anything about Cloudinary.

I also updated the Seller flow so it follows the same pattern as the User flow.

Both services now receive the same image object and pass that object to their repositories instead of manually extracting Cloudinary-specific fields.

During this session I also noticed that most image-related code already returns the same structure:

```ts
{
  url,
  publicId
}
```

The only remaining inconsistency is that `uploadOnCloudinary()` still returns Cloudinary's raw response.

I intentionally left that for a future cleanup because changing it would require a small refactor.

Eventually every image helper should return the same object.

### What I Learned

This session reinforced an important idea:

> A helper should hide the implementation details of the tool it wraps.

If a helper exists only to communicate with Cloudinary, then the rest of the application should never need to know Cloudinary's response format.

Instead, every layer should work with the application's own data structures.

Doing this makes the application easier to maintain because changing the storage provider would require changes only inside the Cloudinary utility instead of throughout the codebase.

---

## Array Defaults Should Match Database Operations

While testing the Seller Virtual Try-On flow, I ran into a MongoDB error while storing the generated AI preview.

The repository stores generated previews using:

```ts
$push: {
  "media.aiModelPreview": virtualTryOnImage
}
```

Initially, I was creating products like this:

```ts
media: {
  productImages: uploadedImages,
  aiModelPreview: null
}
```

Although the schema defines `aiModelPreview` as an array with a default value of `[]`, I was explicitly overriding that default by setting it to `null` during product creation.

When the repository later executed `$push`, MongoDB threw an error because `$push` only works on arrays.

I fixed this by initializing the field as an empty array instead:

```ts
media: {
  productImages: uploadedImages,
  aiModelPreview: []
}
```

Now every product starts with the correct data type, allowing the repository to append generated previews without any additional checks.

### What I Learned

This reminded me that the initial value of a field should match the operations I plan to perform on it later.

If a field will always receive values through `$push`, it should be initialized as an empty array instead of `null`.

Using the correct default type keeps the repository logic simple, avoids unnecessary runtime errors, and allows MongoDB update operators to work as intended.