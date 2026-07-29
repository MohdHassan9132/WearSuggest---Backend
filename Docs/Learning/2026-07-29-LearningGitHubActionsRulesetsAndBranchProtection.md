# 2026-07-29 - Understanding GitHub Actions & Branch Protection

# What I Thought Before

Initially I thought GitHub Actions was just a place to run commands like

```
npm test
```

and that Branch Rules were simply settings to prevent people from pushing to `main`.

Today I realized they work together to automate code verification and protect the main branch.

GitHub Actions is responsible for executing checks.

Rulesets are responsible for deciding whether code is allowed to reach a protected branch.

---

# Continuous Integration (CI)

The biggest concept I learned today is Continuous Integration.

Instead of developers manually verifying that everything still works before merging code, GitHub automatically verifies every change.

The workflow becomes

```
Developer

↓

Create Feature Branch

↓

Commit

↓

Push

↓

Open Pull Request

↓

GitHub Actions

↓

Run Tests

↓

Pass

↓

Merge Allowed
```

If the tests fail

```
Developer

↓

Push

↓

GitHub Actions

↓

Run Tests

↓

Fail

↓

Merge Blocked
```

The goal is not simply to run tests.

The goal is to ensure that broken code never reaches the main branch.

---

# The Relationship Between GitHub Actions and Rulesets

Initially I thought Rulesets themselves execute tests.

Now I understand they do not execute anything.

GitHub Actions executes workflows.

Rulesets simply wait for the workflow result.

```
GitHub Actions

↓

Run Workflow

↓

Success / Failure

↓

Ruleset

↓

Allow Merge
or
Block Merge
```

Without GitHub Actions there is no status to verify.

Without Rulesets GitHub Actions can fail but developers could still merge.

Both are needed.

---

# How GitHub Knows When To Run A Workflow

GitHub automatically looks inside

```
.github/
    workflows/
```

Every YAML file inside this folder is treated as a workflow.

Example

```
.github

└── workflows

      └── test.yml
```

Whenever one of the configured events occurs, GitHub reads this file and executes it.

---

# Understanding YAML

Before today YAML looked like another programming language.

Now I understand it is simply a configuration language.

It tells GitHub

* When to execute
* Where to execute
* What to execute

It does not contain business logic.

It simply describes a process.

---

# Workflow Structure

Every workflow follows the same high-level structure.

```
Workflow Name

↓

Trigger

↓

Jobs

↓

Steps
```

Each section has a different responsibility.

---

# Workflow Name

```
name: Backend CI
```

This is only a display name.

GitHub shows it inside the Actions page.

```
Actions

↓

Backend CI
```

Changing the name does not change how the workflow behaves.

It only changes what humans see.

---

# Trigger Section

```
on:
```

This section answers one question.

```
When should GitHub execute this workflow?
```

Without a trigger, the workflow will never run.

---

## Pull Request Trigger

```
pull_request:
    branches:
        - main
```

This means

Whenever a Pull Request targets

```
main
```

GitHub should execute the workflow.

Example

```
feature/login

↓

Pull Request

↓

main

↓

Run Workflow
```

If someone opens a Pull Request into another branch

```
feature/login

↓

develop
```

this workflow will not execute.

---

## Push Trigger

```
push:
    branches:
        - main
```

This executes after code actually reaches

```
main
```

Usually this happens after a Pull Request has been merged.

This gives one final verification that the latest version of the application still passes all tests.

---

# Jobs

A workflow contains one or more jobs.

Example

```
Workflow

├── Test

├── Build

└── Deploy
```

Each job is independent.

Every job runs on a fresh virtual machine.

In my current workflow I only have one job.

```
test
```

---

# Job Name

```
name: npm test
```

This is the display name shown in GitHub Actions.

```
Backend CI

↓

npm test
```

This is also the status check that my Ruleset will require before allowing a merge.

---

# The Runner

```
runs-on: ubuntu-latest
```

This was one of the biggest things I learned.

GitHub does not run my workflow on my computer.

Instead it creates a completely new virtual machine.

The process looks like

```
Fresh Ubuntu Machine

↓

Download Repository

↓

Install Node

↓

Install Dependencies

↓

Run Tests

↓

Delete Machine
```

Every workflow starts from a completely clean environment.

Nothing from previous executions remains except cached files.

This guarantees that the application can be built from scratch.

---

# Steps

A job is divided into steps.

```
Checkout Repository

↓

Setup Node

↓

Install Dependencies

↓

Run Tests
```

Each step executes after the previous one.

If one step fails

