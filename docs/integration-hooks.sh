#!/bin/bash

# Integration Hooks for Borg-Tools MVP Auto-Documentary System
# 
# This script sets up Git hooks and development workflow integrations
# to automatically capture project events and update the documentary.

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCS_DIR="$PROJECT_ROOT/docs"
HOOKS_DIR="$PROJECT_ROOT/.git/hooks"

echo "🔧 Setting up auto-documentary integration hooks..."

# Check if we're in a git repository
if [ ! -d "$PROJECT_ROOT/.git" ]; then
    echo "⚠️  Warning: Not a git repository. Some hooks will not be available."
    echo "   Run 'git init' to enable full integration."
fi

# Create hooks directory if it doesn't exist
mkdir -p "$HOOKS_DIR" 2>/dev/null || true

# Function to create or update a git hook
create_git_hook() {
    local hook_name="$1"
    local hook_content="$2"
    local hook_path="$HOOKS_DIR/$hook_name"
    
    echo "📝 Creating $hook_name hook..."
    
    cat > "$hook_path" << EOF
#!/bin/bash
# Auto-generated Git hook for Borg-Tools MVP documentary system
# Generated on $(date)

PROJECT_ROOT="$PROJECT_ROOT"
DOCS_DIR="$DOCS_DIR"

$hook_content
EOF
    
    chmod +x "$hook_path"
    echo "✅ $hook_name hook created"
}

# Pre-commit hook - Log development events before commit
PRE_COMMIT_CONTENT='
# Capture files being committed
STAGED_FILES=$(git diff --cached --name-only)

if [ -n "$STAGED_FILES" ]; then
    # Determine commit type from staged files
    COMMIT_TYPE="code_change"
    
    if echo "$STAGED_FILES" | grep -q "package\.json\|requirements\.txt\|Cargo\.toml"; then
        COMMIT_TYPE="dependency_update"
    elif echo "$STAGED_FILES" | grep -q "README\|\.md$"; then
        COMMIT_TYPE="documentation"
    elif echo "$STAGED_FILES" | grep -q "test\|spec"; then
        COMMIT_TYPE="test"
    elif echo "$STAGED_FILES" | grep -q "config\|\.env\|\.yaml\|\.json$"; then
        COMMIT_TYPE="configuration"
    fi
    
    # Log the event if the logger exists
    if [ -f "$DOCS_DIR/dev-logger.py" ]; then
        python3 "$DOCS_DIR/dev-logger.py" "$COMMIT_TYPE" "Preparing commit with $(echo "$STAGED_FILES" | wc -l) files" "{\"files\": [$(echo "$STAGED_FILES" | sed "s/.*/'\'\'&\'\'\'/" | tr "\n" "," | sed "s/,$//")]}" 2>/dev/null || true
    fi
fi
'

# Post-commit hook - Log successful commits and analyze changes
POST_COMMIT_CONTENT='
# Get commit information
COMMIT_HASH=$(git rev-parse HEAD)
COMMIT_MESSAGE=$(git log -1 --pretty=%B)
FILES_CHANGED=$(git show --name-only --pretty="")
LINES_CHANGED=$(git show --shortstat --pretty="" | grep -o "[0-9]\+ insertions\|[0-9]\+ deletions" | grep -o "[0-9]\+" | tr "\n" " ")

# Determine significance of the commit
SIGNIFICANCE="medium"
if echo "$COMMIT_MESSAGE" | grep -qi "feat\|feature\|add"; then
    SIGNIFICANCE="high"
elif echo "$COMMIT_MESSAGE" | grep -qi "fix\|bug"; then
    SIGNIFICANCE="medium"
elif echo "$COMMIT_MESSAGE" | grep -qi "docs\|comment\|typo"; then
    SIGNIFICANCE="low"
elif echo "$COMMIT_MESSAGE" | grep -qi "breaking\|major\|milestone"; then
    SIGNIFICANCE="critical"
fi

# Extract potential milestone indicators
MILESTONE_KEYWORDS="first|initial|complete|finish|release|launch|deploy|integrate|working"
if echo "$COMMIT_MESSAGE" | grep -qiE "$MILESTONE_KEYWORDS"; then
    IS_MILESTONE="true"
else
    IS_MILESTONE="false"
fi

