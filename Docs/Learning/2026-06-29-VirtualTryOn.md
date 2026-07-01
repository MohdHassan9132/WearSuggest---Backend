# 2026-06-29 - Virtual Try-On

Today I finished connecting the User Virtual Try-On flow with TheNewBlack AI service and storing the generated result permanently.

## What I was trying to build

The goal was to allow a user to:

* choose clothing from their wardrobe or upload temporary clothing
* optionally upload a model image
* generate a virtual try-on using TheNewBlack
* save the generated image in my own database

I already had the controller, resolvers and repositories planned, but the external AI integration and persistence still needed to be completed.

---

# Biggest thing I learned

I realized that a Service should coordinate the workflow, while the Repository should only care about MongoDB.

At first I was thinking about changing the repository because the generated image first comes back as a URL and later becomes a Cloudinary object.

Instead I kept the repository simple.

The service now does:

```text
BlackAI
    ↓
Generated URL
    ↓
Cloudinary Upload
    ↓
Create resultImage object
    ↓
Repository
```

The repository never knows where the image came from.

That makes it reusable.

---

# BlackAI Response

One thing I didn't know before implementing was what TheNewBlack actually returned.

Instead of guessing, I tested it locally.

It turns out the endpoint returns a plain text URL like this:

```text
https://....tmp38nvomzl.jpg
```

Because of this, I changed my BlackAI service to return the response text instead of the raw Fetch Response object.

Before:

```js
return response;
```

After:

```js
const text = await response.text();

return text;
```

That made the service much easier to use.

---

# Cloudinary Upload

The generated URL belongs to TheNewBlack.

I don't want to depend on their CDN forever.

Instead I upload the generated image to Cloudinary and store my own copy.

The flow became:

```text
Generate Image
        ↓
Receive URL
        ↓
Upload to Cloudinary
        ↓
Store

{
    url,
    publicId
}
```

Now my application owns the final image.

---

# Repository Design

I almost moved Cloudinary-related logic into the repository.

I decided not to.

Repositories should only save data.

The service prepares everything first.

The repository simply receives:

```js
{
    owner,
    cloth1,
    cloth2,
    cloth3,
    resultImage
}
```

and saves it.

That separation feels much cleaner.

---

# Small Bug I Found

The controller wasn't calling the UserService.

After debugging, I realized the JWT stored:

```text
"user"
```

but I was checking

```text
"USER"
```

JavaScript string comparisons are case-sensitive.

Changing the comparison fixed the problem.

---

# Another Mistake

Initially I returned:

```js
return response.body;
```

after already reading

```js
await response.text();
```

The response body can only be consumed once.

The correct approach is simply:

```js
return text;
```

---

# Image Cleanup

Temporary uploads are still deleted inside the finally block.

That means uploaded clothing and model images never remain on Cloudinary after the request finishes.

Only the generated image becomes permanent because it is uploaded separately and saved inside the VirtualTryOn document.

---

# Naming

I also renamed one variable.

Instead of:

```js
const outfit = ...
```

I now use:

```js
const generatedImageUrl = ...
```

The new name describes what the variable actually contains.

Small naming improvements make the service easier to read months later.

---

# What I Like About The Final Design

The whole request now feels like one coordinated workflow.

```text
Validate

↓

Resolve Images

↓

Generate with BlackAI

↓

Upload Result

↓

Save MongoDB

↓

Delete Temporary Images

↓

Return Response
```

Each utility only does one job.

The controller stays small.

The repository stays independent from external services.

The service becomes the place that coordinates everything.

I think this is much easier to extend later if I replace BlackAI or add another provider.