```
Step 1

↓

Step 2

↓

❌ Failed
```

GitHub immediately stops the remaining steps because the workflow has already failed.

---

# Checkout Repository

```
uses: actions/checkout@v4
```

Initially I wondered why GitHub needed this.

The virtual machine starts empty.

```
Ubuntu Machine

↓

(no project)
```

The checkout action downloads my repository.

After this step

```
Ubuntu Machine

↓

package.json

↓

src

↓

tests
```

Now GitHub actually has my project.

---

# Setting Up Node.js

```
uses: actions/setup-node@v4
```

The fresh machine does not automatically have the Node.js version my project needs.

This action installs Node.

```
Ubuntu Machine

↓

Install Node 22

↓

npm available
```

Without this step

```
npm
```

would not exist.

---

# Installing Dependencies

```
run: npm ci
```

Initially I wondered why tutorials always used

```
npm ci
```

instead of

```
npm install
```

Now I understand.

`npm ci` is designed specifically for Continuous Integration.

It

* Deletes existing node_modules
* Uses package-lock.json exactly
* Produces reproducible installations
* Is faster than npm install

Every workflow therefore installs exactly the same dependencies.

---

# Running Tests

```
run: npm test
```

This executes the

```
test
```

script inside

```
package.json
```

Example

```
scripts

↓

test

↓

vitest
```

or

```
scripts

↓

test

↓

jest
```

GitHub does not know or care which testing framework I use.

It simply executes

```
npm test
```

and waits for the result.

---

# Exit Codes

One important concept I learned is that GitHub does not understand tests.

It understands exit codes.

Successful commands return

```
Exit Code

↓

0
```

Failed commands return

```
Exit Code

↓

Non-zero
```

Example

```
npm test

↓

PASS

↓

Exit Code 0

↓

Workflow Success
```

If even one test fails

```
npm test

↓

FAIL

↓

Exit Code 1

↓

Workflow Failed
```

GitHub simply checks the exit code.

---

# Understanding Rulesets

Initially I thought Rulesets were responsible for testing.

Actually they only define repository policies.

Examples include

* Require Pull Requests
* Require Reviews
* Require Status Checks
* Block Force Pushes
* Restrict Branch Deletion

A Ruleset never executes code.

It only verifies whether repository requirements have been satisfied.

---

# Require Pull Request Before Merging

This rule prevents developers from directly modifying

```
main
```

Instead the workflow becomes

```
Feature Branch

↓

Pull Request

↓

Review

↓

Tests

↓

Merge
```

This ensures that every change is reviewed before becoming part of the main branch.

---

# Require Status Checks To Pass

This is the rule that connects GitHub Actions with Branch Protection.

Example

```
GitHub Actions

↓

npm test

↓

Success

↓

Status Check

↓

Ruleset

↓

Merge Allowed
```

If the workflow fails

```
GitHub Actions

↓

npm test

↓

Failure

↓

Ruleset

↓

Merge Blocked
```

The Ruleset is not executing the tests.

It is simply checking whether the required workflow finished successfully.

---

# Require Branches To Be Up To Date

Suppose

Developer A merges new code.

```
main

↓

New Commit
```

Meanwhile Developer B still has an older branch.

Without updating

Developer B's tests were executed against an outdated version of

```
main
```

This rule forces Developer B to update their branch first.

```
Latest Main

↓

Merge Main Into Feature Branch

↓

Run Tests Again

↓

Merge Allowed
```

This prevents integration problems caused by stale branches.

---

# Block Force Pushes

Normally

```
git push --force
```

can rewrite commit history.

On protected branches this is dangerous because history can disappear.

This rule prevents that.

---

# Restrict Deletions

This prevents accidental deletion of important branches like

```
main
```

---

# Complete Flow

Today my mental model became

```
Developer

↓

Feature Branch

↓

Commit

↓

Push

↓

Pull Request

↓

GitHub Reads test.yml

↓

Create Ubuntu Runner

↓

Checkout Repository

↓

Install Node

↓

Install Dependencies

↓

Run npm test

↓

Exit Code

↓

Status Check

↓

Ruleset Verification

↓

Pass

↓

Merge Allowed

or

↓

Fail

↓

Merge Blocked
```

---

# Biggest Lesson Today

Initially I saw GitHub Actions and Rulesets as two unrelated GitHub features.

Now I understand they work together.

GitHub Actions answers

> "Is the code healthy?"

Rulesets answer

> "Should this code be allowed into the protected branch?"

One verifies code quality.

The other enforces repository policy.

Together they create an automated gate that prevents unverified code from reaching the main branch.
