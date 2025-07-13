#!/usr/bin/env python3
"""
Timeline Manager for Borg-Tools MVP Auto-Documentary System

Manages project timeline, milestones, and generates visual progress reports.
"""

import json
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
import sys

class TimelineManager:
    """Manages project timeline and milestone tracking."""
    
    def __init__(self, project_root: Optional[str] = None):
        self.project_root = Path(project_root or os.getcwd())
        self.timeline_file = self.project_root / "docs" / "timeline.json"
        self.milestones_md = self.project_root / "docs" / "MILESTONES.md"
        self.progress_file = self.project_root / "docs" / "progress-report.md"
        
        # Ensure docs directory exists
        self.timeline_file.parent.mkdir(exist_ok=True)
        
        # Initialize if needed
        self._initialize_timeline()
    
    def _initialize_timeline(self):
        """Initialize timeline with project phases."""
        if not self.timeline_file.exists():
            initial_timeline = {
                "project_start": datetime.now(timezone.utc).isoformat(),
                "phases": [
                    {
                        "id": "conception",
                        "name": "Conception & Planning",
                        "description": "Initial idea, market research, and architecture planning",
                        "estimated_duration_days": 3,
                        "status": "in_progress",
                        "tasks": [
                            "Define project vision",
                            "Research existing solutions", 
                            "Design system architecture",
                            "Choose technology stack"
                        ]
                    },
                    {
                        "id": "foundation",
                        "name": "Foundation & Setup",
                        "description": "Basic project structure, development environment, and core integrations",
                        "estimated_duration_days": 5,
                        "status": "pending",
                        "tasks": [
                            "Set up Next.js frontend",
                            "Configure FastAPI backend",
                            "Implement GitHub OAuth",
                            "Set up Supabase database"
                        ]
                    },
                    {
                        "id": "ai_agents",
                        "name": "AI Agent Development",
                        "description": "Building LangGraph agents for data processing and content generation",
                        "estimated_duration_days": 7,
                        "status": "pending",
                        "tasks": [
                            "Claude extractor agent",
                            "GPT summary agent",
                            "LinkedIn parser agent",
                            "PDF renderer agent",
                            "Storage uploader agent"
                        ]
                    },
                    {
                        "id": "design_system",
                        "name": "Design System & UI",
                        "description": "Implementing the Neon Tech on Black design system",
                        "estimated_duration_days": 4,
                        "status": "pending",
                        "tasks": [
                            "Define color palette and typography",
                            "Create component library",
                            "Design PDF templates",
                            "Implement responsive layouts"
                        ]
                    },
                    {
                        "id": "testing_optimization",
                        "name": "Testing & Optimization",
                        "description": "Comprehensive testing and performance optimization",
                        "estimated_duration_days": 4,
                        "status": "pending",
                        "tasks": [
                            "Set up E2E testing with Playwright",
                            "Implement unit tests",
                            "Performance optimization",
                            "Security audit"
                        ]
                    },
                    {
                        "id": "launch",
                        "name": "Launch & Documentation",
                        "description": "Final preparations and public launch",
                        "estimated_duration_days": 2,
                        "status": "pending",
                        "tasks": [
                            "Complete documentation",
                            "Deployment setup",
                            "Launch announcement",
                            "Post-launch monitoring"
                        ]
                    }
                ],
                "milestones": [],
                "key_metrics": {
                    "target_performance": {
                        "api_latency_p95": "100ms",
                        "pdf_generation_hot": "2s",
                        "pdf_generation_cold": "30s",
                        "frontend_lcp": "1.2s"
                    },
                    "quality_gates": {
                        "test_coverage": "80%",
                        "typescript_strict": True,
                        "python_mypy_strict": True,
                        "zero_security_vulnerabilities": True
                    }
                }
            }
            
            with open(self.timeline_file, 'w', encoding='utf-8') as f:
                json.dump(initial_timeline, f, indent=2, ensure_ascii=False, default=str)
    
    def _read_timeline(self) -> Dict[str, Any]:
        """Read timeline data from file."""
        try:
            with open(self.timeline_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return {}
    
    def _write_timeline(self, data: Dict[str, Any]):
        """Write timeline data to file."""
        with open(self.timeline_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False, default=str)
    
    def add_milestone(self, title: str, description: str, 
                     phase_id: str, achievement_type: str = "feature",
                     impact_level: str = "medium"):
        """Add a new milestone to the timeline."""
        
        milestone = {
            "id": f"milestone_{len(self._read_timeline().get('milestones', []))}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "title": title,
            "description": description,
            "phase_id": phase_id,
            "achievement_type": achievement_type,  # feature, bug_fix, optimization, etc.
            "impact_level": impact_level,  # low, medium, high, critical
            "story_notes": "",  # For narrative context
            "technical_notes": "",  # For technical context
            "lessons_learned": [],
            "next_steps": []
        }
        
        data = self._read_timeline()
        if "milestones" not in data:
            data["milestones"] = []
        
        data["milestones"].append(milestone)
        self._write_timeline(data)
        
        print(f"✅ Milestone added: {title}")
        return milestone["id"]
    
    def update_phase_status(self, phase_id: str, status: str, 
                           completion_percentage: Optional[int] = None):
        """Update the status of a project phase."""
        
        data = self._read_timeline()
        phases = data.get("phases", [])
        
        for phase in phases:
            if phase["id"] == phase_id:
                phase["status"] = status
                if completion_percentage is not None:
                    phase["completion_percentage"] = completion_percentage
                if status == "completed":
                    phase["completed_at"] = datetime.now(timezone.utc).isoformat()
                break
        
        self._write_timeline(data)
        print(f"📊 Phase '{phase_id}' status updated to: {status}")
    
    def get_current_phase(self) -> Optional[Dict[str, Any]]:
        """Get the currently active phase."""
        data = self._read_timeline()
        phases = data.get("phases", [])
        
        for phase in phases:
            if phase["status"] in ["in_progress", "active"]:
                return phase
        
        # If no active phase, return the first pending phase
        for phase in phases:
            if phase["status"] == "pending":
                return phase
        
        return None
    
    def calculate_project_progress(self) -> Dict[str, Any]:
        """Calculate overall project progress."""
        data = self._read_timeline()
        phases = data.get("phases", [])
        milestones = data.get("milestones", [])
        
        if not phases:
            return {"overall_percentage": 0, "status": "not_started"}
        
        # Calculate phase-based progress
        total_phases = len(phases)
        completed_phases = len([p for p in phases if p["status"] == "completed"])
        in_progress_phases = len([p for p in phases if p["status"] == "in_progress"])
        
        # Basic calculation
        phase_progress = (completed_phases / total_phases) * 100
        
        # Adjust for in-progress phases (assume 50% completion)
        if in_progress_phases > 0:
            phase_progress += (in_progress_phases * 0.5 / total_phases) * 100
        
        # Calculate days elapsed and estimated completion
        project_start = datetime.fromisoformat(data["project_start"])
        days_elapsed = (datetime.now(timezone.utc) - project_start).days
        
        total_estimated_days = sum(p.get("estimated_duration_days", 0) for p in phases)
        estimated_completion_date = project_start + timedelta(days=total_estimated_days)
        
        return {
            "overall_percentage": min(100, round(phase_progress, 1)),
            "completed_phases": completed_phases,
            "total_phases": total_phases,
            "days_elapsed": days_elapsed,
            "total_estimated_days": total_estimated_days,
            "estimated_completion": estimated_completion_date.isoformat(),
            "milestone_count": len(milestones),
            "current_phase": self.get_current_phase(),
            "is_on_schedule": days_elapsed <= (phase_progress / 100) * total_estimated_days + 2  # 2-day buffer
        }
    
    def generate_progress_report(self) -> str:
        """Generate a comprehensive progress report."""
        data = self._read_timeline()
        progress = self.calculate_project_progress()
        
        report = f"""# Borg-Tools MVP Progress Report
*Generated on {datetime.now().strftime('%Y-%m-%d at %H:%M UTC')}*

## Executive Summary

**Overall Progress: {progress['overall_percentage']}%**

- **Phases Completed:** {progress['completed_phases']}/{progress['total_phases']}
- **Days Elapsed:** {progress['days_elapsed']} / {progress['total_estimated_days']} estimated
- **Milestones Achieved:** {progress['milestone_count']}
- **Schedule Status:** {'✅ On Track' if progress['is_on_schedule'] else '⚠️ Behind Schedule'}

"""
        
        # Current phase
        current_phase = progress.get('current_phase')
        if current_phase:
            report += f"""## Current Focus: {current_phase['name']}

{current_phase['description']}

**Tasks in this phase:**
"""
            for task in current_phase.get('tasks', []):
                report += f"- {task}\n"
            report += "\n"
        
        # Phase progress
        report += "## Phase Breakdown\n\n"
        for phase in data.get('phases', []):
            status_emoji = {
                'completed': '✅',
                'in_progress': '🔄',
                'pending': '⏳',
                'blocked': '🚫'
            }.get(phase['status'], '❓')
            
            report += f"### {status_emoji} {phase['name']}\n"
            report += f"*Status: {phase['status'].title()}*\n\n"
            report += f"{phase['description']}\n\n"
            
            if phase['status'] == 'completed' and 'completed_at' in phase:
                completed_date = datetime.fromisoformat(phase['completed_at']).strftime('%Y-%m-%d')
                report += f"**Completed:** {completed_date}\n\n"
        
        # Recent milestones
        milestones = data.get('milestones', [])
        if milestones:
            recent_milestones = sorted(milestones, key=lambda x: x['timestamp'], reverse=True)[:5]
            report += "## Recent Milestones\n\n"
            
            for milestone in recent_milestones:
                date = datetime.fromisoformat(milestone['timestamp']).strftime('%Y-%m-%d')
                impact_emoji = {
                    'critical': '🚀',
                    'high': '⭐',
                    'medium': '🎯',
                    'low': '📌'
                }.get(milestone['impact_level'], '📌')
                
                report += f"### {impact_emoji} {milestone['title']}\n"
                report += f"*{date} - {milestone['achievement_type'].title()}*\n\n"
                report += f"{milestone['description']}\n\n"
        
        # Key metrics status
        metrics = data.get('key_metrics', {})
        if metrics:
            report += "## Quality & Performance Targets\n\n"
            
            performance = metrics.get('target_performance', {})
            quality = metrics.get('quality_gates', {})
            
            if performance:
                report += "**Performance Targets:**\n"
                for metric, target in performance.items():
                    report += f"- {metric.replace('_', ' ').title()}: {target}\n"
                report += "\n"
            
            if quality:
                report += "**Quality Gates:**\n"
                for gate, requirement in quality.items():
                    report += f"- {gate.replace('_', ' ').title()}: {requirement}\n"
                report += "\n"
        
        # Next priorities
        report += "## Next Priorities\n\n"
        if current_phase:
            report += f"**Immediate:** Complete {current_phase['name']} phase\n\n"
            for task in current_phase.get('tasks', [])[:3]:  # Show first 3 tasks
                report += f"- {task}\n"
        
        report += f"\n**Estimated Completion:** {datetime.fromisoformat(progress['estimated_completion']).strftime('%Y-%m-%d')}\n\n"
        
        return report
    
    def export_timeline_visual(self) -> str:
        """Export timeline as ASCII art visualization."""
        data = self._read_timeline()
        phases = data.get('phases', [])
        
        visual = "\n# Project Timeline Visualization\n\n"
        visual += "```\n"
        
        total_width = 60
        completed_phases = len([p for p in phases if p['status'] == 'completed'])
        total_phases = len(phases)
        
        # Progress bar
        progress_chars = int((completed_phases / total_phases) * total_width) if total_phases > 0 else 0
        progress_bar = '█' * progress_chars + '░' * (total_width - progress_chars)
        
        visual += f"Progress: [{progress_bar}] {completed_phases}/{total_phases} phases\n\n"
        
        # Timeline
        visual += "Timeline:\n"
        for i, phase in enumerate(phases):
            status_char = {
                'completed': '✓',
                'in_progress': '●',
                'pending': '○',
                'blocked': '✗'
            }.get(phase['status'], '?')
            
            connector = '├─' if i < len(phases) - 1 else '└─'
            visual += f"{connector} {status_char} {phase['name']}\n"
            if i < len(phases) - 1:
                visual += "│\n"
        
        visual += "```\n\n"
        return visual

def main():
    """CLI interface for timeline manager."""
    if len(sys.argv) < 2:
        print("Usage: python timeline-manager.py <command> [args...]")
        print("Commands:")
        print("  milestone <title> <description> <phase_id> [type] [impact]")
        print("  phase-status <phase_id> <status> [completion_%]")
        print("  progress - Show current progress")
        print("  report - Generate full progress report")
        print("  visual - Show ASCII timeline")
        return
    
    manager = TimelineManager()
    command = sys.argv[1]
    
    if command == "milestone":
        if len(sys.argv) < 5:
            print("Usage: milestone <title> <description> <phase_id> [type] [impact]")
            return
        
        title = sys.argv[2]
        description = sys.argv[3] 
        phase_id = sys.argv[4]
        achievement_type = sys.argv[5] if len(sys.argv) > 5 else "feature"
        impact_level = sys.argv[6] if len(sys.argv) > 6 else "medium"
        
        manager.add_milestone(title, description, phase_id, achievement_type, impact_level)
    
    elif command == "phase-status":
        if len(sys.argv) < 4:
            print("Usage: phase-status <phase_id> <status> [completion_%]")
            return
        
        phase_id = sys.argv[2]
        status = sys.argv[3]
        completion = int(sys.argv[4]) if len(sys.argv) > 4 else None
        
        manager.update_phase_status(phase_id, status, completion)
    
    elif command == "progress":
        progress = manager.calculate_project_progress()
        print(f"Overall Progress: {progress['overall_percentage']}%")
        print(f"Current Phase: {progress['current_phase']['name'] if progress['current_phase'] else 'None'}")
        print(f"Schedule Status: {'On Track' if progress['is_on_schedule'] else 'Behind Schedule'}")
    
    elif command == "report":
        report = manager.generate_progress_report()
        print(report)
    
    elif command == "visual":
        visual = manager.export_timeline_visual()
        print(visual)
    
    else:
        print(f"Unknown command: {command}")

if __name__ == "__main__":
    main()