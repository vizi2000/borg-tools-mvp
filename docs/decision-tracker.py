#!/usr/bin/env python3
"""
Decision Tracker for Borg-Tools MVP Auto-Documentary System

Tracks architectural decisions, design choices, and their rationale.
Implements Architecture Decision Records (ADR) format.
"""

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Any
import sys
import hashlib

class DecisionTracker:
    """Tracks and manages architectural and design decisions."""
    
    def __init__(self, project_root: Optional[str] = None):
        self.project_root = Path(project_root or os.getcwd())
        self.decisions_file = self.project_root / "docs" / "decisions.json"
        self.adr_dir = self.project_root / "docs" / "adr"
        self.decision_index = self.project_root / "docs" / "DECISIONS.md"
        
        # Ensure directories exist
        self.decisions_file.parent.mkdir(exist_ok=True)
        self.adr_dir.mkdir(exist_ok=True)
        
        # Initialize if needed
        self._initialize_decisions()
    
    def _initialize_decisions(self):
        """Initialize decision tracking system."""
        if not self.decisions_file.exists():
            initial_data = {
                "decisions": [],
                "categories": [
                    "architecture", "technology", "design", "infrastructure", 
                    "security", "performance", "ui-ux", "business"
                ],
                "statuses": [
                    "proposed", "accepted", "superseded", "deprecated", "rejected"
                ]
            }
            self._write_json(self.decisions_file, initial_data)
        
        # Create initial decision index
        if not self.decision_index.exists():
            self._update_decision_index()
    
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
    
    def add_decision(self, 
                    title: str, 
                    context: str, 
                    decision: str, 
                    rationale: str,
                    category: str = "architecture",
                    status: str = "accepted",
                    alternatives_considered: Optional[List[str]] = None,
                    consequences: Optional[List[str]] = None,
                    related_decisions: Optional[List[str]] = None,
                    tags: Optional[List[str]] = None) -> str:
        """Add a new architectural decision record."""
        
        # Generate unique ID
        decision_id = f"ADR-{len(self._read_json(self.decisions_file).get('decisions', []))+1:03d}"
        
        decision_record = {
            "id": decision_id,
            "title": title,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status": status,
            "category": category,
            "context": context,
            "decision": decision,
            "rationale": rationale,
            "alternatives_considered": alternatives_considered or [],
            "consequences": consequences or [],
            "related_decisions": related_decisions or [],
            "tags": tags or [],
            "author": "Development Team",  # Could be made configurable
            "last_modified": datetime.now(timezone.utc).isoformat()
        }
        
        # Add to decisions.json
        data = self._read_json(self.decisions_file)
        if "decisions" not in data:
            data["decisions"] = []
        
        data["decisions"].append(decision_record)
        self._write_json(self.decisions_file, data)
        
        # Create ADR markdown file
        self._create_adr_file(decision_record)
        
        # Update decision index
        self._update_decision_index()
        
        print(f"✅ Decision {decision_id} recorded: {title}")
        return decision_id
    
    def _create_adr_file(self, decision: Dict[str, Any]):
        """Create an ADR markdown file for the decision."""
        filename = f"{decision['id'].lower()}-{self._slugify(decision['title'])}.md"
        file_path = self.adr_dir / filename
        
        # Create markdown content
        content = f"""# {decision['id']}: {decision['title']}

**Status:** {decision['status'].title()}  
**Category:** {decision['category'].title()}  
**Date:** {datetime.fromisoformat(decision['timestamp']).strftime('%Y-%m-%d')}  
**Tags:** {', '.join(decision['tags']) if decision['tags'] else 'None'}

## Context

{decision['context']}

## Decision

{decision['decision']}

## Rationale

{decision['rationale']}
"""
        
        if decision['alternatives_considered']:
            content += "\n## Alternatives Considered\n\n"
            for alt in decision['alternatives_considered']:
                content += f"- {alt}\n"
        
        if decision['consequences']:
            content += "\n## Consequences\n\n"
            for consequence in decision['consequences']:
                content += f"- {consequence}\n"
        
        if decision['related_decisions']:
            content += "\n## Related Decisions\n\n"
            for related in decision['related_decisions']:
                content += f"- {related}\n"
        
        content += f"""
## History

- {datetime.fromisoformat(decision['timestamp']).strftime('%Y-%m-%d')}: Initial decision recorded

---

*This ADR is part of the Borg-Tools MVP auto-documentary system.*
"""
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
    
    def _slugify(self, text: str) -> str:
        """Convert text to URL-friendly slug."""
        import re
        slug = re.sub(r'[^a-zA-Z0-9\s-]', '', text.lower())
        slug = re.sub(r'\s+', '-', slug)
        return slug.strip('-')
    
    def update_decision_status(self, decision_id: str, new_status: str, reason: str = ""):
        """Update the status of an existing decision."""
        data = self._read_json(self.decisions_file)
        decisions = data.get("decisions", [])
        
        for decision in decisions:
            if decision["id"] == decision_id:
                old_status = decision["status"]
                decision["status"] = new_status
                decision["last_modified"] = datetime.now(timezone.utc).isoformat()
                
                # Add status change to history if it exists, otherwise create it
                if "history" not in decision:
                    decision["history"] = []
                
                decision["history"].append({
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "action": "status_change",
                    "old_status": old_status,
                    "new_status": new_status,
                    "reason": reason
                })
                
                self._write_json(self.decisions_file, data)
                
                # Update ADR file
                self._create_adr_file(decision)
                self._update_decision_index()
                
                print(f"✅ Decision {decision_id} status updated: {old_status} → {new_status}")
                return
        
        print(f"❌ Decision {decision_id} not found")
    
    def _update_decision_index(self):
        """Update the main decision index markdown file."""
        data = self._read_json(self.decisions_file)
        decisions = data.get("decisions", [])
        
        content = f"""# Architecture Decision Records (ADRs)

*Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M UTC')}*

This document tracks all architectural and design decisions made during the Borg-Tools MVP development.

## Decision Overview

**Total Decisions:** {len(decisions)}

"""
        
        # Group by status
        by_status = {}
        for decision in decisions:
            status = decision["status"]
            if status not in by_status:
                by_status[status] = []
            by_status[status].append(decision)
        
        for status, status_decisions in by_status.items():
            content += f"**{status.title()}:** {len(status_decisions)}  \n"
        
        content += "\n## Decisions by Category\n\n"
        
        # Group by category
        by_category = {}
        for decision in decisions:
            category = decision["category"]
            if category not in by_category:
                by_category[category] = []
            by_category[category].append(decision)
        
        for category, category_decisions in sorted(by_category.items()):
            content += f"### {category.title()} ({len(category_decisions)})\n\n"
            
            for decision in sorted(category_decisions, key=lambda x: x["id"]):
                status_emoji = {
                    "accepted": "✅",
                    "proposed": "🤔", 
                    "superseded": "🔄",
                    "deprecated": "❌",
                    "rejected": "🚫"
                }.get(decision["status"], "❓")
                
                date = datetime.fromisoformat(decision["timestamp"]).strftime('%Y-%m-%d')
                adr_file = f"{decision['id'].lower()}-{self._slugify(decision['title'])}.md"
                
                content += f"- {status_emoji} **[{decision['id']}: {decision['title']}](adr/{adr_file})**  \n"
                content += f"  *{date} - {decision['status'].title()}*  \n"
                content += f"  {decision['decision'][:100]}{'...' if len(decision['decision']) > 100 else ''}  \n\n"
        
        content += "## Recent Decisions\n\n"
        
        # Show 10 most recent decisions
        recent_decisions = sorted(decisions, key=lambda x: x["timestamp"], reverse=True)[:10]
        
        for decision in recent_decisions:
            date = datetime.fromisoformat(decision["timestamp"]).strftime('%Y-%m-%d')
            adr_file = f"{decision['id'].lower()}-{self._slugify(decision['title'])}.md"
            
            content += f"### [{decision['id']}: {decision['title']}](adr/{adr_file})\n"
            content += f"*{date} - {decision['category'].title()} - {decision['status'].title()}*\n\n"
            content += f"{decision['rationale'][:200]}{'...' if len(decision['rationale']) > 200 else ''}\n\n"
        
        content += """## How to Use ADRs

1. **Adding a Decision:** Use `python decision-tracker.py add` command
2. **Updating Status:** Use `python decision-tracker.py update-status` command  
3. **Viewing Decisions:** Browse the `adr/` directory for detailed records

## ADR Template

When making decisions, consider:
- **Context:** What circumstances led to this decision?
- **Decision:** What exactly are we choosing to do?
- **Rationale:** Why is this the best choice?
- **Alternatives:** What other options did we consider?
- **Consequences:** What are the positive and negative outcomes?

---

*This index is automatically maintained by the auto-documentary system.*
"""
        
        with open(self.decision_index, 'w', encoding='utf-8') as f:
            f.write(content)
    
    def search_decisions(self, query: str, category: Optional[str] = None, 
                        status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Search decisions by text, category, or status."""
        data = self._read_json(self.decisions_file)
        decisions = data.get("decisions", [])
        
        results = []
        query_lower = query.lower()
        
        for decision in decisions:
            # Apply filters
            if category and decision["category"] != category:
                continue
            if status and decision["status"] != status:
                continue
            
            # Text search
            searchable_text = f"{decision['title']} {decision['context']} {decision['decision']} {decision['rationale']}".lower()
            if query_lower in searchable_text:
                results.append(decision)
        
        return results
    
    def get_decision_impact_analysis(self) -> Dict[str, Any]:
        """Analyze the impact and patterns of decisions."""
        data = self._read_json(self.decisions_file)
        decisions = data.get("decisions", [])
        
        analysis = {
            "total_decisions": len(decisions),
            "by_category": {},
            "by_status": {},
            "timeline": {},
            "most_referenced": [],
            "recent_activity": []
        }
        
        # Category analysis
        for decision in decisions:
            category = decision["category"]
            analysis["by_category"][category] = analysis["by_category"].get(category, 0) + 1
        
        # Status analysis  
        for decision in decisions:
            status = decision["status"]
            analysis["by_status"][status] = analysis["by_status"].get(status, 0) + 1
        
        # Timeline analysis (by month)
        for decision in decisions:
            month = datetime.fromisoformat(decision["timestamp"]).strftime('%Y-%m')
            analysis["timeline"][month] = analysis["timeline"].get(month, 0) + 1
        
        # Find most referenced decisions
        reference_counts = {}
        for decision in decisions:
            for related in decision.get("related_decisions", []):
                reference_counts[related] = reference_counts.get(related, 0) + 1
        
        analysis["most_referenced"] = sorted(
            reference_counts.items(), 
            key=lambda x: x[1], 
            reverse=True
        )[:5]
        
        # Recent activity (last 30 days)
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=30)
        analysis["recent_activity"] = [
            d for d in decisions 
            if datetime.fromisoformat(d["timestamp"]) > cutoff_date
        ]
        
        return analysis

def main():
    """CLI interface for decision tracker."""
    if len(sys.argv) < 2:
        print("Usage: python decision-tracker.py <command> [args...]")
        print("Commands:")
        print("  add <title> <context> <decision> <rationale> [category] [status]")
        print("  update-status <decision_id> <new_status> [reason]")
        print("  search <query> [category] [status]")
        print("  list [category] [status]")
        print("  analysis - Show decision patterns and impact")
        return
    
    tracker = DecisionTracker()
    command = sys.argv[1]
    
    if command == "add":
        if len(sys.argv) < 6:
            print("Usage: add <title> <context> <decision> <rationale> [category] [status]")
            return
        
        title = sys.argv[2]
        context = sys.argv[3]
        decision = sys.argv[4]
        rationale = sys.argv[5]
        category = sys.argv[6] if len(sys.argv) > 6 else "architecture"
        status = sys.argv[7] if len(sys.argv) > 7 else "accepted"
        
        decision_id = tracker.add_decision(title, context, decision, rationale, category, status)
        print(f"Decision recorded as {decision_id}")
    
    elif command == "update-status":
        if len(sys.argv) < 4:
            print("Usage: update-status <decision_id> <new_status> [reason]")
            return
        
        decision_id = sys.argv[2]
        new_status = sys.argv[3]
        reason = sys.argv[4] if len(sys.argv) > 4 else ""
        
        tracker.update_decision_status(decision_id, new_status, reason)
    
    elif command == "search":
        if len(sys.argv) < 3:
            print("Usage: search <query> [category] [status]")
            return
        
        query = sys.argv[2]
        category = sys.argv[3] if len(sys.argv) > 3 else None
        status = sys.argv[4] if len(sys.argv) > 4 else None
        
        results = tracker.search_decisions(query, category, status)
        
        print(f"Found {len(results)} decisions matching '{query}':")
        for decision in results:
            print(f"  {decision['id']}: {decision['title']} ({decision['status']})")
    
    elif command == "list":
        category = sys.argv[2] if len(sys.argv) > 2 else None
        status = sys.argv[3] if len(sys.argv) > 3 else None
        
        results = tracker.search_decisions("", category, status)
        
        print(f"Decisions{f' in category {category}' if category else ''}{f' with status {status}' if status else ''}:")
        for decision in results:
            date = datetime.fromisoformat(decision['timestamp']).strftime('%Y-%m-%d')
            print(f"  {decision['id']}: {decision['title']} ({decision['status']}, {date})")
    
    elif command == "analysis":
        analysis = tracker.get_decision_impact_analysis()
        
        print(f"Decision Analysis:")
        print(f"  Total Decisions: {analysis['total_decisions']}")
        print(f"  Categories: {dict(analysis['by_category'])}")
        print(f"  Status Distribution: {dict(analysis['by_status'])}")
        print(f"  Recent Activity (30 days): {len(analysis['recent_activity'])} decisions")
        
        if analysis['most_referenced']:
            print(f"  Most Referenced:")
            for decision_id, count in analysis['most_referenced']:
                print(f"    {decision_id}: {count} references")
    
    else:
        print(f"Unknown command: {command}")

if __name__ == "__main__":
    main()