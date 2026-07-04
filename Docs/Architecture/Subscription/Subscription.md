# Subscription Architecture

## Goal

The Subscription feature supports both `Users` and `Sellers` while keeping the implementation:

- easy to reason about
- easy to extend
- easy to maintain

The most important architectural decision is that the feature uses two different collections with two different responsibilities.

## Core Data Model

### Subscription

`Subscription` stores only the current active state.

It answers questions like:

- Which plan is active right now?
- How many credits remain?
- When does the active plan expire?

It stores fields such as:

- `currentPlan`
- `credits`
- `activatedAt`
- `expiresAt`
- subscriber identity (`userId` or `sellerId`)

It does **not** store payment history.

### SubscriptionOrder

`SubscriptionOrder` stores purchase history.

It records the lifecycle of each payment attempt, including states such as:

- `created`
- `success`
- `failed`
- `refunded`

It stores fields such as:

- `plan`
- `credits`
- `paymentService`
- `paymentOrderId`
- `paymentId`
- `paymentSignature`
- `amount`
- `amountPaid`
- `paymentStatus`
- subscriber identity (`userId` or `sellerId`)

This means:

- `Subscription` = active truth
- `SubscriptionOrder` = payment history

## High-Level Flow

```text
Controller
    |
    v
SubscriptionService
    |
    |-- getPlanConfig()
    |-- resolveSubscriber()
    |-- buildSubscriptionOrder()
    |-- razorpayOrderToSubscriptionOrder()
    |-- buildSubscription()
    |
    |-- SubscriptionOrderRepository
    \-- SubscriptionRepository
```

## Layer Responsibilities

### Controller

The controller is thin.

It is responsible for:

- reading request data
- passing role and subscriber identity to the service
- returning the final API response

It does not build domain objects and does not contain payment logic.

### Service

`SubscriptionService` is the center of the feature.

It is responsible for:

- validating plan selection through plan configuration
- blocking invalid purchase attempts such as `FREE`
- creating Razorpay orders
- building order objects
- initializing free subscriptions
- verifying frontend payment signatures
- verifying webhook signatures
- activating the current subscription
- fetching the current active plan

This is where business logic lives.

### Repositories

Repositories are simple database wrappers.

They receive prepared objects and persist them.

#### SubscriptionRepository

Main responsibilities:

- create a subscription document
- activate or upsert the current active subscription
- fetch the active subscription by subscriber

Contract examples:

```js
create({
  subscriber,
  subscription
})
```

```js
activate({
  subscriber,
  subscription
})
```

#### SubscriptionOrderRepository

Main responsibilities:

- create an order history document
- find an order by payment order id
- update payment status

Contract example:

```js
create({
  subscriber,
  subscription,
  order
})
```

The repositories do not decide which fields belong in those objects.

That work happens before the repository is called.

## Builders

The service uses small builder methods to convert one source into another object.

### buildSubscription(planConfig)

Builds the active subscription state.

It:

- sets `currentPlan`
- resets credits based on the selected plan
- sets `activatedAt`
- sets `expiresAt` only for paid plans

Current rule:

- paid plans expire after `30 days`
- `FREE` plan keeps `expiresAt = null`

### buildSubscriptionOrder(planConfig)

Builds the business part of the order document from plan configuration.

It stores values such as:

- `plan`
- `credits`
- `amount`

### razorpayOrderToSubscriptionOrder(razorpayOrder)

Builds the payment-specific portion of the order document from Razorpay's response.

It maps values such as:

- `paymentOrderId`
- `paymentStatus`
- `amount`
- `amountPaid`
- `paymentService`

## Plan Configuration

Plan configuration is centralized inside:

`Backend/src/config/subscriptionPlans.js`

The configuration contains role-specific plans:

- `USER`
- `SELLER`

The helper:

```js
getPlanConfig({ role, plan })
```

normalizes both values, validates them, and returns one consistent object:

```js
{
  name,
  amount,
  credits,
  currency
}
```

This becomes the single source of truth for:

- subscription builders
- order builders
- Razorpay order creation
- plan validation

## Subscriber Resolution

Subscriber mapping is centralized inside:

`resolveSubscriber({ role, subscriberId })`

It returns exactly one of:

```js
{ userId }
```

or:

```js
{ sellerId }
```

It also validates that the incoming role is supported.

This prevents repeated `if role === ...` mapping logic across the feature.

## Validation Rules

### String Normalization

String validation is reused through `stringValidator()`.

This helper:

- validates the data type
- trims whitespace
- rejects empty strings

It is used before role and plan normalization.

### Subscriber Validation

Both `Subscription` and `SubscriptionOrder` use schema-level subscriber validation.

Rules:

- exactly one of `userId` or `sellerId` must exist
- `subscriberType: USER` requires `userId`
- `subscriberType: SELLER` requires `sellerId`

This protects the collections from mixed subscriber state.

## Request Flow

### Create Subscription Order

```text
Client
    |
    v
Controller
    |
    v
SubscriptionService.createSubscriptionOrder()
    |
    |-- getPlanConfig()
    |-- reject FREE purchases
    |-- create Razorpay order
    |-- resolveSubscriber()
    |-- buildSubscriptionOrder()
    |-- razorpayOrderToSubscriptionOrder()
    |-- SubscriptionOrderRepository.create()
    v
Response
```

## Frontend Payment Verification Flow

```text
Client
    |
    v
Controller
    |
    v
SubscriptionService.verifyFrontendPayment()
    |
    |-- verify Razorpay payment signature
    |-- find SubscriptionOrder by paymentOrderId
    |-- store paymentId
    |-- store paymentSignature
    |-- save order
    v
Response
```

This step confirms the frontend signature, but it does not activate the subscription yet.

Activation happens during webhook processing.

## Webhook Flow

```text
Razorpay Webhook
    |
    v
Controller
    |
    v
SubscriptionService.verifyWebhook()
    |
    |-- verify webhook signature
    |-- parse raw webhook payload
    |-- ignore unsupported events
    |-- find SubscriptionOrder by paymentOrderId
    |-- ignore missing/already-successful orders
    |-- mark order as success
    |-- activateSubscription(order)
    |     |
    |     |-- resolveSubscriber()
    |     |-- getPlanConfig()
    |     |-- buildSubscription()
    |     \-- SubscriptionRepository.activate()
    v
Response
```

## Free Subscription Initialization

There is also an internal service flow:

```js
initializeSubscription({ subscriberId, role })
```

This is used to create a `FREE` active subscription without going through Razorpay.

That allows the system to assign a free starting plan while still rejecting `FREE` purchase attempts through the payment endpoint.

## Why This Design Is Better

This design improves the feature in several ways:

- Active subscription state is separated from payment history.
- Repositories no longer contain business logic.
- Services build domain objects before persistence.
- Builders reduce duplicated object construction.
- Plan configuration stays centralized.
- Subscriber mapping is handled in one place.
- Webhook activation updates the active state from a successful order instead of mixing both concerns together.

## Summary

The feature is now organized around clear boundaries:

- controllers handle requests
- services handle business flow
- repositories persist prepared objects
- builders construct domain objects
- plan configuration defines pricing and credits
- subscriber resolution maps role to the correct identity field

That separation is what makes the current Subscription feature easier to maintain than the earlier design.
