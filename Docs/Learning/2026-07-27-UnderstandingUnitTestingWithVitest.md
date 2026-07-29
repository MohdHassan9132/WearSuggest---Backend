# 2026-07-27 - Understanding Unit Testing with Vitest

## What I Thought Before

When I first looked at Vitest, it felt like I was memorizing functions.

- `vi.mock()`
- `vi.fn()`
- `mockReturnValue()`
- `mockResolvedValue()`
- `expect()`

I could copy examples, but I didn't understand what Vitest was actually doing when a test ran.

Today my understanding changed.

## The Purpose of a Unit Test

A unit test asks one simple question.

> Is this unit behaving according to its responsibility?

For a service this means:

- Is it calling the correct dependencies?
- Is it passing the correct data?
- Is it handling success correctly?
- Is it handling failures correctly?

A unit test does not verify MongoDB, Razorpay or Express.

Those belong to other tests.

## How Vitest Actually Works

The biggest realization today was that Vitest executes my real service.

Only the dependencies are replaced.

**Production**

```
SubscriptionService
  ↓
resolveSubscriber()
  ↓
subscriptionRepository.get()
  ↓
MongoDB
```

**During unit testing**

```
SubscriptionService (Real)
  ↓
resolveSubscriber() (Mock)
  ↓
subscriptionRepository.get() (Mock)
```

The service is still my actual implementation.

Only the outside world is replaced.

## Arrange, Act, Assert

Every unit test follows the same structure.

### Arrange

Create the world for the service.

This includes:

- Input values
- Mock return values
- Mock failures

Example:

```js
resolveSubscriber.mockReturnValue(subscriber);

subscriptionRepository.get.mockResolvedValue(subscription);
```

Here I decide how the dependencies behave.

### Act

Run the real code.

```js
const result = await subscriptionService.getCurrentPlan({
    role: "USER",
    subscriberId: "user123"
});
```

Nothing inside the service is mocked.

Vitest executes my real implementation.

### Assert

Verify what happened.

Did the service call the dependency correctly?

```js
expect(resolveSubscriber).toHaveBeenCalledWith({
    role: "USER",
    subscriberId: "user123"
});
```

Did it pass the correct object?

```js
expect(subscriptionRepository.get)
    .toHaveBeenCalledWith(subscriber);
```

Did it return the correct value?

```js
expect(result).toEqual(subscription);
```

## The Difference Between Inputs and Outputs

One concept confused me for a while.

I thought the object used in

```js
mockResolvedValue(...)
```

should match the object used in

```js
toHaveBeenCalledWith(...)
```

Now I understand these are checking completely different things.

```
Service
  ↓
Calls Repository
```

**Input** — `toHaveBeenCalledWith(...)` checks:
> What did my service send to the dependency?

**Output** — `mockResolvedValue(...)` controls:
> What did the dependency return back to my service?

These do not need to be the same object.

## Understanding Mock Functions

Initially I thought `vi.fn()` was something special.

Now I understand it simply creates a fake function.

That fake function records:

- How many times it was called
- What arguments it received
- What it returned

Vitest uses this information for assertions like:

```js
expect(fn).toHaveBeenCalled();

expect(fn).toHaveBeenCalledTimes(1);

expect(fn).toHaveBeenCalledWith(...);
```

## mockReturnValue vs mockResolvedValue

Today I finally understood when to use each.

**Synchronous function**

```js
config.get.mockReturnValue(value);
```

**Asynchronous function**

```js
repository.get.mockResolvedValue(value);
```

The choice depends on whether the real function returns a Promise.

## Matching the Real Function

Another important lesson was that assertions should match the actual function call.

If my service contains:

```js
repository.get(subscriber);
```

then my test should verify:

```js
expect(repository.get)
    .toHaveBeenCalledWith(subscriber);
```

If the service changes to:

```js
repository.get({
    subscriber,
    session
});
```

then the assertion should change too.

The expectation should always mirror the real function call.

## Thinking About Test Cases

I also learned that writing tests means thinking about every possible path.

For example:

**Happy Path**
```
↓
Subscription returned
```

**Possible failure paths**

- Invalid subscriber type
- Repository failure
- Database unavailable
- Subscription not found

Each path becomes its own unit test.

## My Mental Model of Unit Testing

When I write a test I am doing four things.

```
Arrange
  ↓
Create inputs
  ↓
Decide what dependencies return
  ↓
Run the real service
  ↓
Verify its behaviour
```

Vitest simply executes my service using the world I created and compares what actually happened with what I expected.

If they match: ✅ Test passes

Otherwise: ❌ Test fails

## Biggest Realization Today

Before today I thought unit testing was mostly about learning Vitest functions.

Now I understand that the functions are only tools.

The real goal is to describe how a unit should behave.

A test is essentially an executable specification.

It says:

> "When these inputs and conditions exist, this unit should behave like this."

Vitest's job is simply to verify whether that specification matches reality.
