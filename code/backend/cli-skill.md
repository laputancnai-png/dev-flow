# DevFlow CLI Skill

**Entry point:** `node code/cli/bin/devflow.js` (from the project root)
**Full skill guide (REST + CLI):** http://localhost:3000/agent-skill

## Setup

```bash
cd code/cli && npm install
# Test
node bin/devflow.js --help
# Optional: point to a different server
export DEVFLOW_URL=http://your-server:3000/v1
```

## Commands

### devflow projects

```
devflow projects list
devflow projects create <name> [--color <hex>] [--description <text>] [--view overview|todo|docs]
devflow projects delete <slug> [--yes]
```

### devflow todos (alias: todo)

```
devflow todos list <slug> [--status todo|in_progress|done|blocked] [--priority p1|p2|p3]
devflow todos create <slug> <title> [--content <text>] [--category <cat>] [--priority p1|p2|p3]
                                    [--status <s>] [--due YYYY-MM-DD] [--remarks <text>] [--agent]
devflow todos update <id> --project <slug> [--title <t>] [--status <s>] [--priority <p>]
                                           [--content <t>] [--category <c>] [--remarks <r>]
devflow todos done   <id> --project <slug>
devflow todos delete <id> --project <slug> [--yes]
```

`<id>` accepts the 8-char short ID shown in `todos list` (when `--project` is given) or the full UUID.

### devflow docs

```
devflow docs list   <slug>
devflow docs upload <slug> <file-path>
devflow docs delete <id> [--yes]
```

## Output format

All list commands output a formatted table with coloured status/priority cells.  
`create` commands print the short ID and full UUID of the created item.

## Enums

| Field | Values |
|-------|--------|
| priority | `p1` (High) · `p2` (Medium) · `p3` (Low) |
| status | `todo` · `in_progress` · `done` · `blocked` |

## Example session

```bash
# See what projects exist
devflow projects list

# Create a sprint project
devflow projects create "Sprint 43" --color "#534AB7"

# Add tasks (--agent marks them as AI-created)
devflow todos create sprint-43 "Define API contract" --priority p1 --agent
devflow todos create sprint-43 "Implement endpoints" --priority p1 --agent
devflow todos create sprint-43 "Write tests"         --priority p2 --agent

# Check the board
devflow todos list sprint-43

# Start working on the first task
devflow todos update <id> --project sprint-43 --status in_progress

# Mark done when finished
devflow todos done <id> --project sprint-43

# Upload a generated spec
devflow docs upload sprint-43 ./api-spec.md
```
