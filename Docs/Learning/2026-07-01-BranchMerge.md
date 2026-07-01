
# Session - July 1,2026

# Goal

The Virtual Try-On feature was complete, tested, and ready to be integrated into `main`.

My biggest concern was accidentally breaking the `main` branch or running into merge conflicts that I wasn't prepared to resolve. I wanted to understand the proper Git workflow instead of blindly clicking the merge button.

The goal of this session was to safely merge `try-on-feature` into `main` while learning what each Git command actually does.

---

# Step 1 - Review My Feature Branch

First, I checked that I was on the correct branch.

```bash
git branch
```

Then I reviewed my recent commits.

```bash
git log --oneline -10
```

This reminded me exactly what work was included in the feature before merging.

---

# Step 2 - Check If Main Had Changed

I compared my branch against `main`.

```bash
git log --oneline 55a6ca5..main
```

Nothing was printed.

I learned that this meant `main` had not received any new commits since I created my feature branch.

Because of that, merge conflicts were very unlikely.

---

# Step 3 - Review My Changes

I checked what files were different.

```bash
git diff --stat main
```

Then I listed every changed file.

```bash
git diff --name-only main
```

This helped me verify exactly what the feature had modified.

---

# Step 4 - Test The Merge Safely

Instead of touching `main`, I created a temporary branch.

```bash
git checkout main
git pull origin main
git checkout -b main-merge-test
```

Then I merged my feature.

```bash
git merge try-on-feature
```

Git responded with:

```text
Updating 55a6ca5..8eff96c
Fast-forward
```

I learned that a Fast-Forward merge means Git simply moved the branch pointer because there were no conflicting commits.

I tested the entire application on this temporary branch.

Everything worked correctly.

---

# Step 5 - Merge Into Main

After confirming everything worked, I switched back to `main`.

```bash
git checkout main
```

Instead of performing another Fast-Forward merge, I wanted Git history to clearly show that this feature had been merged.

So I used:

```bash
git merge --no-ff try-on-feature
```

This forced Git to create a merge commit.

---

# Step 6 - Using Vim

Git opened Vim so I could confirm the merge commit message.

The default message was already good enough.

```
Merge branch 'try-on-feature'
```

The Vim commands I used were:

Enter Insert Mode

```
i
```

Exit Insert Mode

```
Esc
```

Save and Quit

```
:wq
```

After saving, Git created the merge commit successfully.

---

# Step 7 - Verify The Merge

I checked the history.

```bash
git log --oneline --graph --decorate -10
```

I saw:

```text
Merge branch 'try-on-feature'
```

along with all of the commits that belonged to the feature branch.

This confirmed that the feature history had been preserved.

---

# Step 8 - Push

Once I confirmed everything looked correct, I pushed `main`.

```bash
git push origin main
```

The merge commit was now on GitHub.

---

# Step 9 - Cleanup

The temporary testing branch was no longer needed.

```bash
git branch -D main-merge-test
```

I intentionally kept `try-on-feature` because I want to use it later to show the complete development history during interviews or when explaining the feature to other developers.

---

# What I Learned

- Don't merge into `main` without understanding what is changing.
- Checking the commit history first helps predict whether conflicts are likely.
- A temporary merge-testing branch is a safe way to verify everything before touching `main`.
- A Fast-Forward merge simply moves the branch pointer.
- `--no-ff` creates a merge commit and preserves the feature branch history.
- Git uses Vim to edit merge commit messages, and knowing a few basic Vim commands is enough for everyday Git work.
- Keeping long-lived feature branches after merging can be useful for demonstrations, code reviews, and interviews.