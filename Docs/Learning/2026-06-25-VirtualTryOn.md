# Learning - Virtual Try On

**Date:** 25 June 2026

## What I was trying to do

At first, I was putting almost everything inside the `UserService`.

The service was checking:

* Did the user send a file or a ClothingItem id?
* Should the image be uploaded to Cloudinary?
* Should it fetch the image from MongoDB?
* Should it call the AI service?
* Should it delete temporary images?
* Should it save the final result?

It worked, but every new feature meant adding more `if` statements inside the service. After a while it started feeling like the service was doing too many different jobs.

---

## Separating the image logic

I noticed that every clothing image followed the same pattern.

First I had to answer one question:

> Where should this image come from?

The answer could be:

* A newly uploaded image.
* A ClothingItem stored in the database.

Instead of asking that question inside the service every time, I created an `imageSourceResolver()`.

Now the service simply asks the resolver for an image.

The resolver decides where it should come from.

No matter where the image comes from, it always returns the same object.

```js
{
    url,
    publicId
}
```

Because of this, the service doesn't care whether the image came from Cloudinary or MongoDB.

---

## Model image needed different rules

At first I thought I could use the same resolver for the model image.

After thinking about it, I realized the rules are different.

For clothing images:

* Either upload a file.
* Or send a ClothingItem id.
* Never both.

For the model image:

* If the user uploads a new image, use it.
* Otherwise use the profile image.
* If neither exists, throw an error.

Since the rules are different, I created a separate `modelImageResolver()`.

Trying to force both cases into one resolver would only make it more complicated.

---

## Passing repository functions

Initially I thought about checking the user role inside the resolver.

That didn't feel right because the resolver shouldn't know anything about users or sellers.

Instead, I pass a repository function.

Example:

```js
findClothImage(id)
```

The resolver simply calls whatever function it receives.

It doesn't know whether the image comes from a ClothingItem, Product, or somewhere else.

This makes the resolver reusable.

---

## Using an object instead of many parameters

Originally the function looked like this.

```js
imageSourceResolver(filePath, docId, required, fetchImage)
```

Later I changed it to this.

```js
imageSourceResolver({
    filePath,
    docId,
    required,
    fetchImage
})
```

Both versions work exactly the same.

I changed it because it is much easier to read.

When I look at the function call, I immediately know what every value means.

It also makes it easier to add new options later without changing every function call.

---

## Avoiding repeated checks

Originally I was checking things like this many times.

```js
fs.existsSync(...)
mongoose.Types.ObjectId.isValid(...)
```

Later I changed it to this.

```js
const hasFile = !!filePath;
const hasDoc = mongoose.Types.ObjectId.isValid(docId);
```

Now I calculate the result once and reuse it everywhere.

The main reason isn't performance.

It simply avoids writing the same logic again and again.

---

## Cleaning temporary uploads

Initially I was deleting every uploaded image one by one.

Something like:

```js
if (cloth1?.publicId) ...
if (cloth2?.publicId) ...
if (cloth3?.publicId) ...
```

Later I collected every temporary upload into an array.

```js
const temporaryImages = [
    modelPhoto,
    cloth1,
    cloth2,
    cloth3
];
```

Then I loop through the array and delete only images that have a `publicId`.

This is shorter and if I add another image later, I only need to add it to the array.

---

## Biggest thing I learned today

The service should not try to solve every problem by itself.

Instead, every small problem should have its own place.

Now the service simply says:

1. Validate the request.
2. Get the model image.
3. Get the clothing images.
4. Send everything to the AI.
5. Save the result.
6. Delete temporary uploads.

Reading the service now almost feels like reading the feature requirements, which makes it much easier to understand.
