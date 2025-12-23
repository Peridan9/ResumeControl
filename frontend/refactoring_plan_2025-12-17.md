# Frontend Refactoring Plan - December 17, 2025

## Overview

This document outlines the refactoring plan based on the code review conducted on December 17, 2025. All issues have been created in Linear under the **ResumeControl** project with the label **frontend-review-v1**.

## Parallel Work Strategy

The issues have been structured to maximize parallel work opportunities. Multiple agents can work simultaneously on different areas without conflicts.

## Issue Breakdown by Category

### 🟢 Phase 1: Foundation (Can Start Immediately - All Parallel)

These 4 issues can all be worked on simultaneously as they don't depend on each other:

1. **PER-54**: Create constants directory and extract shared values
2. **PER-55**: Create hooks directory and extract common patterns
3. **PER-56**: Add error boundary component
4. **PER-57**: Consolidate API utilities

**Parallel Work**: ✅ All 4 can be done simultaneously

---

### 🟡 Phase 2: Component Refactoring (Can Start After Phase 1)

These can be done in parallel once foundation is ready:

5. **PER-58**: Split Dashboard component into smaller components
   - **Depends on**: PER-54 (constants)
   - **Can parallel with**: PER-59, PER-60, PER-61

6. **PER-59**: Split ApplicationDetail component
   - **Depends on**: PER-55 (hooks directory)
   - **Can parallel with**: PER-58, PER-60, PER-61

7. **PER-60**: Extract ApplicationForm logic into custom hook
   - **Depends on**: PER-55 (hooks directory, specifically useFormDraft)
   - **Can parallel with**: PER-58, PER-59, PER-61

8. **PER-61**: Create shared UI components (StatusBadge, LoadingState, ErrorMessage)
   - **Depends on**: PER-54 (constants for status colors)
   - **Can parallel with**: PER-58, PER-59, PER-60

**Parallel Work**: ✅ All 4 can be done simultaneously after Phase 1

---

### 🔵 Phase 3: State & Data Management (Can Start Independently)

These can be done in parallel with Phase 2:

9. **PER-62**: Create useToast hook for notifications
   - **Depends on**: None
   - **Can parallel with**: All Phase 3 issues

10. **PER-63**: Add API response normalization layer
    - **Depends on**: None
    - **Can parallel with**: All Phase 3 issues

11. **PER-64**: Implement optimistic updates for mutations
    - **Depends on**: None
    - **Can parallel with**: All Phase 3 issues

12. **PER-65**: Fix token refresh race condition
    - **Depends on**: None (but related to PER-57)
    - **Can parallel with**: All Phase 3 issues

13. **PER-66**: Fix ThemeContext localStorage updates
    - **Depends on**: None
    - **Can parallel with**: All issues

**Parallel Work**: ✅ All 5 can be done simultaneously

---

### 🟣 Phase 4: Utilities & Infrastructure (Can Start Independently)

These can be done in parallel with any phase:

14. **PER-67**: Add route-based code splitting
    - **Depends on**: None
    - **Can parallel with**: All issues

15. **PER-68**: Extract date formatting utilities
    - **Depends on**: None
    - **Can parallel with**: All issues

16. **PER-69**: Add React Query DevTools
    - **Depends on**: None
    - **Can parallel with**: All issues

**Parallel Work**: ✅ All 3 can be done simultaneously

---

### 🟠 Phase 5: UX & Polish (Can Start Independently)

These can be done in parallel:

17. **PER-70**: Standardize confirmation dialogs
    - **Depends on**: None
    - **Can parallel with**: All issues

18. **PER-71**: Improve accessibility (ARIA labels, keyboard navigation)
    - **Depends on**: None
    - **Can parallel with**: All issues

19. **PER-72**: Add debouncing to search inputs
    - **Depends on**: PER-55 (useDebounce hook)
    - **Can parallel with**: PER-70, PER-71, PER-73

20. **PER-73**: Review and fix useEffect dependencies
    - **Depends on**: None
    - **Can parallel with**: All issues

**Parallel Work**: ✅ PER-70, PER-71, PER-73 can be done immediately; PER-72 after PER-55

---

## Recommended Workflow for Multiple Agents

### Week 1-2: Foundation (4 Agents)
- **Agent 1**: PER-54 (Constants)
- **Agent 2**: PER-55 (Hooks)
- **Agent 3**: PER-56 (Error Boundary)
- **Agent 4**: PER-57 (API Consolidation)

### Week 2-3: Component Refactoring (4 Agents)
- **Agent 1**: PER-58 (Dashboard)
- **Agent 2**: PER-59 (ApplicationDetail)
- **Agent 3**: PER-60 (ApplicationForm)
- **Agent 4**: PER-61 (Shared UI Components)

