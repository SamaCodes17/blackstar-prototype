# Personal repository handoff

- Expected owner/repository: `SamaCodes17/blackstar-prototype`
- Expected origin: `https://github.com/SamaCodes17/blackstar-prototype.git`
- Development branch: `prototype`
- Initial remote observation: public repository, default branch `main`, empty; no remote refs.
- Local commit author is configured as `SamaCodes17 <SamaCodes17@users.noreply.github.com>`. Commit author metadata is not proof of authenticated GitHub identity.
- No authenticated GitHub account was reported by the configured credential manager during initial inspection. Account verification must be completed before pushing.

Before the first push: inspect status and commit history, verify the current authenticated GitHub account and the exact fetch/push remote, show the user the files/commits, and obtain explicit confirmation. No automatic push is implemented. Do not add the team repository as a remote.

Normal eventual command, only after those requirements are satisfied:

```sh
git push --set-upstream origin prototype
```

Never use force-push. Do not push `main`. The user may later transfer the branch history by ordinary Git merge/cherry-pick under separate authorization.
