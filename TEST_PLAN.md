# Regression & Acceptance Test Plan
## Deal Motivation Demo App

### Test Date: 2026-02-20
### Build: index-CkXAN4rY.js (627.70 kB)

---

## 🎯 Test Objective
Verify dropdown collapse functionality works correctly while ensuring no regression in existing features.

---

## 🔧 Changes Made
1. **Updated Select Component** (`src/components/ui/select.jsx`)
   - Added state management with `useState` for open/close toggle
   - Implemented proper `isOpen` state propagation
   - Added collapse/expand functionality on trigger click
   - SelectContent now conditionally renders based on `isOpen` state
   - Auto-closes dropdown after item selection

### Key Implementation Details:
```javascript
const [isOpen, setIsOpen] = React.useState(false)

// Toggle on trigger click
const handleClick = () => {
  setIsOpen && setIsOpen(!isOpen)
}

// Auto-close on item selection
onValueChange: (newValue) => {
  onValueChange && onValueChange(newValue)
  setIsOpen(false)
}

// Conditional rendering
if (!isOpen) return null
```

---

## 🧪 Test Cases

### Priority 1: Dropdown Functionality (NEW)
| Test ID | Test Case | Expected Result | Status |
|---------|-----------|----------------|---------|
| DD-01 | Click "Select step" dropdown trigger | Dropdown opens, shows list of journey steps | ⏳ Pending |
| DD-02 | Click "Select role" dropdown trigger | Dropdown opens, shows list of roles | ⏳ Pending |
| DD-03 | Select an item from step dropdown | Item is selected, dropdown closes | ⏳ Pending |
| DD-04 | Select an item from role dropdown | Item is selected, dropdown closes | ⏳ Pending |
| DD-05 | Click outside dropdown | Dropdown closes (if click-outside handler exists) | ⏳ Pending |
| DD-06 | Open step dropdown, then click trigger again | Dropdown closes (toggle behavior) | ⏳ Pending |
| DD-07 | Open role dropdown, then click trigger again | Dropdown closes (toggle behavior) | ⏳ Pending |

### Priority 2: Existing UI Components (REGRESSION)
| Test ID | Test Case | Expected Result | Status |
|---------|-----------|----------------|---------|
| UI-01 | Page loads without errors | No console errors, all components render | ⏳ Pending |
| UI-02 | Card components render | All cards display correctly | ⏳ Pending |
| UI-03 | Button clicks work | Prev/Next/Run buttons functional | ⏳ Pending |
| UI-04 | Input fields accept text | All input/textarea fields work | ⏳ Pending |
| UI-05 | Badges display correctly | RAG badges, stage badges show | ⏳ Pending |
| UI-06 | Tabs component switches | Tab navigation works | ⏳ Pending |
| UI-07 | Progress bar displays | Journey progress shows correctly | ⏳ Pending |
| UI-08 | Switch toggles | Auto-advance toggle works | ⏳ Pending |
| UI-09 | Alert messages display | Alert components render | ⏳ Pending |
| UI-10 | Icons render | All Lucide icons display | ⏳ Pending |

### Priority 3: Business Logic (REGRESSION)
| Test ID | Test Case | Expected Result | Status |
|---------|-----------|----------------|---------|
| BL-01 | Journey Narrator initializes | Shows Step 1 of 13 | ⏳ Pending |
| BL-02 | "Next" button advances step | Progress moves to next step | ⏳ Pending |
| BL-03 | "Prev" button goes back | Returns to previous step | ⏳ Pending |
| BL-04 | "Run this step" executes | Step actions trigger | ⏳ Pending |
| BL-05 | Role switching updates UI | UI changes based on role | ⏳ Pending |
| BL-06 | Deal data displays | Deal case info shows | ⏳ Pending |
| BL-07 | Stage badges update | RAG status reflects stage | ⏳ Pending |
| BL-08 | Auto-advance toggle | Auto-advance can be toggled | ⏳ Pending |

### Priority 4: Recharts Integration (REGRESSION)
| Test ID | Test Case | Expected Result | Status |
|---------|-----------|----------------|---------|
| RC-01 | Bar charts render | Pipeline charts display | ⏳ Pending |
| RC-02 | Line charts render | Cycle time charts display | ⏳ Pending |
| RC-03 | Chart tooltips work | Hover shows data points | ⏳ Pending |

### Priority 5: Data Flow (REGRESSION)
| Test ID | Test Case | Expected Result | Status |
|---------|-----------|----------------|---------|
| DF-01 | Reference data upload | Can upload reference data | ⏳ Pending |
| DF-02 | Deal intake form | Can fill deal details | ⏳ Pending |
| DF-03 | Financial model runs | Calculations execute | ⏳ Pending |
| DF-04 | Approval workflow | DoA process works | ⏳ Pending |
| DF-05 | Deployment QA | QA checks execute | ⏳ Pending |
| DF-06 | Task board updates | Tasks can be managed | ⏳ Pending |
| DF-07 | Dashboard exports | Can export data | ⏳ Pending |
| DF-08 | Audit log tracks | Actions are logged | ⏳ Pending |

---

## 🔍 Testing Approach

### Manual Testing Steps:
1. **Visual Inspection**
   - Open app in browser
   - Verify all components render correctly
   - Check for console errors

2. **Dropdown Interaction**
   - Click "Select step" dropdown
   - Verify dropdown expands
   - Select an item
   - Verify dropdown collapses
   - Repeat for "Select role" dropdown

3. **Navigation Testing**
   - Test Prev/Next buttons
   - Verify step progression
   - Test "Run this step" button

4. **Role Switching**
   - Switch between different roles
   - Verify UI updates appropriately

5. **Full Workflow**
   - Run through 2-3 complete journey steps
   - Verify all features work as expected

### Browser Console Check:
- Should see only: Tailwind CDN warning (expected)
- No other errors or warnings

---

## 📊 Test Results
(To be filled after testing)

### Summary:
- Total Tests: 35
- Passed: ___
- Failed: ___
- Skipped: ___
- Pass Rate: ___%

### Critical Issues Found:
(None expected - but will document any found)

### Non-Critical Issues:
- Tailwind CDN warning (expected, cosmetic only)
- Transient 404 error (does not affect functionality)

---

## ✅ Acceptance Criteria

### Must Pass (Blockers):
1. ✅ Build completes without errors
2. ⏳ Dropdown "Select step" opens and closes correctly
3. ⏳ Dropdown "Select role" opens and closes correctly
4. ⏳ Selecting items closes dropdown
5. ⏳ No new console errors introduced
6. ⏳ Journey Narrator functions correctly
7. ⏳ All buttons remain functional

### Should Pass (Important):
8. ⏳ Page loads within 20 seconds
9. ⏳ All UI components render correctly
10. ⏳ Role switching works
11. ⏳ Step navigation works
12. ⏳ Charts render properly

### Nice to Have (Enhancement):
13. ⏳ Dropdown closes on click-outside
14. ⏳ Keyboard navigation for dropdowns
15. ⏳ Smooth animations

---

## 🚀 Sign-off

**Ready for Production:** ⏳ PENDING TESTS

**Tested By:** System Test
**Date:** 2026-02-20
**Version:** index-CkXAN4rY.js

---

## 📝 Notes
- Original issue: Dropdowns were not collapsing (no toggle state)
- Root cause: Select component lacked state management
- Fix applied: Added React useState hook for open/close state
- Rebuild: Successful (627.70 kB)
- Server: Running on port 3000
