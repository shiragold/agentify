---
name: skiller
description: The ultimate way to generate a superb agent skill
disable-model-invocation: true
---

# Skiller

## Steps

1. Understand the motivation - what's the need, what are the use cases? Ask clarifying questions.
2. Decide on invocation - model-invoked costs permanent agent context; user-invoked costs human attention.
3. Define the process - write "Steps": clear, logical operations for the agent to follow.
4. Define the outcome - write "Output": either actions only (no generated answer) or a response matching a specific Zod schema.
5. Add "Reference" - list supporting files and when to read each.
6. Create the listed files in a sibling `resources/` folder.
7. Review SKILL.md - keep it as small as the task permits; anything not needed every time (e.g. branching workflows) belongs in bundled files.
8. Review the resources - helpful and practical, not elaborate or overwhelming.