# Log the commit event
if [ -f "$DOCS_DIR/dev-logger.py" ]; then
    python3 "$DOCS_DIR/dev-logger.py" "commit" "Committed: $COMMIT_MESSAGE" "{\"hash\": \"$COMMIT_HASH\", \"files_changed\": $(echo "$FILES_CHANGED" | wc -l), \"significance\": \"$SIGNIFICANCE\", \"is_milestone\": $IS_MILESTONE}" 2>/dev/null || true
fi

# If this looks like a milestone, suggest logging it
if [ "$IS_MILESTONE" = "true" ] && [ "$SIGNIFICANCE" = "high" ] || [ "$SIGNIFICANCE" = "critical" ]; then
    echo ""
    echo "🎯 This commit looks like a milestone!"
    echo "   Consider logging it with:"
    echo "   python3 docs/timeline-manager.py milestone \"$(echo "$COMMIT_MESSAGE" | head -1)\" \"Description\" \"current_phase\""
    echo ""
fi
'

# Post-merge hook - Log merge events
POST_MERGE_CONTENT='
# Check if this was a merge commit
if git log -1 --pretty=%P | grep -q " "; then
    MERGE_MESSAGE=$(git log -1 --pretty=%B)
    BRANCH_NAME=$(git log -1 --pretty=%s | grep -o "Merge.*into" | sed "s/Merge.*'\''\\(.*\\)'\''.*/\\1/" || echo "unknown")
    
    if [ -f "$DOCS_DIR/dev-logger.py" ]; then
        python3 "$DOCS_DIR/dev-logger.py" "merge" "Merged branch: $MERGE_MESSAGE" "{\"branch\": \"$BRANCH_NAME\"}" 2>/dev/null || true
    fi
    
    echo "🔀 Branch merge logged in documentary system"
fi
'

# Create the git hooks if git repository exists
if [ -d "$PROJECT_ROOT/.git" ]; then
    create_git_hook "pre-commit" "$PRE_COMMIT_CONTENT"
    create_git_hook "post-commit" "$POST_COMMIT_CONTENT"  
    create_git_hook "post-merge" "$POST_MERGE_CONTENT"
fi

# Create package.json scripts integration
PACKAGE_JSON="$PROJECT_ROOT/package.json"
if [ -f "$PACKAGE_JSON" ]; then
    echo "📦 Adding npm scripts for documentary system..."
    
    # Create a temporary script to add documentary commands
    cat > "$DOCS_DIR/add-npm-scripts.js" << 'EOF'
const fs = require('fs');
const path = require('path');

