# Subscription API

## Base Route

```http
/api/v1/subscription
```

## Supported Roles

The authenticated subscription endpoints support both:

- `USER`
- `SELLER`

The same controller and service flow handle both roles.

## Authentication

### Protected Endpoints

These endpoints require authentication through `JWTVerify`:

- `POST /create`
- `POST /verify`
- `GET /current`

### Webhook Endpoint

`POST /webhook` is not authenticated with JWT.

It is verified using the Razorpay webhook signature instead.

## Collections Used

The feature writes to two different collections:

### Subscription

Stores the active state only.

Main fields include:

- `currentPlan`
- `credits`
- `activatedAt`
- `expiresAt`
- `userId` or `sellerId`
- `subscriberType`

### SubscriptionOrder

Stores payment history.

Main fields include:

- `plan`
- `credits`
- `paymentService`
- `paymentOrderId`
- `paymentId`
- `paymentSignature`
- `amount`
- `amountPaid`
- `paymentStatus`
- `userId` or `sellerId`
- `subscriberType`

## Endpoint: Create Subscription Order

```http
POST /api/v1/subscription/create
```

### Purpose

Creates a new purchase order for a paid subscription plan and stores a matching `SubscriptionOrder` history record.

### Authentication

Required.

The authenticated user's id and role are taken from:

- `req.user._id`
- `req.auth.role`

### Request Body

```json
{
  "plan": "PRO"
}
```

### Required Fields

| Field | Required | Notes |
| --- | :---: | --- |
| `plan` | Yes | Must be a supported plan for the authenticated role |

### Validation

- `plan` must be a string
- `plan` is trimmed
- empty strings are rejected
- plan lookup is role-aware through `getPlanConfig({ role, plan })`
- invalid role/plan combinations are rejected
- `FREE` purchases are explicitly rejected

### Business Rules

- `FREE` plans cannot be purchased through Razorpay
- plan pricing, credits, and currency come from centralized plan configuration
- the order is stored in `SubscriptionOrder`, not `Subscription`
- both `Users` and `Sellers` use the same flow

### Processing Flow

```text
Authenticate request
    |
    v
Read role and subscriber id
    |
    v
Resolve plan config
    |
    v
Reject FREE plan
    |
    v
Create Razorpay order
    |
    v
Resolve subscriber object
    |
    v
Build SubscriptionOrder data
    |
    v
Persist SubscriptionOrder
    |
    v
Return order + Razorpay order
```

### Success Response

Status: `201 Created`

```json
{
  "statusCode": 201,
  "data": {
    "order": {
      "_id": "...",
      "userId": "...",
      "subscriberType": "USER",
      "plan": "PRO",
      "credits": 500,
      "paymentService": "Razorpay",
      "paymentOrderId": "order_...",
      "amount": 19900,
      "amountPaid": 0,
      "paymentStatus": "created",
      "createdAt": "...",
      "updatedAt": "..."
    },
    "razorpayOrder": {
      "id": "order_...",
      "amount": 19900,
      "currency": "INR",
      "status": "created"
    }
  },
  "message": "Subscription order created",
  "success": true
}
```

The exact Razorpay fields depend on Razorpay's response.

### Error Responses

#### 400 Bad Request

Examples:

- invalid plan
- unsupported role
- empty `plan`
- `FREE` plan purchase attempt

#### 401 Unauthorized

Returned when authentication fails.

#### 500 Internal Server Error

Returned when order creation fails unexpectedly.

## Endpoint: Verify Frontend Payment

```http
POST /api/v1/subscription/verify
```

### Purpose

Verifies the payment signature sent by the frontend and stores payment proof on the matching `SubscriptionOrder`.

This step does **not** activate the subscription yet.

Activation happens later through the webhook.

### Authentication

Required.

### Request Body

```json
{
  "razorpay_order_id": "order_...",
  "razorpay_payment_id": "pay_...",
  "razorpay_signature": "..."
}
```

### Required Fields

| Field | Required |
| --- | :---: |
| `razorpay_order_id` | Yes |
| `razorpay_payment_id` | Yes |
| `razorpay_signature` | Yes |

### Validation

- payment signature must match Razorpay's expected signature
- a matching `SubscriptionOrder` must exist for `razorpay_order_id`

### Business Rules

- frontend verification only stores payment proof
- subscription activation is deferred to the webhook
- payment data is written into `SubscriptionOrder`

### Processing Flow

```text
Authenticate request
    |
    v
Verify Razorpay payment signature
    |
    v
Find SubscriptionOrder by paymentOrderId
    |
    v
Store paymentId and paymentSignature
    |
    v
Save order
    |
    v
Return verified response
```

