# SmartMatcher Component - Manual Test Guide

## Test Environment Setup

1. Start the development server:
```bash
cd frontend
npm run dev
```

2. Navigate to the demo page:
```
http://localhost:5173/smart-matcher-demo
```

## Test Cases

### ✅ Test 1: Component Renders
**Requirement:** 3.1, 3.2

**Steps:**
1. Open the SmartMatcher demo page
2. Verify the component loads without errors

**Expected Results:**
- Component displays without console errors
- Header shows "Smart GPU Matching"
- GPU count is displayed (e.g., "6 GPUs analyzed • 4 recommended")
- Sorting dropdown is visible

---

### ✅ Test 2: Compatibility Badges
**Requirement:** 3.2, 3.4

**Steps:**
1. Observe the GPU cards displayed
2. Check the badge colors and labels

**Expected Results:**
- RTX 4090: Green "Recommended" badge
- RTX 3090: Green "Recommended" or Cyan "Compatible" badge
- RTX 3080: Cyan "Compatible" badge
- RTX 3070: Yellow "Borderline" badge
- RTX 3060: Red "Insufficient" badge (6GB VRAM < 8GB required)
- Offline GPU: Grayed out with "Offline" status

---

### ✅ Test 3: Estimated Time and Cost Display
**Requirement:** 3.6, 3.7

**Steps:**
1. Look at each GPU card
2. Verify time and cost estimates are shown

**Expected Results:**
- Each card shows "Est. Time" (e.g., "2m", "3m", "5m 50s")
- Each card shows "Est. Cost" in QUBIC (e.g., "0.08 QUBIC", "0.15 QUBIC")
- Faster GPUs show shorter times
- More expensive GPUs show higher costs

---

### ✅ Test 4: Sorting Controls
**Requirement:** 3.5

**Steps:**
1. Click the "Sort by" dropdown
2. Select "Best Value" (default)
3. Verify GPUs are sorted by cost-benefit score
4. Select "Lowest Price"
5. Verify GPUs are sorted by cost (ascending)
6. Select "Fastest"
7. Verify GPUs are sorted by duration (ascending)
8. Select "Available Now"
9. Verify online GPUs appear first

**Expected Results:**
- Sorting changes the order of GPU cards
- "Best Value" shows highest cost-benefit score first
- "Lowest Price" shows cheapest option first
- "Fastest" shows quickest completion time first
- "Available Now" shows online GPUs first

---

### ✅ Test 5: Top 3 Recommendations
**Requirement:** 3.7

**Steps:**
1. Look for "Top Recommendations" section
2. Click "Show Comparison" button
3. Verify 3 GPUs are displayed side-by-side
4. Check for "TOP PICK" badge on first recommendation
5. Click "Hide Comparison"
6. Verify the section collapses

**Expected Results:**
- Top 3 section is visible
- Shows 3 best GPUs (excluding insufficient ones)
- First GPU has yellow "TOP PICK" badge
- Comparison view is toggleable
- GPUs are displayed in a grid layout

---

### ✅ Test 6: Warnings for Borderline GPUs
**Requirement:** 3.3

**Steps:**
1. Find the RTX 3070 card (borderline compatibility)
2. Look for warning messages

**Expected Results:**
- Yellow warning box is visible
- Warning icon (triangle) is shown
- Warning text explains the issue (e.g., "GPU VRAM is at minimum requirement")
- Text is readable and helpful

---

### ✅ Test 7: Insufficient GPU Disabled
**Requirement:** 3.4, 3.8

**Steps:**
1. Find the RTX 3060 card (insufficient VRAM)
2. Try to click on it
3. Observe the visual state

**Expected Results:**
- Card has reduced opacity (50%)
- Red "Insufficient" badge is shown
- Card has "cursor-not-allowed" cursor
- Clicking does nothing (no selection)
- Warning explains why it's insufficient

---

### ✅ Test 8: GPU Selection
**Requirement:** 3.8

**Steps:**
1. Click on a compatible GPU card (e.g., RTX 3090)
2. Observe visual feedback
3. Check the "Selected GPU" section at bottom
4. Click on a different GPU
5. Verify selection changes

**Expected Results:**
- Clicked card gets cyan border and ring
- Success toast notification appears
- "Selected GPU" section shows the chosen GPU
- Previous selection is deselected
- Only one GPU can be selected at a time

---

### ✅ Test 9: Cost-Benefit Score Display
**Requirement:** 3.5

**Steps:**
1. Look at the "Value Score" on each GPU card
2. Verify the progress bar matches the score

**Expected Results:**
- Score is displayed as "X/100"
- Progress bar fills to match the score
- High scores (≥70) show green bar
- Medium scores (40-69) show yellow bar
- Low scores (<40) show orange bar

---

### ✅ Test 10: GPU Specifications Display
**Requirement:** 3.6