const packagePath = path.join(process.cwd(), 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Ensure scripts section exists
if (!pkg.scripts) {
    pkg.scripts = {};
}

// Add documentary scripts
const documentaryScripts = {
    'doc:log': 'python3 docs/dev-logger.py',
    'doc:milestone': 'python3 docs/timeline-manager.py milestone',
    'doc:decision': 'python3 docs/decision-tracker.py add',
    'doc:progress': 'python3 docs/timeline-manager.py progress',
    'doc:report': 'python3 docs/timeline-manager.py report',
    'doc:summary': 'python3 docs/dev-logger.py && python3 docs/timeline-manager.py progress'
};

// Add scripts that don't already exist
let added = false;
for (const [script, command] of Object.entries(documentaryScripts)) {
    if (!pkg.scripts[script]) {
        pkg.scripts[script] = command;
        added = true;
        console.log(`✅ Added script: ${script}`);
    }
}

if (added) {
    fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
    console.log('📦 Package.json updated with documentary scripts');
} else {
    console.log('📦 Documentary scripts already exist in package.json');
}
EOF
    
    node "$DOCS_DIR/add-npm-scripts.js" 2>/dev/null || echo "⚠️  Could not update package.json (Node.js required)"
    rm -f "$DOCS_DIR/add-npm-scripts.js"
fi

# Create development workflow integration
echo "🔗 Creating workflow integration scripts..."

# Create a daily summary script
cat > "$DOCS_DIR/daily-summary.sh" << 'EOF'
#!/bin/bash
# Generate daily development summary

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCS_DIR="$PROJECT_ROOT/docs"

echo "📊 Daily Development Summary - $(date +%Y-%m-%d)"
echo "================================================"

# Git activity
if [ -d "$PROJECT_ROOT/.git" ]; then
    echo ""
    echo "🔀 Git Activity:"
    git log --oneline --since="1 day ago" | head -10
fi

# Development events
if [ -f "$DOCS_DIR/dev-events.json" ]; then
    echo ""
    echo "📝 Development Events:"
    python3 -c "
import json, sys
from datetime import datetime, timezone

try:
    with open('$DOCS_DIR/dev-events.json', 'r') as f:
        data = json.load(f)
    
    today = datetime.now(timezone.utc).date()
    events = [e for e in data.get('events', []) 
              if datetime.fromisoformat(e['timestamp']).date() == today]
    
    if events:
        for event in events[-10:]:  # Last 10 events
            time = datetime.fromisoformat(event['timestamp']).strftime('%H:%M')
            print(f'  {time} - {event[\"type\"]}: {event[\"description\"]}')
    else:
        print('  No events logged today')
except Exception as e:
    print('  Could not read development events')
"
fi

# Progress update
if [ -f "$DOCS_DIR/timeline-manager.py" ]; then
    echo ""
    echo "📈 Progress Update:"
    python3 "$DOCS_DIR/timeline-manager.py" progress 2>/dev/null || echo "  Could not generate progress report"
fi

echo ""
echo "================================================"
echo "Use 'npm run doc:log <type> <description>' to log events"
echo "Use 'npm run doc:milestone <title> <description> <phase>' for milestones"
EOF

chmod +x "$DOCS_DIR/daily-summary.sh"

# Create VS Code integration (if .vscode exists)
VSCODE_DIR="$PROJECT_ROOT/.vscode"
if [ -d "$VSCODE_DIR" ]; then
    echo "🔧 Setting up VS Code integration..."
    
    # Add tasks for documentary system
    TASKS_FILE="$VSCODE_DIR/tasks.json"
    if [ ! -f "$TASKS_FILE" ]; then
        cat > "$TASKS_FILE" << 'EOF'
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "Documentary: Log Event",
            "type": "shell",
            "command": "python3",
            "args": ["docs/dev-logger.py", "${input:eventType}", "${input:eventDescription}"],
            "group": "build",
            "presentation": {
                "echo": true,
                "reveal": "always",
                "focus": false,
                "panel": "shared"
            }
        },
        {
            "label": "Documentary: Add Milestone", 
            "type": "shell",
            "command": "python3",
            "args": ["docs/timeline-manager.py", "milestone", "${input:milestoneTitle}", "${input:milestoneDescription}", "${input:phaseId}"],
            "group": "build"
        },
        {
            "label": "Documentary: Show Progress",
            "type": "shell", 
            "command": "python3",
            "args": ["docs/timeline-manager.py", "progress"],
            "group": "build"
        },
        {
            "label": "Documentary: Daily Summary",
            "type": "shell",
            "command": "bash",
            "args": ["docs/daily-summary.sh"],
            "group": "build"
        }
    ],
    "inputs": [
        {
            "id": "eventType",
            "description": "Event type",
            "default": "feature",
            "type": "pickString",
            "options": ["feature", "bug_fix", "refactor", "test", "documentation", "configuration", "optimization", "milestone"]
        },
        {
            "id": "eventDescription",
            "description": "Event description",
            "default": "Describe what was accomplished",
            "type": "promptString"
        },
        {
            "id": "milestoneTitle",
            "description": "Milestone title",
            "default": "Major milestone achieved",
            "type": "promptString"
        },
        {
            "id": "milestoneDescription", 
            "description": "Milestone description",
            "default": "Describe the achievement",
            "type": "promptString"
        },
        {
            "id": "phaseId",
            "description": "Project phase",
            "default": "foundation",
            "type": "pickString",
            "options": ["conception", "foundation", "ai_agents", "design_system", "testing_optimization", "launch"]
        }
    ]
}
EOF
        echo "✅ VS Code tasks added"
    fi
fi

# Create usage guide
cat > "$DOCS_DIR/USAGE.md" << 'EOF'
# Auto-Documentary System Usage Guide

The Borg-Tools MVP auto-documentary system automatically captures your development journey and maintains a living narrative of the project.

## Quick Start

### Logging Events
```bash
# Log a feature completion
npm run doc:log feature "Added GitHub OAuth integration"

# Log a bug fix
npm run doc:log bug_fix "Fixed API rate limiting issue"

# Log a milestone
npm run doc:milestone "First PDF Generated" "Successfully generated first CV PDF" "ai_agents"
```

