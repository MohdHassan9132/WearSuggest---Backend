# 2026-07-31 - Layered Testing & Repository Design

## Layer Responsibilities

* A repository is responsible only for persisting and retrieving data.
* A service is responsible for business logic, validation, and coordinating collaborators.
* Repository methods should not contain business decisions such as throwing domain-specific errors when data is not found. Returning `null` allows the service layer to decide how to handle the situation.

---

## Unit Testing Principles

* A unit test should mock a unit's collaborators, not the unit itself.
* Helper methods that contain business logic are worth testing independently, even if they are private to the service.
* Tests should verify behavior rather than reproduce the implementation.

---

## Fixture Design

* Fixtures should represent data, not business logic.
* Factory fixtures are preferable to shared constant objects because they provide fresh data for each test.
* When fixtures represent the same entity, they should share identifiers instead of generating independent ones.

Example:

* `resolvedUser` and `userSubscription` should receive the same `userId`.
* The `ObjectId` should be created once and injected into both fixtures.

---

## Keeping Fixtures Independent

* Fixtures should avoid conditional logic that mirrors production code.
* Instead of making fixtures decide how a subscription should look based on a plan, create simple data builders and override only the fields needed by a test.
* This keeps fixtures reusable and prevents duplicating application logic inside tests.

---

## Integration Testing

* Repository integration tests should exercise the real database interaction.
* Utility functions such as `resolveSubscriber` belong to the service layer and are not part of repository tests.
* Repository integration tests should avoid mocking application code and instead prepare the required input directly.

---

## MongoDB Testing

* `mongodb-memory-server` provides an isolated MongoDB instance for integration tests.
* Integration tests should clean the database before each test to ensure isolation.
* Mongoose `ObjectId` fields should always receive valid `ObjectId` values in fixtures instead of arbitrary strings.

---

## Test Structure

* Following the Arrange → Act → Assert pattern makes tests easier to read and maintain.
* Create shared values once during the Arrange phase and reuse them throughout the test instead of recreating fixtures multiple times.

---

## Fixture Composition

* Different concepts should be modeled independently.
* Subscriber type and subscription plan are separate concerns.
* Composing simple fixtures is more scalable than creating many specialized fixtures for every possible combination.

---

## General Takeaways

* Tests become easier to understand when each layer is tested in isolation.
* Sharing common identifiers between related fixtures produces more realistic and reliable tests.
* Keeping fixtures focused on data and keeping business logic inside the application reduces coupling between tests and implementation.
* Designing tests around responsibilities rather than implementation details leads to simpler and more maintainable test suites.
