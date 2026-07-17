# 2026-07-16 - VirtualTryOnImplementationAlignment

# Split Image Validation From Upload

## Problem

Earlier, image resolution was doing too much at once.

The same flow was:

- checking whether a slot had a valid source
- deciding whether that source was a file or existing document
- uploading immediately when the source was a file

That meant compute and Cloudinary work could start before the full request was validated and before credits were safely deducted.

## Solution

The flow is now split into two steps:

```text
prepareImageSource()
    ↓
resolveImageSource()
```

Before:

```text
check source
    +
upload/resolve source
```

After:

```text
check source first
    ↓
charge credits
    ↓
upload/resolve later
```

`prepareImageSource()` now owns source validation.

`resolveImageSource()` now owns actual upload or document resolution.

## Learning

Validation and compute should not happen in the same step.

By separating them, I can finish request validation and credit deduction first, then spend Cloudinary compute only when the request is already eligible to continue.

---

# Credits Are Now Part of the Workflow

## Problem

Virtual Try-On had become a paid operational flow, but the credit behavior was not isolated clearly enough.

The important risk was:

- compute starts
- downstream failure happens
- credits remain deducted incorrectly

## Solution

The flow now explicitly includes:

```text
Determine Feature
    ↓
Charge Credits
    ↓
Continue Workflow
    ↓
Refund On Failure
```

Both charge and refund now live in the subscription service, with repository support underneath.

## Learning

Credits are not just subscription metadata anymore.

They are now runtime workflow state, so charging and refunding need to be treated like part of the request pipeline.

---

# Atomic Credit Deduction And Refund

## Problem

If credit updates are not atomic, balance correctness becomes fragile under concurrent requests.

The main danger is:

- two requests read the same balance
- both think enough credits exist
- balance becomes invalid

## Solution

Credit deduction and addition now run through dedicated subscription service and repository methods.

The repository performs atomic balance updates.

Deduction now uses a guarded update:

```text
credits >= cost
    ↓
decrement credits
```

That means credits are only deducted when enough balance already exists.

Refunds also go through the same subscription boundary instead of being handled ad hoc in feature code.

## Learning

Balance-changing operations should live behind one service boundary and one repository boundary.

That keeps credit accounting consistent and reusable across future flows.

---

# Seller Pricing Became Dynamic

## Problem

Seller Virtual Try-On does not always have the same cost.

One product and multi-product generation are different workloads, but that pricing logic should not be scattered across services.

## Solution

Seller feature selection is now dynamic:

```text
1 product
    ↓
VIRTUAL_TRY_ON
    ↓
20 credits

more than 1 product
    ↓
PRODUCT_TRY_ON
    ↓
60 credits
```

Users always spend:

```text
VIRTUAL_TRY_ON
    ↓
40 credits
```

## Learning

Pricing rules should be derived from request shape, not hardcoded inline in business flows.

That makes pricing behavior easier to extend without rewriting service logic.

---

# Feature Pricing Was Centralized

## Problem

If feature costs are referenced directly in multiple places, every pricing change becomes risky and repetitive.

## Solution

A separate `featurePricing` config now owns feature metadata and costs.

Before:

```text
pricing logic spread across flow code
```

After:

```text
pricing config
    ↓
feature lookup
    ↓
workflow uses selected config
```

This means future credit changes can happen in one place instead of being updated across services manually.

## Learning

Anything likely to change often, like pricing, should move into configuration before it spreads through business logic.

---

# Services No Longer Depend On req

## Problem

Passing request objects into services couples business logic to HTTP delivery.

That makes services harder to reuse from:

- queues
- workers
- sockets
- background jobs

## Solution

The service contract now takes explicit input data instead of depending on `req`.

Before:

```text
HTTP request object
    ↓
service logic
```

After:

```text
plain data
    ↓
service logic
```

The controller now extracts what is needed and passes structured values into the service.

## Learning

Services should depend on business inputs, not transport-layer objects.

That keeps them reusable when the same workflow later runs outside Express.

---

# BlackAI URL Validation Was Added

## Problem

BlackAI was sometimes returning an inconsistent or invalid result URL.

Without validation, the system would continue as if the provider response were trustworthy.

That could waste downstream work and leave the credit state wrong unless the failure was handled properly.

## Solution

The BlackAI layer now validates the returned value as a URL before passing it back to the service.

Flow:

```text
BlackAI response text
    ↓
validate as URL
    ↓
return valid URL
    or
throw error
```

When the URL is invalid:

- the request fails immediately
- refund logic runs if credits were already deducted

## Learning

Provider responses should be validated at the integration boundary, not trusted by default.

That keeps bad external data from leaking into the rest of the workflow.

---

# Cleanup Was Split By Resource Type

## Problem

Temporary local files and temporary Cloudinary uploads are different kinds of resources.

Treating them as one cleanup responsibility makes lifecycle handling harder to reason about.

## Solution

Cleanup is now separated into:

- `cleanupFiles()`
- `cleanupImages()`

Before:

```text
temporary resources
    ↓
mixed cleanup logic
```

After:

```text
temporary local files
    ↓
cleanupFiles()

temporary Cloudinary uploads
    ↓
cleanupImages()
```

## Learning

Cleanup becomes easier to reuse and safer to extend when each cleanup path owns one resource type only.

---

# What Actually Improved

## Problem

The old flow was doing more work before the request was fully safe to execute.

That increased the risk of:

- wasting Cloudinary compute
- charging credits too early without a clean rollback path
- coupling business logic to Express
- spreading pricing rules through workflow code
- trusting provider output too much

## Solution

The new flow is more deliberate:

```text
Validate Inputs
    ↓
Prepare Image Sources
    ↓
Determine Feature
    ↓
Charge Credits
    ↓
Resolve / Upload Images
    ↓
Call BlackAI
    ↓
Validate Returned URL
    ↓
Persist
    ↓
Cleanup
```

If failure happens after charging:

```text
catch
    ↓
refund
    ↓
preserve original error
```

## Learning

The core improvement is not just “new helper functions”.

The real improvement is that the Virtual Try-On flow now spends compute later, validates external output earlier, keeps credit accounting safer, and makes the service layer reusable outside HTTP.
