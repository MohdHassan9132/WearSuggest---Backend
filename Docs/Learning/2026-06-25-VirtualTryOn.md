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

---

## Thinking about the VirtualTryOn model

I also spent some time thinking about what should actually be stored inside the `VirtualTryOn` model.

Initially I thought about storing the URLs of the clothing images.

After thinking about it more, I realized that the clothing already exists as a `ClothingItem`.

If I only store the URL, I lose the relationship between the generated try-on and the original clothing item.

Instead, I decided to store the `ClothingItem` ids.

This gives me a few advantages:

* If the ClothingItem still exists, I can easily show more details about it later.
* The generated try-on image still exists even if the ClothingItem gets deleted.
* I avoid storing the same information in multiple places.

This made me realize that designing the database is not only about storing data, but also about thinking how the application should behave in the future.

---

## Thinking about Git branches

I also spent some time planning how I want to continue developing the project.

Right now I have feature branches and another branch where I am slowly moving the project from a controller-heavy architecture to a Controller → Service → Repository architecture.

At first I was worried that this branch would become impossible to merge.

After thinking it through, I decided on this workflow:

```text
Feature Branch
        │
        ▼
       main
        │
        ▼
Architecture Refactor Branch
```

Instead of merging an unfinished refactor into `main`, I will keep `main` stable and continue bringing new changes from `main` into the refactor branch.

This allows me to experiment, break things, and fix them without affecting the stable version of the project.

---

## Thinking more about responsibilities

The biggest difference I noticed today wasn't writing code.

It was how I started thinking.

Earlier I used to ask myself questions like:

* Where should I write this code?
* Which file should this `if` statement go in?

Today I was asking different questions:

* Who should be responsible for this?
* Does this belong in the service or somewhere else?
* Should the resolver know about the database?
* Should the repository return the whole document or only the data I need?

Thinking this way made the code much simpler because every piece had one clear responsibility.

I think this is something I want to continue practicing while building the rest of the project.