### Recording Decisions
```bash
# Record an architectural decision
npm run doc:decision "Use LangGraph for AI orchestration" "Need reliable state management for multi-agent workflows" "LangGraph provides robust state machine patterns" "Evaluated alternatives: custom state management, Temporal"
```

### Checking Progress
```bash
# Quick progress check
npm run doc:progress

# Full progress report
npm run doc:report

# Daily summary
./docs/daily-summary.sh
```

## System Components

### 1. Development Logger (`dev-logger.py`)
Captures development events with context:
- Code changes, bug fixes, features
- Dependencies updates, configuration changes
- Test additions, documentation updates

### 2. Timeline Manager (`timeline-manager.py`)
Tracks project phases and milestones:
- Project phase management
- Milestone tracking
- Progress calculation
- Visual timeline generation

### 3. Decision Tracker (`decision-tracker.py`)
Records architectural and design decisions:
- Architecture Decision Records (ADR)
- Decision rationale and alternatives
- Status tracking (proposed, accepted, superseded)
- Decision impact analysis

### 4. Integration Hooks (`integration-hooks.sh`)
Automates documentation capture:
- Git hooks for commit/merge events
- npm script integration
- VS Code task integration
- Daily summary generation

## Files Generated

```
docs/
├── DOCUMENTARY.md          # Main project narrative
├── dev-events.json         # Raw development events
├── timeline.json           # Project timeline data
├── decisions.json          # Decision records
├── MILESTONES.md          # Milestone history
├── DECISIONS.md           # Decision index
├── progress-report.md     # Latest progress report
└── adr/                   # Individual ADR files
    ├── adr-001-*.md
    └── adr-002-*.md
```

## Git Integration

The system automatically captures:
- **Pre-commit:** Files being committed, change type detection
- **Post-commit:** Commit analysis, milestone detection
- **Post-merge:** Branch merge events

## VS Code Integration

Use Command Palette (Ctrl+Shift+P):
- `Tasks: Run Task` → `Documentary: Log Event`
- `Tasks: Run Task` → `Documentary: Add Milestone`
- `Tasks: Run Task` → `Documentary: Show Progress`

## Best Practices

1. **Log regularly:** Use git hooks to capture events automatically
2. **Mark milestones:** Record significant achievements as they happen
3. **Document decisions:** Record the "why" behind architectural choices
4. **Review progress:** Use daily summaries to track momentum
5. **Update narrative:** Manually update DOCUMENTARY.md for major story changes

## Event Types

- `feature` - New functionality added
- `bug_fix` - Issues resolved
- `refactor` - Code restructuring
- `test` - Test additions/improvements
- `documentation` - Documentation updates
- `configuration` - Config/setup changes
- `optimization` - Performance improvements
- `milestone` - Significant achievements
- `decision` - Architectural/design decisions

## Phase Management

Current project phases:
1. `conception` - Planning and architecture
2. `foundation` - Basic setup and core integrations
3. `ai_agents` - LangGraph agent development
4. `design_system` - UI/UX implementation
5. `testing_optimization` - Testing and performance
6. `launch` - Final preparations and deployment

## Troubleshooting

**Python scripts not working?**
- Ensure Python 3 is installed
- Check file permissions: `chmod +x docs/*.py`

**Git hooks not triggering?**
- Verify hooks are executable: `ls -la .git/hooks/`
- Re-run setup: `./docs/integration-hooks.sh`

**Missing npm scripts?**
- Run setup again to add scripts to package.json
- Manually add scripts if needed

---

*This system grows with your project, capturing the full development journey from conception to launch.*
EOF

echo ""
echo "🎉 Auto-documentary system setup complete!"
echo ""
echo "📚 Available commands:"
echo "   npm run doc:log <type> <description>     - Log development events"
echo "   npm run doc:milestone <title> <desc> <phase> - Record milestones"
echo "   npm run doc:decision <title> <context> <decision> <rationale> - Record decisions"
echo "   npm run doc:progress                     - Show current progress"
echo "   npm run doc:report                       - Generate full report"
echo "   ./docs/daily-summary.sh                  - Daily development summary"
echo ""
echo "📖 Read docs/USAGE.md for detailed instructions"
echo ""
echo "🔗 Git hooks installed (if .git directory exists):"
echo "   - pre-commit: Logs staged changes"
echo "   - post-commit: Analyzes commits and detects milestones"  
echo "   - post-merge: Logs branch merges"
echo ""
echo "✨ Your development story will now be automatically captured!"