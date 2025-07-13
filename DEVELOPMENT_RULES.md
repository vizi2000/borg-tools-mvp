# 🛡️ Development Rules & Standards

## Mandatory E2E Testing Protocol

### ⚠️ **CRITICAL RULE**: Every task completion MUST include comprehensive E2E testing

**Before marking any task as complete, you MUST:**

1. **Run the E2E test suite**:
   ```bash
   # Simple tests (mandatory for all tasks)
   npm run test:e2e:simple
   
   # Full tests (for major features)
   npm run test:e2e:full
   
   # Debug mode (for development)
   npm run test:e2e:debug
   ```

2. **Review the generated test report**:
   ```bash
   npm run e2e:report
   ```

3. **Fix ALL critical and high-priority bugs** before proceeding

4. **Document any medium/low priority bugs** in the project backlog

### Test Categories

#### **Simple Tests** (Required for ALL tasks)
- Landing page functionality
- Basic navigation
- Visual elements validation
- Accessibility compliance
- Mobile responsiveness

#### **Full Tests** (Required for major features)
- Complete user journeys
- Authentication flows
- CV generation process
- Theme switching
- Error handling
- Performance metrics

### Bug Severity Guidelines

| Severity | Description | Action Required |
|----------|-------------|-----------------|
| **Critical** | Breaks core functionality | Must fix immediately |
| **High** | Significantly impacts UX | Must fix before release |
| **Medium** | Minor UX issues | Fix in next sprint |
| **Low** | Polish/enhancement items | Add to backlog |

---

## Code Quality Standards

### TypeScript Requirements
- **Strict mode enabled**: No `any` types allowed
- **Interface definitions**: All API responses and props typed
- **Error handling**: Proper try/catch with typed errors
- **Null safety**: All potentially undefined values handled

### Component Standards
- **Single responsibility**: One component per file
- **Data attributes**: All interactive elements must have `data-testid`
- **Accessibility**: WCAG 2.1 AA compliance mandatory
- **Performance**: Lazy loading for non-critical components

### API Standards
- **Error responses**: Consistent error format with user-friendly messages
- **Input validation**: Zod schemas for all request bodies
- **Rate limiting**: Implemented on all public endpoints
- **Documentation**: OpenAPI specs for all endpoints

---

## Git & Deployment Rules

### Branch Protection
- **Main branch**: Direct pushes forbidden
- **Pull requests**: Required with ≥1 approval
- **Status checks**: All tests must pass
- **E2E tests**: Must pass before merge

### Commit Standards
```
type(scope): description

feat(auth): add GitHub OAuth integration
fix(cv): resolve PDF generation timeout
test(e2e): add comprehensive landing page tests
docs(api): update CV generation endpoint specs
```

### Pre-deployment Checklist
- [ ] E2E tests passing
- [ ] Type checking clean (`npm run typecheck`)
- [ ] Linting clean (`npm run lint`)
- [ ] Performance budgets met
- [ ] Accessibility audit passed
- [ ] Security scan completed

---

## Testing Architecture

### Test File Structure
```
tests/
├── e2e/
│   ├── config/
│   │   └── puppeteer.config.ts     # Test configuration
│   ├── utils/
│   │   ├── test-helpers.ts         # Testing utilities
│   │   └── report-generator.ts     # Report generation
│   ├── simple-test.ts              # Basic functionality tests
│   ├── full-site-test.ts          # Comprehensive test suite
│   └── tsconfig.json
├── unit/
│   └── [component-name].test.tsx
└── integration/
    └── [api-endpoint].test.ts
```

### Test Data Management
- **Mock data**: Centralized in `tests/fixtures/`
- **Environment**: Use `TEST_BASE_URL` for different environments
- **Cleanup**: All tests must clean up after themselves
- **Isolation**: Tests must be independent and runnable in any order

---

## Accessibility Requirements

### Mandatory Standards
- **Keyboard navigation**: All interactive elements accessible via keyboard
- **Screen readers**: Proper ARIA labels and roles
- **Color contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Focus indicators**: Visible focus states for all interactive elements
- **Image alt text**: Descriptive alt text for all images

