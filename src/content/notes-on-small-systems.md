---
title: Notes on Small Systems
excerpt: A field guide to keeping personal software understandable as it grows.
date: 2026-07-03
readingTime: 7 min
tags:
  - engineering
  - systems
---

Small systems are not miniature large systems. They have different economics: fewer people, longer memory, less ceremony, and a much smaller budget for accidental complexity.

## Optimize for return visits

The most expensive moment in a personal project is often returning after six months. Names have blurred and dependencies have shifted. The system succeeds when it can quickly explain itself to its future maintainer.

```text
one obvious entry point
+one place for configuration
+one command that proves it still works
```

Prefer boring seams over clever layers. Put volatile integrations at the edge. Preserve the story of irreversible decisions. These habits are not bureaucracy; they are compressed memory.

## A maintenance budget

- Delete a dependency when a platform primitive becomes sufficient.
- Keep the happy path executable from a clean checkout.
- Treat documentation as a map, not a mirror of every implementation detail.
