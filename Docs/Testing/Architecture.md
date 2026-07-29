# Testing Architecture

## Overview

The testing strategy for this project follows the same layered architecture as the application.

Instead of testing the entire application at once, each layer is tested according to its own responsibility.

```
HTTP Request

↓

Controller

↓

Service

↓

Repository

↓

MongoDB
```

Each layer has one responsibility, making the code easier to understand, maintain and test.

---

# Separation of Responsibilities

The backend follows a layered architecture.

```
Controller

↓

Service

↓

Repository
```

Each layer changes for a different reason.

| Layer | Responsibility |
|--------|----------------|
| Controller | Handle HTTP requests and responses |
| Service | Business logic and orchestration |
| Repository | Database interaction |

Following this separation keeps business logic independent of Express and MongoDB, allowing every layer to be tested independently.

---

# Controller

## Responsibilities

- Read HTTP requests
- Validate request format (basic parsing)
- Call the appropriate service
- Return HTTP responses

Controllers should remain thin.

They should **not** contain business logic.

Example

```
Request

↓

Controller

↓

Service

↓

HTTP Response
```

### Unit Testing Controllers

Controller tests verify only controller responsibilities.

Examples

- Service was called
- Correct status code returned
- Correct JSON response returned

Controllers should not be responsible for validation rules, database operations or business decisions.

---

# Service

## Responsibilities

Services contain the application's business logic.

Responsibilities include

- Business validation
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

### Unit Testing Services

Service tests verify every business path.

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
- Transaction failure

The goal is to verify that the service behaves correctly under every expected condition.

---

# Repository

## Responsibilities

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

Repository tests verify database behaviour rather than business logic.

---

# Why Separate Responsibilities?

Initially it may seem easier to place all logic inside controllers.

Example

```
Controller

↓

Validation

↓

Transactions

↓

MongoDB

↓

Cloudinary

↓

Response
```

As the application grows this becomes difficult to

- Test
- Maintain
- Reuse
- Extend

Instead, responsibilities are separated.

```
Controller

↓

Service

↓

Repository
```

Benefits

- Smaller files
- Easier testing
- Easier debugging
- Better code reuse
- Lower coupling
- Higher maintainability

---

# Service Reusability

One of the biggest advantages of separating business logic into services is reusability.

Business logic should not depend on Express.

The same service can be called from multiple entry points.

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

Instead of duplicating business logic, every entry point shares the same implementation.

---

# Unit Testing

Unit testing verifies one responsibility at a time.

Question

```
Is this unit doing its own job correctly?
```

Examples

Controller

- Calls the correct service
- Returns correct HTTP response

Service

- Business logic
- Validation
- Transactions
- Safe return objects

Repository

- Queries database correctly
- Saves correct data
- Updates correct documents

Utilities

- Produce correct output

Each unit is tested independently.

---

# Integration Testing

Integration testing verifies an entire feature.

Question

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

Integration tests verify

- Status Code
- JSON Response
- Authentication
- Middleware
- Database Changes
- Overall feature behaviour

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

The same functionality may be tested twice.

Example

Service

```
Business Logic
```

Endpoint

```
Entire Feature
```

This is intentional because both tests answer different questions.

---

# External Services During Testing

Tests should never affect production resources.

Testing strategy

MongoDB

```
Test Database
```

Cloudinary

```
Separate Test Account
```

Razorpay

```
Sandbox Environment
```

Gemini

```
Mock
```

BlackAI

```
Mock
```

This keeps tests deterministic and prevents accidental production changes.

---

# Environment Configuration

The application chooses its resources depending on

```
NODE_ENV
```

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
            ? {
                ...
            }
            : {
                ...
            },

    RAZORPAY:
        environment === "production"
            ? {
                ...
            }
            : {
                ...
            }
};
```

This ensures tests never

- Modify production data
- Upload production files
- Trigger real payments

---

# Testing Folder Structure

```
tests
│
├── endpoints
│
└── unit
    ├── repositories
    └── services
```

Purpose

```
unit/

↓

Responsibility Tests

endpoints/

↓

Integration Tests
```

The structure follows the backend architecture, making it easier to locate tests as the project grows.

---

# Design Principles

The testing architecture follows these principles.

- Every layer has one responsibility.
- Business logic belongs inside services.
- Persistence belongs inside repositories.
- Controllers remain thin.
- Business logic should be reusable.
- Unit tests verify responsibilities.
- Integration tests verify complete features.
- Production resources should never be used during automated testing.

Following these principles results in a backend that is easier to test, maintain, extend and scale as new features such as workers, queues, caching and Socket.IO are introduced.