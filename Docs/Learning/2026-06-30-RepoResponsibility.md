## Session - June 30, 2026

### Repository Responsibility & Hiding Infrastructure Details

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
