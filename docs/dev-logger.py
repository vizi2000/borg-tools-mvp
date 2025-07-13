#!/usr/bin/env python3
"""
Development Event Logger for Borg-Tools MVP Auto-Documentary System

This script automatically captures development events and updates the project documentary.
Run as a background process or integrate with your development workflow.
"""

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Any
import subprocess
import hashlib

class DevelopmentLogger:
    """Captures and logs development events for auto-documentary generation."""
    
    def __init__(self, project_root: Optional[str] = None):
        self.project_root = Path(project_root or os.getcwd())
        self.log_file = self.project_root / "docs" / "dev-events.json"
        self.documentary_file = self.project_root / "docs" / "DOCUMENTARY.md"
        self.timeline_file = self.project_root / "docs" / "timeline.json"
        self.decisions_file = self.project_root / "docs" / "decisions.json"
        
        # Ensure docs directory exists
        self.log_file.parent.mkdir(exist_ok=True)
        
        # Initialize log files if they don't exist
        self._initialize_logs()
    
    def _initialize_logs(self):
        """Initialize log files with empty structures."""
        if not self.log_file.exists():
            self._write_json(self.log_file, {"events": []})
        
        if not self.timeline_file.exists():
            self._write_json(self.timeline_file, {"milestones": []})
        
        if not self.decisions_file.exists():
            self._write_json(self.decisions_file, {"decisions": []})
    
    def _write_json(self, file_path: Path, data: Dict[str, Any]):
        """Write JSON data to file with proper formatting."""
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False, default=str)
    
    def _read_json(self, file_path: Path) -> Dict[str, Any]:
        """Read JSON data from file."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return {}
    
    def _get_git_info(self) -> Dict[str, str]:
        """Get current git information if available."""
        try:
            branch = subprocess.check_output(
                ["git", "branch", "--show-current"], 
                cwd=self.project_root,
                stderr=subprocess.DEVNULL
            ).decode().strip()
            
            commit_hash = subprocess.check_output(
                ["git", "rev-parse", "HEAD"], 
                cwd=self.project_root,
                stderr=subprocess.DEVNULL
            ).decode().strip()[:8]
            
            return {"branch": branch, "commit": commit_hash}
        except (subprocess.CalledProcessError, FileNotFoundError):
            return {"branch": "unknown", "commit": "unknown"}
    
    def log_event(self, event_type: str, description: str, 
                  details: Optional[Dict[str, Any]] = None,
                  files_changed: Optional[List[str]] = None):
        """Log a development event with timestamp and context."""
        
        event = {
            "id": hashlib.md5(f"{datetime.now().isoformat()}{description}".encode()).hexdigest()[:8],
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "type": event_type,
            "description": description,
            "details": details or {},
            "files_changed": files_changed or [],
            "git_info": self._get_git_info(),
            "story_impact": self._assess_story_impact(event_type, description)
        }
        
        # Read current events
        data = self._read_json(self.log_file)
        if "events" not in data:
            data["events"] = []
        
        # Add new event
        data["events"].append(event)
        
        # Keep only last 1000 events to prevent file bloat
        data["events"] = data["events"][-1000:]
        
        # Write back to file
        self._write_json(self.log_file, data)
        
        # Update documentary if this is a significant event
        if event["story_impact"] in ["high", "critical"]:
            self._update_documentary(event)
        
        print(f"✅ Logged {event_type}: {description}")
    
    def _assess_story_impact(self, event_type: str, description: str) -> str:
        """Assess how much this event impacts the project story."""
        high_impact_types = ["feature", "architecture", "milestone", "decision", "breakthrough"]
        medium_impact_types = ["bug_fix", "refactor", "test", "optimization"]
        
        if event_type in high_impact_types:
            return "high"
        elif event_type in medium_impact_types:
            return "medium"
        elif "critical" in description.lower() or "major" in description.lower():
            return "critical"
        else:
            return "low"
    
    def log_milestone(self, title: str, description: str, 
                     achievement: str, lessons_learned: Optional[List[str]] = None):
        """Log a major project milestone."""
        
        milestone = {
            "id": hashlib.md5(f"{datetime.now().isoformat()}{title}".encode()).hexdigest()[:8],
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "title": title,
            "description": description,
            "achievement": achievement,
            "lessons_learned": lessons_learned or [],
            "git_info": self._get_git_info()
        }
        
        # Read current milestones
        data = self._read_json(self.timeline_file)
        if "milestones" not in data:
            data["milestones"] = []
        
        data["milestones"].append(milestone)
        self._write_json(self.timeline_file, data)
        
        # Also log as high-impact event
        self.log_event("milestone", f"Milestone: {title}", {
            "achievement": achievement,
            "lessons": lessons_learned
        })
        
        print(f"🎯 Milestone logged: {title}")
    
    def log_decision(self, decision: str, rationale: str, 
                    alternatives_considered: Optional[List[str]] = None,
                    consequences: Optional[List[str]] = None):
        """Log an architectural or design decision."""
        
        decision_entry = {
            "id": hashlib.md5(f"{datetime.now().isoformat()}{decision}".encode()).hexdigest()[:8],
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "decision": decision,
            "rationale": rationale,
            "alternatives_considered": alternatives_considered or [],
            "consequences": consequences or [],
            "git_info": self._get_git_info()
        }
        
        # Read current decisions
        data = self._read_json(self.decisions_file)
        if "decisions" not in data:
            data["decisions"] = []
        
        data["decisions"].append(decision_entry)
        self._write_json(self.decisions_file, data)
        
        # Also log as high-impact event
        self.log_event("decision", f"Decision: {decision}", {
            "rationale": rationale,
            "alternatives": alternatives_considered
        })
        
        print(f"🤔 Decision logged: {decision}")
    
    def _update_documentary(self, event: Dict[str, Any]):
        """Update the main documentary with significant events."""
        if not self.documentary_file.exists():
            return
        
        # For now, just append to a "Recent Updates" section
        # In a more sophisticated version, this could intelligently 
        # update the narrative in the appropriate chapter
        
        update_entry = f"""