**Steps:**
1. Check each GPU card for specifications
2. Verify all required information is shown

**Expected Results:**
- GPU model name is prominent
- VRAM amount is displayed (e.g., "24 GB")
- RAM amount is displayed (e.g., "64 GB")
- Price per hour is shown (e.g., "2.50 QUBIC/hr")
- Online/offline status is indicated with colored dot
- Provider name or worker ID is shown

---

### ✅ Test 11: Responsive Design
**Requirement:** UI/UX

**Steps:**
1. Resize browser window to mobile size (375px)
2. Resize to tablet size (768px)
3. Resize to desktop size (1920px)

**Expected Results:**
- Mobile: Cards stack vertically (1 column)
- Tablet: Cards display in 2 columns
- Desktop: Cards display in 3 columns
- All content remains readable at all sizes
- No horizontal scrolling

---

### ✅ Test 12: Hover Effects
**Requirement:** UI/UX

**Steps:**
1. Hover over a compatible GPU card
2. Hover over an insufficient GPU card
3. Hover over the "Show Comparison" button

**Expected Results:**
- Compatible cards show cyan border on hover
- Cursor changes to pointer
- Insufficient cards show "not-allowed" cursor
- Buttons show hover effects
- Transitions are smooth (200ms)

---

### ✅ Test 13: No GPUs Available
**Requirement:** Error Handling

**Steps:**
1. Modify demo to pass empty array: `availableGPUs={[]}`
2. Reload page

**Expected Results:**
- Shows "No GPUs Available" message
- Warning icon is displayed
- Helpful message suggests trying again later
- No errors in console

---

### ✅ Test 14: All GPUs Insufficient
**Requirement:** Error Handling

**Steps:**
1. Modify job requirements to require 100GB VRAM
2. Reload page

**Expected Results:**
- All GPUs show red "Insufficient" badge
- Top recommendations section shows 0 recommendations
- All cards are disabled
- Warnings explain why each GPU is insufficient

---

## Performance Tests

### Test 15: Large GPU List
**Steps:**
1. Modify demo to include 100+ GPUs
2. Test sorting performance
3. Test selection performance

**Expected Results:**
- Component renders within 1 second
- Sorting is instant (<100ms)
- Selection is instant
- No lag or stuttering

---

### Test 16: Rapid Sorting Changes
**Steps:**
1. Rapidly change sorting option multiple times
2. Observe performance

**Expected Results:**
- No visual glitches
- Smooth transitions
- No console errors
- Memory usage remains stable

---

## Accessibility Tests

### Test 17: Keyboard Navigation
**Steps:**
1. Use Tab key to navigate through cards
2. Use Enter/Space to select a card
3. Use arrow keys in dropdown

**Expected Results:**
- All interactive elements are focusable
- Focus indicator is visible
- Selection works with keyboard
- Dropdown is keyboard accessible

---

### Test 18: Screen Reader
**Steps:**
1. Enable screen reader (NVDA/JAWS/VoiceOver)
2. Navigate through the component

**Expected Results:**
- GPU information is announced
- Compatibility status is announced
- Warnings are announced
- Selection state is announced

---

## Integration Tests

### Test 19: Integration with JobUploader
**Steps:**
1. Use JobUploader to analyze a file
2. Pass analysis to SmartMatcher
3. Verify compatibility calculation

**Expected Results:**
- Job requirements are correctly used
- GPU filtering works based on actual requirements
- Estimates are calculated correctly

---

### Test 20: Proceed to Next Step
**Steps:**
1. Select a GPU
2. Click "Proceed to Configuration" button
3. Verify callback is triggered

**Expected Results:**
- Success notification appears
- Selected GPU data is available
- Ready to proceed to next wizard step

---

## Browser Compatibility

Test in:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

All features should work consistently across browsers.

---

## Notes

- All tests should pass without console errors
- Component should feel responsive and smooth
- Visual design should match the dark theme
- Animations should be subtle and professional
- Error states should be helpful and clear

## Test Results

Date: ___________
Tester: ___________

| Test # | Status | Notes |
|--------|--------|-------|
| 1      | ⬜     |       |
| 2      | ⬜     |       |
| 3      | ⬜     |       |
| 4      | ⬜     |       |
| 5      | ⬜     |       |
| 6      | ⬜     |       |
| 7      | ⬜     |       |
| 8      | ⬜     |       |
| 9      | ⬜     |       |
| 10     | ⬜     |       |
| 11     | ⬜     |       |
| 12     | ⬜     |       |
| 13     | ⬜     |       |
| 14     | ⬜     |       |
| 15     | ⬜     |       |
| 16     | ⬜     |       |
| 17     | ⬜     |       |
| 18     | ⬜     |       |
| 19     | ⬜     |       |
| 20     | ⬜     |       |
