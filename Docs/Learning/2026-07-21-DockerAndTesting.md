# 2026-07-21-DockerAndTesting.md

# Docker & Testing Learning

## Why I learned Docker

Initially I thought Docker was only used for deployment.

After learning, I understood that Docker is much more than deployment.

Docker packages the application along with everything it needs:

- Operating System
- Node.js
- npm
- Dependencies
- My Backend Source Code

Because of this, the application behaves the same on every machine.

Instead of saying:

"It works on my machine."

Docker guarantees:

"It works the same everywhere."

---

# Dockerfile

The Dockerfile is simply the recipe to build the image.

My Dockerfile:

```dockerfile
FROM node:22

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm","start"]
```

Understanding each line:

### FROM node:22

Downloads the official Node.js image.

This already contains:

- Linux
- Node.js
- npm

---

### WORKDIR /app

Creates the working directory inside the container.

Every command after this executes inside:

```
/app
```

---

### COPY package*.json ./

Copies only package.json and package-lock.json.

This allows Docker to cache dependency installation.

If only my source code changes,
Docker does not reinstall all dependencies.

---

### RUN npm ci

Installs dependencies from package-lock.json.

Unlike npm install,
npm ci guarantees reproducible dependency installation.

---

### COPY . .

Copies the remaining backend project into the container.

---

### EXPOSE 3000

This does NOT open the port.

It only documents that my application listens on port 3000.

---

### CMD ["npm","start"]

Runs

```
npm start
```

which executes

```
node src/index.js
```

---

# Docker Image vs Container

Image

↓

Blueprint

↓

Read-only

Container

↓

Running instance of an image

↓

Can be started, stopped and deleted.

---

# Docker Commands I Learned

Build image

```bash
docker build -t wearsuggest-backend .
```

List images

```bash
docker images
```

Run container

```bash
docker run wearsuggest-backend
```

Run with port forwarding

```bash
docker run -p 3000:3000 wearsuggest-backend
```

List running containers

```bash
docker ps
```

List all containers

```bash
docker ps -a
```

Stop container

```bash
docker stop <container-id>
```

Delete container

```bash
docker rm <container-id>
```

Delete image

```bash
docker rmi <image-id>
```

---

# Port Forwarding

This confused me initially.

My Express app listens on

```
PORT=3000
```

inside the container.

The host machine cannot access it unless Docker forwards the port.

Example

```
docker run -p 3000:3000
```

Meaning

```
Host Port 3000

↓

Container Port 3000
```

If I use

```
docker run -p 8000:3000
```

then

```
localhost:8000

↓

Container:3000
```

The application still listens on 3000.

Only the host port changes.

---

# .env inside Docker

Locally

```
dotenv.config()

↓

Reads .env
```

Inside Docker

If the .env file is copied or passed,

```
dotenv.config()

↓

Reads .env
```

Production (Render)

No .env file exists.

Render injects environment variables directly into

```
process.env
```

Therefore

```
process.env.PORT || 3000
```

is the correct approach.

---

# .dockerignore

Just like .gitignore.

Files inside it are not copied into the Docker image.

Examples

```
node_modules
.git
Docs
README.md
```

This keeps the image smaller.

---

# Docker and Deployment

For my current stack

Backend

```
Render
```

Frontend

```
Netlify
```

Database

```
MongoDB Atlas
```

Docker is optional for deployment because Render already knows how to run Node.js applications.

However Docker is still extremely useful for

- Local development
- Testing
- CI/CD
- Future Kubernetes deployments

---

# Why Testing Matters

Before this I was manually testing everything using Postman.

Problem:

Every change required manually checking all endpoints.

As the backend grows this becomes impossible.

Testing allows me to automatically verify that old functionality still works.

---

# Testing Strategy I Will Follow

## Testing Framework

I decided to use

```
Vitest
```

Reason:

- Modern
- Fast
- Jest-compatible API
- Good for new Node.js projects

---

## HTTP Testing

I will use

```
Supertest
```

Instead of Postman.

Supertest can call my Express routes directly.

Example

```
POST /registerSeller

↓

Controller

↓

Service

↓

Repository

↓

MongoDB
```

This tests the complete request flow.

---

## Test Cases

For every endpoint I should think about

### Happy Path

Everything succeeds.

Example

```
Register Seller

↓

201 Created
```

---

### Bad Paths

Examples

- Missing email
- Invalid password
- Duplicate email
- Unauthorized
- Invalid ObjectId
- Missing image
- Transaction rollback
- Cloudinary failure

Every important scenario should have a test.

---

# Test Database

I do NOT want tests touching my real database.

Plan:

Use Docker to start a temporary MongoDB container.

Workflow

```
Start MongoDB

↓

Run Tests

↓

Drop Database

↓

Stop MongoDB
```

Every test run starts with a clean database.

---

# External Services

Real external APIs should not affect tests.

Plan

Cloudinary

↓

Separate Test Account

Gemini

↓

Mock

BlackAI

↓

Mock

Razorpay

↓

Test Mode / Mock

---

# CI/CD Pipeline

Current workflow

```
Feature Branch

↓

Push

↓

Pull Request

↓

Merge

↓

Render Deploy
```

Missing piece

```
Automatic Testing
```

Target workflow

```
Feature Branch

↓

Push

↓

GitHub Actions

↓

Install Dependencies

↓

Start Test MongoDB

↓

Run Vitest

↓

Run Supertest

↓

Build Project

↓

Pass

↓

Merge PR

↓

Render Deploy
```

If tests fail

```
Deployment should never happen.
```

---

# Tools I Learned

Docker

- Images
- Containers
- Dockerfile
- .dockerignore
- Port Forwarding
- Basic Docker Commands

---

# Tools I Will Learn Next

- Vitest
- Supertest
- Docker Compose
- GitHub Actions
- ESLint & Prettier checks
- Test Coverage

---

# Final Goal

A professional backend workflow:

```
Code

↓

Push

↓

GitHub Actions

↓

Docker MongoDB

↓

Vitest

↓

Supertest

↓

Build

↓

Merge

↓

Render Deploy
```

This ensures every deployment is tested, repeatable and reliable.