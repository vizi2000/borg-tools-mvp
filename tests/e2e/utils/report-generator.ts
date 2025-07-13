import fs from 'fs-extra';
import path from 'path';
import { TestContext, Bug, Screenshot, PerformanceMetric } from './test-helpers';
import { TEST_CONFIG } from '../config/puppeteer.config';

export async function generateHTMLReport(context: TestContext) {
  const reportPath = path.join(TEST_CONFIG.reportDir, 'test-report.html');
  const timestamp = new Date().toISOString();
  
  // Calculate bug statistics
  const bugStats = {
    critical: context.bugs.filter(b => b.severity === 'critical').length,
    high: context.bugs.filter(b => b.severity === 'high').length,
    medium: context.bugs.filter(b => b.severity === 'medium').length,
    low: context.bugs.filter(b => b.severity === 'low').length,
    total: context.bugs.length,
  };
  
  // Group bugs by type
  const bugsByType = context.bugs.reduce((acc, bug) => {
    acc[bug.type] = (acc[bug.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Borg-Tools MVP - Comprehensive Test Report</title>
    <style>
        :root {
            --bg-primary: #0d0d0d;
            --bg-secondary: #1a1a1a;
            --bg-tertiary: #262626;
            --text-primary: #ffffff;
            --text-secondary: #b3b3b3;
            --accent-neon: #39ff14;
            --accent-error: #ff3939;
            --accent-warning: #ff9514;
            --accent-info: #1439ff;
            --shadow-neon: 0 0 20px rgba(57, 255, 20, 0.5);
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            line-height: 1.6;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        .header {
            text-align: center;
            margin-bottom: 3rem;
            padding: 2rem;
            background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
            border-radius: 12px;
            border: 1px solid rgba(57, 255, 20, 0.3);
        }
        
        .header h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            background: linear-gradient(135deg, var(--accent-neon) 0%, #14ff8f 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-shadow: var(--shadow-neon);
        }
        
        .header .subtitle {
            color: var(--text-secondary);
            font-size: 1.2rem;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 3rem;
        }
        
        .summary-card {
            background: var(--bg-secondary);
            padding: 1.5rem;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
        }
        
        .summary-card:hover {
            transform: translateY(-4px);
            border-color: var(--accent-neon);
            box-shadow: var(--shadow-neon);
        }
        
        .summary-card h3 {
            font-size: 0.9rem;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 0.5rem;
        }
        
        .summary-card .value {
            font-size: 2.5rem;
            font-weight: 700;
            color: var(--accent-neon);
        }
        
        .severity-badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .severity-critical {
            background: var(--accent-error);
            color: white;
        }
        
        .severity-high {
            background: var(--accent-warning);
            color: white;
        }
        
        .severity-medium {
            background: #ffd814;
            color: var(--bg-primary);
        }
        
        .severity-low {
            background: var(--accent-info);
            color: white;
        }
        
        .section {
            margin-bottom: 3rem;
        }
        
        .section-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid var(--bg-tertiary);
        }
        
        .section-header h2 {
            font-size: 2rem;
            color: var(--accent-neon);
        }
        
        .bug-card {
            background: var(--bg-secondary);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            position: relative;
            overflow: hidden;
        }
        
        .bug-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 100%;
            background: var(--accent-error);
        }
        
        .bug-card.severity-critical::before { background: var(--accent-error); }
        .bug-card.severity-high::before { background: var(--accent-warning); }
        .bug-card.severity-medium::before { background: #ffd814; }
        .bug-card.severity-low::before { background: var(--accent-info); }
        
        .bug-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1rem;
        }
        
        .bug-title {
            font-size: 1.2rem;
            font-weight: 600;
        }
        
        .bug-meta {
            display: flex;
            gap: 1rem;
            color: var(--text-secondary);
            font-size: 0.9rem;
            margin-bottom: 1rem;
        }
        
        .bug-description {
            margin-bottom: 1rem;
            line-height: 1.8;
        }
        
        .bug-details {
            background: var(--bg-tertiary);
            border-radius: 6px;
            padding: 1rem;
            margin-bottom: 1rem;
        }
        
        .bug-details h4 {
            color: var(--accent-neon);
            margin-bottom: 0.5rem;
            font-size: 0.9rem;
            text-transform: uppercase;
        }
        
        .bug-steps {
            list-style: none;
            counter-reset: step-counter;
        }
        
        .bug-steps li {
            counter-increment: step-counter;
            position: relative;
            padding-left: 2rem;
            margin-bottom: 0.5rem;
        }
        
        .bug-steps li::before {
            content: counter(step-counter);
            position: absolute;
            left: 0;
            top: 0;
            width: 1.5rem;
            height: 1.5rem;
            background: var(--accent-neon);
            color: var(--bg-primary);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8rem;
            font-weight: 700;
        }
        
        .screenshot-gallery {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-top: 2rem;
        }
        
        .screenshot-card {
            background: var(--bg-secondary);
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
        }
        
        .screenshot-card:hover {
            transform: scale(1.02);
            border-color: var(--accent-neon);
        }
        
        .screenshot-card img {
            width: 100%;
            height: 200px;
            object-fit: cover;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .screenshot-info {
            padding: 1rem;
        }
        
        .screenshot-title {
            font-weight: 600;
            margin-bottom: 0.5rem;
        }
        
        .screenshot-meta {
            color: var(--text-secondary);
            font-size: 0.85rem;
        }
        
        .performance-chart {
            background: var(--bg-secondary);
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
        }
        
        .metric-bar {
            margin-bottom: 1rem;
        }
        
        .metric-label {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5rem;
            font-size: 0.9rem;
        }
        
        .metric-progress {
            height: 8px;
            background: var(--bg-tertiary);
            border-radius: 4px;
            overflow: hidden;
        }
        
        .metric-fill {
            height: 100%;
            background: var(--accent-neon);
            transition: width 0.5s ease;
        }
        
        .recommendations {
            background: linear-gradient(135deg, rgba(57, 255, 20, 0.1) 0%, rgba(20, 255, 143, 0.1) 100%);
            border: 1px solid var(--accent-neon);
            border-radius: 8px;
            padding: 2rem;
            margin-top: 3rem;
        }
        
        .recommendations h3 {
            color: var(--accent-neon);
            margin-bottom: 1.5rem;
            font-size: 1.5rem;
        }
        
        .recommendations ul {
            list-style: none;
        }
        
        .recommendations li {
            padding-left: 2rem;
            margin-bottom: 1rem;
            position: relative;
        }
        
        .recommendations li::before {
            content: '→';
            position: absolute;
            left: 0;
            color: var(--accent-neon);
            font-weight: 700;
        }
        
        .footer {
            text-align: center;
            padding: 2rem;
            margin-top: 4rem;
            border-top: 1px solid var(--bg-tertiary);
            color: var(--text-secondary);
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 1rem;
            }
            
            .header h1 {
                font-size: 2rem;
            }
            
            .summary-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
        
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
        }
        
        .modal-content {
            margin: 5% auto;
            display: block;
            max-width: 90%;
            max-height: 90%;
        }
        
        .close {
            position: absolute;
            top: 2rem;
            right: 2rem;
            color: var(--text-primary);
            font-size: 2rem;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>Borg-Tools MVP Test Report</h1>
            <p class="subtitle">Comprehensive E2E Testing Results - ${new Date(timestamp).toLocaleString()}</p>
        </header>
        
        <div class="summary-grid">
            <div class="summary-card">
                <h3>Total Bugs Found</h3>
                <div class="value">${bugStats.total}</div>
            </div>
            <div class="summary-card">
                <h3>Critical Issues</h3>
                <div class="value" style="color: var(--accent-error)">${bugStats.critical}</div>
            </div>
            <div class="summary-card">
                <h3>High Priority</h3>
                <div class="value" style="color: var(--accent-warning)">${bugStats.high}</div>
            </div>
            <div class="summary-card">
                <h3>Screenshots Captured</h3>
                <div class="value">${context.screenshots.length}</div>
            </div>
        </div>
        
        <section class="section">
            <div class="section-header">
                <h2>🐛 Bugs & Issues</h2>
                <div>
                    <span class="severity-badge severity-critical">${bugStats.critical} Critical</span>
                    <span class="severity-badge severity-high">${bugStats.high} High</span>
                    <span class="severity-badge severity-medium">${bugStats.medium} Medium</span>
                    <span class="severity-badge severity-low">${bugStats.low} Low</span>
                </div>
            </div>
            
            ${context.bugs.map(bug => `
                <div class="bug-card severity-${bug.severity}">
                    <div class="bug-header">
                        <h3 class="bug-title">${bug.description}</h3>
                        <span class="severity-badge severity-${bug.severity}">${bug.severity}</span>
                    </div>
                    
                    <div class="bug-meta">
                        <span>🏷️ ${bug.type}</span>
                        <span>🕐 ${new Date(bug.timestamp).toLocaleTimeString()}</span>
                        ${bug.element ? `<span>🎯 ${bug.element}</span>` : ''}
                    </div>
                    
                    <div class="bug-details">
                        <h4>Steps to Reproduce</h4>
                        <ol class="bug-steps">
                            ${bug.steps.map(step => `<li>${step}</li>`).join('')}
                        </ol>
                    </div>
                    
                    <div class="bug-details">
                        <h4>Expected vs Actual</h4>
                        <p><strong>Expected:</strong> ${bug.expectedBehavior}</p>
                        <p><strong>Actual:</strong> ${bug.actualBehavior}</p>
                    </div>
                    
                    <div class="bug-details" style="background: rgba(57, 255, 20, 0.1); border: 1px solid var(--accent-neon);">
                        <h4>💡 Recommendation</h4>
                        <p>${bug.recommendation}</p>
                    </div>
                    
                    ${bug.screenshot ? `
                        <div style="margin-top: 1rem;">
                            <img src="screenshots/${path.basename(bug.screenshot)}" 
                                 alt="Bug screenshot" 
                                 style="max-width: 100%; border-radius: 6px; cursor: pointer;"
                                 onclick="openModal(this.src)">
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </section>
        
        <section class="section">
            <div class="section-header">
                <h2>📸 Screenshots</h2>
            </div>
            
            <div class="screenshot-gallery">
                ${context.screenshots.map(screenshot => `
                    <div class="screenshot-card">
                        <img src="screenshots/${path.basename(screenshot.path)}" 
                             alt="${screenshot.stepName}"
                             onclick="openModal(this.src)">
                        <div class="screenshot-info">
                            <div class="screenshot-title">${screenshot.stepName}</div>
                            <div class="screenshot-meta">${new Date(screenshot.timestamp).toLocaleTimeString()}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </section>
        
        <section class="section">
            <div class="section-header">
                <h2>⚡ Performance Metrics</h2>
            </div>
            
            ${context.performanceMetrics.map(metric => `
                <div class="performance-chart">
                    <h3>${metric.page}</h3>
                    <div class="metric-bar">
                        <div class="metric-label">
                            <span>First Contentful Paint</span>
                            <span>${metric.metrics.FCP.toFixed(0)}ms</span>
                        </div>
                        <div class="metric-progress">
                            <div class="metric-fill" style="width: ${Math.min(100, (metric.metrics.FCP / 3000) * 100)}%"></div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </section>
        
        <section class="recommendations">
            <h3>🚀 Key Recommendations for Product Team</h3>
            <ul>
                ${generateRecommendations(context)}
            </ul>
        </section>
        
        <div class="footer">
            <p>Generated by Borg-Tools Automated Testing Suite</p>
            <p>Test Duration: ${Math.round((Date.now() - new Date(context.screenshots[0]?.timestamp || Date.now()).getTime()) / 1000)}s</p>
        </div>
    </div>
    
    <div id="imageModal" class="modal" onclick="closeModal()">
        <span class="close">&times;</span>
        <img class="modal-content" id="modalImage">
    </div>
    
    <script>
        function openModal(src) {
            document.getElementById('imageModal').style.display = 'block';
            document.getElementById('modalImage').src = src;
        }
        
        function closeModal() {
            document.getElementById('imageModal').style.display = 'none';
        }
        
        // Animate metrics on load
        window.addEventListener('load', () => {
            const fills = document.querySelectorAll('.metric-fill');
            fills.forEach((fill, index) => {
                setTimeout(() => {
                    fill.style.width = fill.style.width;
                }, index * 100);
            });
        });
    </script>
</body>
</html>
  `;
  
  await fs.writeFile(reportPath, html);
  console.log(`\n📄 Test report generated: ${reportPath}`);
  
  // Also generate a JSON report for CI/CD integration
  const jsonReport = {
    timestamp,
    summary: {
      totalBugs: bugStats.total,
      criticalBugs: bugStats.critical,
      highBugs: bugStats.high,
      mediumBugs: bugStats.medium,
      lowBugs: bugStats.low,
      totalScreenshots: context.screenshots.length,
      performanceMetrics: context.performanceMetrics.length,
    },
    bugs: context.bugs,
    bugsByType,
    screenshots: context.screenshots.map(s => ({
      ...s,
      path: path.basename(s.path),
    })),
    performanceMetrics: context.performanceMetrics,
    recommendations: generateRecommendationsArray(context),
  };
  
  await fs.writeJson(
    path.join(TEST_CONFIG.reportDir, 'test-report.json'),
    jsonReport,
    { spaces: 2 }
  );
}

function generateRecommendations(context: TestContext): string {
  const recommendations = generateRecommendationsArray(context);
  return recommendations.map(rec => `<li>${rec}</li>`).join('');
}

function generateRecommendationsArray(context: TestContext): string[] {
  const recommendations: string[] = [];
  
  // Critical issues recommendations
  const criticalCount = context.bugs.filter(b => b.severity === 'critical').length;
  if (criticalCount > 0) {
    recommendations.push(`🚨 Address ${criticalCount} critical issues immediately - these are blocking core functionality`);
  }
  
  // Authentication recommendations
  const authBugs = context.bugs.filter(b => b.type === 'Authentication' || b.type === 'Missing Authentication');
  if (authBugs.length > 0) {
    recommendations.push('🔐 Strengthen authentication flow - implement proper OAuth2 with refresh tokens');
  }
  
  // Performance recommendations
  const perfBugs = context.bugs.filter(b => b.type === 'Performance');
  if (perfBugs.length > 0) {
    recommendations.push('⚡ Optimize performance - implement code splitting, lazy loading, and CDN for static assets');
  }
  
  // Accessibility recommendations
  const a11yBugs = context.bugs.filter(b => b.type === 'Accessibility');
  if (a11yBugs.length > 0) {
    recommendations.push('♿ Improve accessibility - ensure WCAG 2.1 AA compliance for better user reach');
  }
  
  // UI/UX recommendations
  const uiBugs = context.bugs.filter(b => b.type === 'UI/UX' || b.type === 'Missing Feature');
  if (uiBugs.length > 3) {
    recommendations.push('🎨 Enhance user experience - conduct user testing and implement feedback mechanisms');
  }
  
  // Error handling recommendations
  const errorBugs = context.bugs.filter(b => b.type === 'Error Handling');
  if (errorBugs.length > 0) {
    recommendations.push('🛡️ Implement comprehensive error boundaries and user-friendly error messages');
  }
  
  // Mobile recommendations
  const responsiveBugs = context.bugs.filter(b => b.type === 'Responsive Design');
  if (responsiveBugs.length > 0) {
    recommendations.push('📱 Prioritize mobile-first design - over 60% of users access via mobile devices');
  }
  
  // Business recommendations
  recommendations.push('💼 Add analytics tracking to understand user behavior and conversion funnel');
  recommendations.push('🔄 Implement A/B testing framework for data-driven feature decisions');
  recommendations.push('💰 Consider freemium model with premium features (custom templates, API access)');
  recommendations.push('🌍 Add internationalization support to expand to global markets');
  recommendations.push('🤝 Build integration marketplace for third-party services (Slack, Teams, etc.)');
  
  return recommendations;
}