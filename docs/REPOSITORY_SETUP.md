# Repository Setup

This repository is prepared for the GitHub user or organization `zyjsmile857`.

Recommended GitHub repository:

```text
zyjsmile857/mofei-remote-card
```

The repository name should match the JavaScript file name `mofei-remote-card.js`.

## GitHub Settings

- Make the repository public.
- Add a repository description.
- Enable Issues.
- Add topics: `home-assistant`, `hacs`, `lovelace`, `dashboard`, `custom-card`.
- Push this repository as the root of the GitHub repository.

## Checks

The `Validate` workflow must pass.

## Release

After the workflow passes, create a full GitHub release, not only a tag.

Suggested first release:

```text
v0.1.0
```

## HACS Default PR

Fork `hacs/default`, edit the `plugin` file, and add:

```json
"zyjsmile857/mofei-remote-card"
```

Keep the list alphabetically sorted, then open a pull request to `hacs/default`.
