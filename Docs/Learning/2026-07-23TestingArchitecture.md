# 2026-07-23-TestingArchitecture.md

# Testing & Architecture Learning

Today I realized that testing is not just about writing test cases.

Testing starts with having a good architecture where every part of the application has a clear responsibility.

---

# Unit Testing

Initially I thought unit testing meant testing individual functions.

Now I understand that unit testing is actually about testing a single responsibility.

Question I should ask:

```
Is this unit doing its own job correctly?
```

Each layer has its own responsibility.

---

## Controller

Responsibilities

- Read HTTP request
- Call the appropriate service
- Return HTTP response

The controller should not contain business logic.

Example

```
Request

↓

Controller

↓

Service

↓

Response
```

A controller unit test only verifies things like

- Did it call the service?
- Did it return the correct status code?
- Did it return the expected response?

---

## Service

Services contain business logic.

Responsibilities

- Validation
- Business rules
- Transactions
- Calling repositories
- Calling external services
- Returning safe objects
- Throwing business errors

Example

```
Register User

↓

Validate Input

↓

Check Duplicate User

↓

Hash Password

↓

Create User

↓

Initialize Subscription

↓

Return Safe User
```

Service tests should verify every important path.

Happy path

```
Valid Registration

↓

User Created
```

Failure paths

- Duplicate email
- Invalid role
- Invalid input
- Repository failure
- Cloudinary failure
- Payment failure

The goal is to verify that the service behaves correctly under every condition.

---

## Repository

Repositories only communicate with the database.

Responsibilities

- Save documents
- Update documents
- Delete documents
- Execute queries

Repositories should not contain business rules.

Example

```
SubscriptionRepository

↓

MongoDB
```

---

# Why Separate Responsibilities?

Initially my register controller contained

- Validation
- Transactions
- MongoDB
- Subscription initialization
- Response formatting

This makes controllers difficult to test and difficult to reuse.

A better architecture is

```
Controller

↓

Service

↓

Repository
```

Each layer now has one responsibility.

This makes testing much easier.

---

# Why Services Are Important

The biggest realization today was that services are reusable.

Initially I thought services were only called by controllers.

Actually they can be used anywhere.

Example

HTTP Request

```
Controller

↓

SubscriptionService
```

Queue Worker

```
Worker

↓

SubscriptionService
```

Socket.IO

```
Socket Event

↓

SubscriptionService
```

Cron Job

```
Scheduled Task

↓

SubscriptionService
```

CLI Script

```
Node Script

↓

SubscriptionService
```

Because the business logic lives inside the service, I never have to duplicate it.

---

# Integration Testing

Unit tests verify one responsibility.

Integration tests verify an entire feature.

Question I should ask

```
Does this feature work from the client's perspective?
```

Example

```
POST /subscription/order

↓

Express

↓

Route

↓

Controller

↓

Service

↓

Repository

↓

MongoDB

↓

HTTP Response
```

Here I verify

- Status Code
- JSON Response
- Authentication
- Middleware
- Database Changes

Everything works together.

---

# Unit Tests vs Integration Tests

Unit Tests

```
Responsibility Testing
```

Integration Tests

```
Feature Testing
```

Both are important.

A service can be tested individually and later be tested again through an endpoint.

This is not duplicate testing because the purpose is different.

---

# External Services During Testing

Tests should never affect production services.

Plan

MongoDB

```
Test Database
```

Cloudinary

```
Separate Test Cloud
```

Razorpay

```
Sandbox Mode
```

Gemini

```
Mock
```

BlackAI

```
Mock
```

This allows testing without affecting production users or data.

---

# Environment Separation

Today I also improved my environment configuration.

Instead of always using production credentials,

the application selects resources depending on

```
NODE_ENV
```

Example

Development / Testing

```
MongoDB

↓

Test Database

Cloudinary

↓

Test Account

Razorpay

↓

Sandbox
```

Production

```
MongoDB

↓

Production Database

Cloudinary

↓

Production Account

Razorpay

↓

Live Keys
```

This prevents tests from

- Modifying production data
- Uploading production files
- Creating real payments

Example

```js
const environment = process.env.NODE_ENV;

export const env = {
    DB_URL:
        environment === "production"
            ? process.env.LIVE_DB_URL
            : process.env.TEST_DB_URL,

    CLOUDINARY:
        environment === "production"
            ? Live Cloudinary Config
            : Test Cloudinary Config,

    RAZORPAY:
        environment === "production"
            ? Live Razorpay Keys
            : Sandbox Razorpay Keys
};
```

---

# Testing Folder Structure

Current structure

```
tests
│
├── endpoints
│
└── unit
    ├── repositories
    └── services
```

Unit

```
Responsibility Tests
```

Endpoints

```
Integration Tests
```

---

# Learning Progression

Instead of trying to learn everything at once,

I decided to learn testing in stages.

Current focus

- Unit Testing
- Integration Testing
- Test Design
- Responsibility Based Architecture

Later

- Mocking
- Docker Test Environment
- GitHub Actions
- Docker Compose
- Coverage Reports
- Redis
- Queues
- Workers
- Socket.IO Testing

---

# Biggest Lesson Today

Good testing starts with good architecture.

When every layer has one responsibility,

- Code becomes easier to understand.
- Code becomes easier to test.
- Business logic becomes reusable.
- Future features like workers, queues and Socket.IO can reuse the same services instead of duplicating logic.

The goal is not simply to have tests.

The goal is to build an application where every responsibility is clearly separated, making the system easier to maintain, extend and verify.