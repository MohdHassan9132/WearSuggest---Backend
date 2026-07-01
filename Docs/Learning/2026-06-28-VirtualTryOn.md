## Adding the Seller Virtual Try-On flow

Initially the Virtual Try-On feature only supported users.

During this session I extended the same feature for sellers.

At first I thought the seller flow would need its own image resolver because sellers work with Products instead of ClothingItems.

After implementing it, I realized the resolver shouldn't know anything about Users or Sellers.

Its only responsibility is:

> "Given either a file or a document id, return an image."

The resolver now receives an `ownerId` together with a repository function.

```js
imageSourceResolver({
    filePath,
    docId,
    ownerId,
    fetchImage
})
```

The repository performs the ownership check while the resolver simply returns the image.

This made the resolver reusable for both Users and Sellers without adding role-specific logic.

---

## Moving ownership checks into repositories

Originally the repositories only searched by document id.

For example:

```js
Product.findById(id)
```

That meant another seller could potentially generate previews using someone else's products if they knew the id.

The repositories now search using both the document id and the owner.

Example:

```js
Product.findOne({
    _id: id,
    seller: ownerId
})
```

The same approach is used for ClothingItems.

This made me realize that repositories shouldn't only hide MongoDB queries.

They should also enforce ownership rules whenever data is fetched.

---

## Product schema validation

I wanted invalid fit data to never reach the database.

Instead of relying on controllers, I moved the rules into the Product schema.

The schema now checks:

* only one fit section is filled
* the fit section matches the product type
* unused sections are removed automatically

I also learned that my version of Mongoose no longer uses `next()` inside this middleware.

Instead I simply throw an error when validation fails.

```js
throw new Error(...)
```

Otherwise the middleware just finishes normally.

This was a good reminder to verify framework behaviour instead of assuming older examples still apply.

---

## AI Preview Storage

I considered storing the generated outfit preview on every product used in the request.

I decided against it.

The generated image represents the entire outfit rather than each individual product.

Saving it on every product would duplicate data, consume more storage and make the seller dashboard harder to understand.

Instead, the preview is stored only on the primary product.

That felt like the simplest and cleanest solution.