## Recent Update: {event['description']}
*{event['timestamp'][:10]} - {event['type'].title()}*

{event['description']}

{f"**Details:** {event['details']}" if event['details'] else ""}

{f"**Files Changed:** {', '.join(event['files_changed'])}" if event['files_changed'] else ""}

---
"""
        
        # This is a simplified version - a full implementation would 
        # parse the markdown and insert in the right location
        print(f"📖 Documentary update prepared for: {event['description']}")
    
    def generate_daily_summary(self) -> str:
        """Generate a summary of today's development activity."""
        today = datetime.now(timezone.utc).date()
        
        data = self._read_json(self.log_file)
        events = data.get("events", [])
        
        today_events = [
            e for e in events 
            if datetime.fromisoformat(e["timestamp"]).date() == today
        ]
        
        if not today_events:
            return "No development activity logged today."
        
        summary = f"## Daily Summary - {today}\n\n"
        summary += f"**Total Events:** {len(today_events)}\n\n"
        
        by_type = {}
        for event in today_events:
            event_type = event["type"]
            if event_type not in by_type:
                by_type[event_type] = []
            by_type[event_type].append(event["description"])
        
        for event_type, descriptions in by_type.items():
            summary += f"**{event_type.title()}:**\n"
            for desc in descriptions:
                summary += f"- {desc}\n"
            summary += "\n"
        
        return summary

def main():
    """CLI interface for the development logger."""
    if len(sys.argv) < 3:
        print("Usage: python dev-logger.py <event_type> <description> [details_json]")
        print("Examples:")
        print("  python dev-logger.py feature 'Added GitHub OAuth integration'")
        print("  python dev-logger.py bug_fix 'Fixed API rate limiting issue'")
        print("  python dev-logger.py milestone 'First successful PDF generation'")
        return
    
    logger = DevelopmentLogger()
    
    event_type = sys.argv[1]
    description = sys.argv[2]
    details = {}
    
    if len(sys.argv) > 3:
        try:
            details = json.loads(sys.argv[3])
        except json.JSONDecodeError:
            print("Warning: Could not parse details JSON, ignoring.")
    
    logger.log_event(event_type, description, details)

if __name__ == "__main__":
    main()