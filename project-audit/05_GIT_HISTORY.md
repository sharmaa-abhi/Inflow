# 05 — Git History & Practices

## Repository Overview

| Metric | Value |
|---|---|
| Total Commits | 48 |
| Active Branches | `main`, `mobile` (currently checked out) |
| Remote | `origin` (GitHub) |
| Default Branch | `main` (remote HEAD) |

## Commit History (Most Recent 30)

```
bddc95e feat: implement UI components including sidebar, statusbar, and main menu
1133894 feat: implement color palette system with multi-format conversion utilities
fd752da refactor: extract UI styles to new stylesheet
06db521 docs: update project roadmap with completed features
3c59626 style: fix favicon path and apply consistent indentation
746d6ce feat: implement new shape library with expanded geometry types
0604224 feat: implement ToolManager for tool switching and keyboard shortcuts
a7cc510 feat: implement dynamic properties panel and color palette management
e50e50c feat: replace InkFlow logo with new SVG-based branding
e776564 feat: implement BaseShape class for unified Konva-based rendering
575397f feat: implement UI property panel and initialize core managers
ca28413 feat: initialize core application architecture
feb4bca feat: implement orthogonal routing, rough rendering
cadc688 docs: add project architectural overview
8524cf6 feat: implement selection system with marquee and transformation
9f0cbf0 fix: resolve SnapManager import issue
1ad43c2 feat: implement core shape architecture and persistence
ff578df chore: remove outdated project documentation
a66ecb9 feat: implement comprehensive properties panel
e2cbe45 feat: add styles for mobile-specific components
36c769f feat: implement core architecture managers
80edc6f  updates
b404050 feat: implement sidebar UI and persistence management
6581a6c  updates
7068a09 chore: relocate entry point to src/main.js
c9ea194 updates css of moblie or make something
dff3143 updates css of moblie
743d252 updates css of moblie
9de8cf8 updates css of moblie
3a330e3 moblie ver
```

## Git Quality Issues

### Critical
| Issue | Description |
|---|---|
| **No `.gitattributes`** | No line ending normalization. Risk of CRLF/LF conflicts between Windows and Linux/Mac contributors. |
| **Empty commit messages** | Commits `80edc6f` and `6581a6c` have only "updates" as the message — provides no useful information. |
| **Vague commit messages** | `c9ea194` reads "updates css of moblie or make something" — unprofessional and meaningless for bisect/blame. |
| **Typos in commits** | "moblie" instead of "mobile" in 4 consecutive commits. |
| **No PR/merge workflow** | All commits are direct pushes — no pull requests, no code review, no protected branches. |

### Moderate
| Issue | Description |
|---|---|
| **Massive feature commits** | Single commits implement entire subsystems (e.g., `ca28413` creates the entire core architecture). No atomic commits, making `git bisect` impossible. |
| **No tags or releases** | No semver tags despite claiming "v2.0" in the UI. |
| **Branch divergence** | `mobile` branch is checked out but its relationship to `main` is unclear — no merge strategy documented. |
| **`package.json` version is `0.0.0`** | Never bumped, making version tracking meaningless. |

### Minor
| Issue | Description |
|---|---|
| **No signed commits** | No GPG signing for commit verification. |
| **No CODEOWNERS file** | No ownership definitions for code review routing. |
| **No branch protection rules** | Anyone can force-push to `main`. |

## Recommendations

1. Adopt [Conventional Commits](https://www.conventionalcommits.org/) for all future messages.
2. Add a `.gitattributes` file with `* text=auto eol=lf`.
3. Create a `v1.0.0` tag from a stable commit on `main` and start semantic versioning.
4. Enable branch protection on `main` requiring PR reviews.
5. Add a `CODEOWNERS` file mapping paths to reviewers.
