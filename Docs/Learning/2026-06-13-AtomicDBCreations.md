# 2026-07-13 — MongoDB Transactions & Automatic Subscription Initialization

## Session Goal

The goal of this session was to make registration atomic. Whenever a new User or Seller is registered, a FREE subscription should also be created automatically.

The requirement was simple:

> Either both the account and the subscription should exist, or neither of them should exist.

To achieve this, I learned how MongoDB transactions work using sessions.

---

# Core Learning

## Understanding MongoDB Sessions

The biggest thing I learned is that a **session does not save data**.

A session simply groups multiple database operations into a single transaction.

```
User Creation
        ↓
Subscription Creation
        ↓
Same Session
        ↓
One Transaction
```

Because both operations belong to the same transaction, MongoDB treats them as one unit of work.

---

## Transaction Lifecycle

A transaction has three important stages.

```
startTransaction()
        ↓
Database Operations
        ↓
commitTransaction()
```

If everything succeeds, `commitTransaction()` permanently stores all the changes.

If any operation fails,

```
startTransaction()
        ↓
Database Operations
        ↓
Error
        ↓
abortTransaction()
```

everything performed inside that transaction is rolled back, so no partial data remains in the database.

`endSession()` is only responsible for cleaning up the session after the work is finished. It does **not** commit or rollback anything.

---

## save({ session })

One thing that confused me initially was `save({ session })`.

The correct mental model is:

* `save()` performs the database write.
* `{ session }` tells MongoDB that this write belongs to the current transaction.

So every database operation that should be rolled back together must receive the same session.

If one operation forgets to use the session, it executes outside the transaction and breaks atomicity.

---

## Passing the Session Through Layers

The session starts in the controller because the controller coordinates the entire registration process.

The same session is then passed through:

```
Controller
    ↓
Service
    ↓
Repository
```

This keeps every database operation inside the same transaction.

To make repositories reusable, I made the session optional using:

```js
{ session } = {}
```

This allows the same repository methods to work both inside and outside a transaction.

---

## Creating One Document

For creating a single document, I preferred:

```js
const subscription = new Subscription(data);
await subscription.save({ session });
```

instead of using:

```js
Subscription.create([data], { session });
```

Both work, but `new Model() + save()` better communicates that only one document is being created.

Using the array version exposes the batch creation API even though only one document is needed.

---

## Seller Registration

Seller registration introduced another problem.

The avatar is uploaded to Cloudinary before the database transaction starts.

Cloudinary is an external service, so MongoDB transactions cannot roll back uploaded images.

This required two different error handling responsibilities:

### MongoDB Transaction

Responsible for:

* Creating Seller
* Creating Subscription

If either fails:

* Abort the transaction

### Cloudinary

Responsible for:

* Cleaning up uploaded images if the database transaction fails.

This taught me that transactions only protect database operations. External resources require their own cleanup logic.

---

# Architecture Decisions

* The controller owns the transaction because it coordinates multiple database operations.
* Services focus on business logic.
* Repositories only perform database operations.
* The same repository methods can be used with or without transactions.
* User/Seller creation and Subscription creation must always succeed or fail together.

---

# Mistakes I Made

* Initially thought a session was responsible for saving data.
* Initially thought `endSession()` committed the transaction.
* Forgot to pass the session through every layer.
* Forgot to use the received session inside repository methods.
* Learned that `save()` already throws on failure, so querying the database immediately afterwards is unnecessary.

---

# Takeaways

The biggest lesson from this session was understanding the difference between **database operations** and **transaction management**.

The database methods (`save()`, `create()`, etc.) perform the actual writes.

The session simply groups those writes into a transaction so MongoDB can either commit everything or roll everything back.

I also learned that transactions only solve database consistency. When external services like Cloudinary are involved, cleanup has to be handled separately.