### Success Response

Status: `200 OK`

```json
{
  "statusCode": 200,
  "data": {},
  "message": "Payment verified",
  "success": true
}
```

The service itself currently returns:

```json
{
  "verified": true,
  "awaitingWebhook": true
}
```

but the controller responds with an empty `data` object and the success message above.

### Error Responses

#### 400 Bad Request

Examples:

- invalid Razorpay signature

#### 401 Unauthorized

Returned when authentication fails.

#### 404 Not Found

Examples:

- matching order not found

#### 500 Internal Server Error

Returned when saving verification data fails unexpectedly.

## Endpoint: Verify Webhook

```http
POST /api/v1/subscription/webhook
```

### Purpose

Processes Razorpay webhook events and activates the current subscription when a payment is successfully captured.

### Authentication

No JWT authentication.

Webhook authenticity is verified using the `x-razorpay-signature` header and the raw request body.

### Request Type

```text
application/json
```

The route is intentionally mounted before `express.json()` and uses `express.raw()` so the webhook signature can be validated against the original raw body.

### Required Header

| Header | Required |
| --- | :---: |
| `x-razorpay-signature` | Yes |

### Relevant Payload Requirement

The current implementation processes only:

```text
event = payment.captured
```

Other webhook events are ignored after signature verification.

### Validation

- webhook signature must be valid
- webhook body must be parseable JSON
- a matching `SubscriptionOrder` should exist for the Razorpay order id

### Business Rules

- only `payment.captured` activates the subscription
- if the order does not exist, the webhook exits safely
- if the order is already marked `success`, the webhook exits safely
- `SubscriptionOrder` is marked `success`
- `Subscription` is activated or updated from the order
- credits are reset from the plan config
- paid plans get `expiresAt`
- free plans keep `expiresAt = null`

### Processing Flow

```text
Receive raw webhook body
    |
    v
Verify webhook signature
    |
    v
Parse payload
    |
    v
Ignore non-payment.captured events
    |
    v
Find SubscriptionOrder by payment order id
    |
    v
Ignore missing or already-successful orders
    |
    v
Mark order status as success
    |
    v
Build active Subscription from plan config
    |
    v
Upsert active Subscription
    |
    v
Return success response
```

### Success Response

Status: `200 OK`

```json
{
  "success": true
}
```

### Error Responses

#### 400 Bad Request

Examples:

- invalid webhook signature

#### 500 Internal Server Error

Returned when webhook processing fails unexpectedly.

## Endpoint: Get Current Plan

```http
GET /api/v1/subscription/current
```

### Purpose

Returns the current active subscription for the authenticated user or seller.

### Authentication

Required.

### Request Body

None.

### Validation

- `req.user._id` must exist
- `req.user._id` must be a valid MongoDB ObjectId
- the role is resolved through `req.auth.role`

### Business Rules

- the endpoint reads from `Subscription`, not `SubscriptionOrder`
- it represents only the active state
- it works for both `Users` and `Sellers`

### Processing Flow

```text
Authenticate request
    |
    v
Validate subscriber id
    |
    v
Resolve subscriber object from role
    |
    v
Find active Subscription
    |
    v
Return current plan data
```

### Success Response

Status: `200 OK`

```json
{
  "statusCode": 200,
  "data": {
    "_id": "...",
    "userId": "...",
    "subscriberType": "USER",
    "currentPlan": "FREE",
    "credits": 100,
    "activatedAt": "...",
    "expiresAt": null,
    "createdAt": "...",
    "updatedAt": "..."
  },
  "message": "Current plan fetched successfully",
  "success": true
}
```

For sellers, the same structure is returned but uses `sellerId` instead of `userId`.

### Error Responses

#### 400 Bad Request

Examples:

- invalid subscriber id

#### 401 Unauthorized

Returned when authentication fails.

#### 500 Internal Server Error

Returned when fetching the active subscription fails unexpectedly.

## Internal Flow: Free Subscription Initialization

The service also includes an internal method:

```js
initializeSubscription({ subscriberId, role })
```

This is not exposed as an HTTP endpoint in the current implementation.

Its purpose is to create a `FREE` active subscription directly inside `Subscription`.

This keeps free onboarding separate from the paid purchase flow.

## Summary

The implemented API has four active HTTP flows:

- create a paid subscription order
- verify the frontend payment signature
- process Razorpay webhook activation
- fetch the current active subscription

Under the hood:

- `SubscriptionOrder` stores payment history
- `Subscription` stores only the active state

That separation is the key business rule behind the current design.