### Testing Tools
- **axe-core**: Automated accessibility testing
- **Puppeteer**: Programmatic accessibility checks
- **Manual testing**: Keyboard-only navigation testing
- **Screen reader testing**: VoiceOver/NVDA compatibility

---

## Performance Standards

### Core Web Vitals
- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Contentful Paint (FCP)**: < 1.8s

### Bundle Size Limits
- **Initial bundle**: < 200KB gzipped
- **Route chunks**: < 50KB gzipped
- **Third-party libraries**: Justified and tree-shaken
- **Images**: Optimized with Next.js Image component

### Monitoring
- **Performance budgets**: Enforced in CI/CD
- **Real User Monitoring**: Vercel Analytics integration
- **Lighthouse CI**: Automated performance testing
- **Bundle analyzer**: Regular bundle size audits

---

## Security Standards

### Authentication & Authorization
- **Token management**: Secure storage and rotation
- **Input validation**: All user inputs sanitized
- **CORS**: Proper configuration for API endpoints
- **Rate limiting**: Protection against abuse

### Data Protection
- **PII handling**: Minimal collection and secure storage
- **API secrets**: Environment variables only
- **HTTPS**: Enforced in production
- **Headers**: Security headers properly configured

### Vulnerability Management
- **Dependency scanning**: Automated with npm audit
- **SAST**: Static analysis security testing
- **Security headers**: CSP, HSTS, etc.
- **Regular updates**: Dependencies kept current

---

## Monitoring & Alerting

### Application Monitoring
- **Error tracking**: Sentry integration for error monitoring
- **Performance monitoring**: Real-time performance metrics
- **Uptime monitoring**: 99.9% availability target
- **User analytics**: Privacy-compliant user behavior tracking

### CI/CD Pipeline
- **Build status**: All builds must pass
- **Test coverage**: Minimum 80% for new code
- **Security scans**: Automated vulnerability scanning
- **Performance budgets**: Enforced in build process

---

## Documentation Requirements

### Code Documentation
- **API documentation**: OpenAPI specs with examples
- **Component documentation**: Storybook for UI components
- **Architecture docs**: High-level system design
- **Deployment guides**: Step-by-step deployment instructions

### User Documentation
- **User guides**: Comprehensive feature documentation
- **API documentation**: For integration partners
- **Troubleshooting**: Common issues and solutions
- **Changelog**: All changes documented with migration guides

---

## Incident Response

### Bug Classification
1. **P0 (Critical)**: System down, data loss, security breach
2. **P1 (High)**: Major feature broken, significant user impact
3. **P2 (Medium)**: Minor feature issues, workaround available
4. **P3 (Low)**: Cosmetic issues, feature requests

### Response Timeline
- **P0**: Immediate response, fix within 2 hours
- **P1**: Response within 4 hours, fix within 24 hours
- **P2**: Response within 24 hours, fix within 1 week
- **P3**: Response within 1 week, fix in next release

### Post-Incident
- **Root cause analysis**: For P0 and P1 incidents
- **Process improvements**: Update procedures to prevent recurrence
- **Communication**: Transparent status page updates
- **Learning**: Share learnings with the team

---

## Team Collaboration

### Code Reviews
- **Review all PRs**: No code merged without review
- **Focus areas**: Logic, security, performance, accessibility
- **Constructive feedback**: Suggest improvements, not just problems
- **Knowledge sharing**: Use reviews for team learning

### Communication
- **Stand-ups**: Daily progress and blocker discussions
- **Documentation**: All decisions documented in ADRs
- **Async updates**: Regular progress updates in shared channels
- **Knowledge base**: Maintain up-to-date technical documentation

---

## Continuous Improvement

### Regular Audits
- **Monthly**: Performance and accessibility audits
- **Quarterly**: Security assessments and dependency updates
- **Annually**: Architecture reviews and technology assessments

### Metrics Review
- **Weekly**: Development velocity and quality metrics
- **Monthly**: User satisfaction and business metrics
- **Quarterly**: Technical debt assessment and planning

### Process Updates
- **Retrospectives**: Regular team retrospectives
- **Rule updates**: Rules updated based on learnings
- **Tool evaluation**: Regular evaluation of development tools
- **Best practices**: Continuous update of development practices

---

*These rules are living documents and should be updated based on team feedback and industry best practices.*