### Week 3-4: State & Data (5 Agents)
- **Agent 1**: PER-62 (Toast)
- **Agent 2**: PER-63 (API Normalization)
- **Agent 3**: PER-64 (Optimistic Updates)
- **Agent 4**: PER-65 (Token Refresh)
- **Agent 5**: PER-66 (ThemeContext)

### Week 4-5: Utilities & Polish (4 Agents)
- **Agent 1**: PER-67 (Code Splitting)
- **Agent 2**: PER-68 (Date Utils)
- **Agent 3**: PER-69 (DevTools)
- **Agent 4**: PER-70 (Confirmations)

### Week 5-6: Final Polish (3 Agents)
- **Agent 1**: PER-71 (Accessibility)
- **Agent 2**: PER-72 (Debouncing)
- **Agent 3**: PER-73 (useEffect Dependencies)

---

## Dependency Graph

```
Phase 1 (Foundation) - All Independent
├── PER-54 (Constants)
├── PER-55 (Hooks)
├── PER-56 (Error Boundary)
└── PER-57 (API Consolidation)

Phase 2 (Components) - After Phase 1
├── PER-58 (Dashboard) → depends on PER-54
├── PER-59 (ApplicationDetail) → depends on PER-55
├── PER-60 (ApplicationForm) → depends on PER-55
└── PER-61 (Shared UI) → depends on PER-54

Phase 3 (State/Data) - All Independent
├── PER-62 (Toast)
├── PER-63 (API Normalization)
├── PER-64 (Optimistic Updates)
├── PER-65 (Token Refresh)
└── PER-66 (ThemeContext)

Phase 4 (Utilities) - All Independent
├── PER-67 (Code Splitting)
├── PER-68 (Date Utils)
└── PER-69 (DevTools)

Phase 5 (UX/Polish) - Mostly Independent
├── PER-70 (Confirmations)
├── PER-71 (Accessibility)
├── PER-72 (Debouncing) → depends on PER-55
└── PER-73 (useEffect)
```

---

## Quick Reference: All Issues

| ID | Title | Phase | Dependencies | Can Parallel With |
|---|---|---|---|---|
| PER-54 | Create constants directory | 1 | None | PER-55, PER-56, PER-57 |
| PER-55 | Create hooks directory | 1 | None | PER-54, PER-56, PER-57 |
| PER-56 | Add error boundary | 1 | None | PER-54, PER-55, PER-57 |
| PER-57 | Consolidate API utilities | 1 | None | PER-54, PER-55, PER-56 |
| PER-58 | Split Dashboard component | 2 | PER-54 | PER-59, PER-60, PER-61 |
| PER-59 | Split ApplicationDetail | 2 | PER-55 | PER-58, PER-60, PER-61 |
| PER-60 | Extract ApplicationForm hook | 2 | PER-55 | PER-58, PER-59, PER-61 |
| PER-61 | Create shared UI components | 2 | PER-54 | PER-58, PER-59, PER-60 |
| PER-62 | Create useToast hook | 3 | None | All Phase 3 |
| PER-63 | Add API normalization | 3 | None | All Phase 3 |
| PER-64 | Implement optimistic updates | 3 | None | All Phase 3 |
| PER-65 | Fix token refresh race | 3 | None | All Phase 3 |
| PER-66 | Fix ThemeContext | 3 | None | All issues |
| PER-67 | Add code splitting | 4 | None | All issues |
| PER-68 | Extract date utilities | 4 | None | All issues |
| PER-69 | Add React Query DevTools | 4 | None | All issues |
| PER-70 | Standardize confirmations | 5 | None | PER-71, PER-73 |
| PER-71 | Improve accessibility | 5 | None | PER-70, PER-73 |
| PER-72 | Add debouncing | 5 | PER-55 | PER-70, PER-71, PER-73 |
| PER-73 | Fix useEffect dependencies | 5 | None | All issues |

---

## Success Metrics

After completing all issues:
- ✅ Reduced code duplication (constants, utilities centralized)
- ✅ Smaller, focused components (Dashboard <100 lines, ApplicationDetail <150 lines)
- ✅ Reusable hooks for common patterns
- ✅ Consistent UI patterns (status badges, loading states, errors)
- ✅ Better error handling (error boundary, toast notifications)
- ✅ Improved performance (code splitting, debouncing, memoization)
- ✅ Better developer experience (DevTools, normalized types)
- ✅ Enhanced accessibility (ARIA labels, keyboard navigation)

---

## Notes

- All issues are labeled with `frontend-review-v1` for easy filtering
- Each issue includes detailed tasks, acceptance criteria, and file lists
- Dependencies are clearly marked in each issue description
- Issues are structured to minimize merge conflicts
- Most issues can be worked on in parallel by different agents

---

*Plan created: December 17, 2025*
*Total Issues: 20*
*Estimated Timeline: 5-6 weeks with parallel work*


