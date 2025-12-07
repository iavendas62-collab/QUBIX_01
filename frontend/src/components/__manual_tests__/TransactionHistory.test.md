# TransactionHistory Manual Test Plan

## Test Environment Setup

1. Start the backend server: `cd backend && npm run dev`
2. Start the frontend: `cd frontend && npm run dev`
3. Navigate to: `http://localhost:5173/transaction-history-demo`

## Test Cases

### TC1: Initial Load
**Objective**: Verify component loads and displays transactions

**Steps**:
1. Navigate to the demo page
2. Observe the transaction table

**Expected Results**:
- ✅ Component loads without errors
- ✅ Transaction table is visible
- ✅ Transactions are displayed in rows
- ✅ All columns are visible (Date, Type, Job, Status, Amount, Blockchain)
- ✅ "Last updated" timestamp is shown
- ✅ Total transaction count is displayed

**Status**: [ ] Pass [ ] Fail

---

### TC2: Pagination
**Objective**: Verify pagination controls work correctly

**Steps**:
1. Ensure there are more than 20 transactions
2. Click the "Next" button
3. Observe page change
4. Click the "Previous" button
5. Observe page change

**Expected Results**:
- ✅ Next button navigates to page 2
- ✅ Previous button navigates back to page 1
- ✅ Page indicator shows correct page number
- ✅ "Showing X to Y of Z" updates correctly
- ✅ Next button is disabled on last page
- ✅ Previous button is disabled on first page

**Status**: [ ] Pass [ ] Fail

---

### TC3: Type Filter
**Objective**: Verify filtering by transaction type

**Steps**:
1. Click "Filters" button
2. Select "PAYMENT" from Type dropdown
3. Observe filtered results
4. Change to "EARNING"
5. Observe filtered results
6. Select "All Types"

**Expected Results**:
- ✅ Filter panel opens when clicking Filters button
- ✅ Only PAYMENT transactions are shown when selected
- ✅ Only EARNING transactions are shown when selected
- ✅ All transactions shown when "All Types" selected
- ✅ Filter badge shows count of active filters
- ✅ Page resets to 1 when filter changes

**Status**: [ ] Pass [ ] Fail

---

### TC4: Status Filter
**Objective**: Verify filtering by transaction status

**Steps**:
1. Open filters panel
2. Select "PENDING" from Status dropdown
3. Observe filtered results
4. Change to "COMPLETED"
5. Observe filtered results

**Expected Results**:
- ✅ Only PENDING transactions shown when selected
- ✅ Only COMPLETED transactions shown when selected
- ✅ Status badges match filter selection
- ✅ Filter badge updates with active filter count

**Status**: [ ] Pass [ ] Fail

---

### TC5: Date Range Filter
**Objective**: Verify filtering by date range

**Steps**:
1. Open filters panel
2. Select a start date (e.g., 7 days ago)
3. Observe filtered results
4. Add an end date (e.g., today)
5. Observe filtered results
6. Clear dates

**Expected Results**:
- ✅ Only transactions after start date are shown
- ✅ Only transactions within date range are shown
- ✅ Clearing dates shows all transactions
- ✅ Date inputs work correctly

**Status**: [ ] Pass [ ] Fail

---

### TC6: Clear Filters
**Objective**: Verify clearing all filters at once

**Steps**:
1. Apply multiple filters (type, status, dates)
2. Click "Clear all filters" button
3. Observe results

**Expected Results**:
- ✅ All filters are reset to default
- ✅ All transactions are shown
- ✅ Filter badge disappears
- ✅ Page resets to 1

**Status**: [ ] Pass [ ] Fail

---

### TC7: Transaction Details Modal
**Objective**: Verify clicking transaction opens details modal

**Steps**:
1. Click any transaction row
2. Observe modal opens
3. Review all information displayed
4. Click "Close" button

**Expected Results**:
- ✅ Modal opens when row is clicked
- ✅ Status icon and text are displayed
- ✅ Amount is shown with correct color
- ✅ Transaction ID is displayed
- ✅ Type and description are shown
- ✅ Created and completed dates are shown
- ✅ Job information is shown (if applicable)
- ✅ Blockchain hash is shown (if available)
- ✅ Modal closes when clicking Close button
- ✅ Modal closes when clicking outside (backdrop)

**Status**: [ ] Pass [ ] Fail

---

### TC8: Copy to Clipboard
**Objective**: Verify copy buttons work in details modal

**Steps**:
1. Open transaction details modal
2. Click copy button next to Transaction ID
3. Observe feedback
4. Click copy button next to blockchain hash
5. Observe feedback

**Expected Results**:
- ✅ Copy button shows checkmark after clicking
- ✅ Text is copied to clipboard (verify by pasting)
- ✅ Checkmark reverts to copy icon after 2 seconds
- ✅ Both copy buttons work independently

**Status**: [ ] Pass [ ] Fail

---

### TC9: Blockchain Explorer Links
**Objective**: Verify links to Qubic explorer work

**Steps**:
1. Find a transaction with a blockchain hash
2. Click "View" in the Blockchain column
3. Observe new tab opens
4. Open transaction details modal
5. Click "View on Qubic Explorer" button

**Expected Results**:
- ✅ Clicking "View" opens new tab
- ✅ URL format is correct: `https://explorer.qubic.org/network/tx/{hash}`
- ✅ Explorer button in modal works
- ✅ Links don't trigger row click event

**Status**: [ ] Pass [ ] Fail

---

### TC10: Manual Refresh
**Objective**: Verify manual refresh button works

**Steps**:
1. Note the "Last updated" timestamp
2. Wait 5 seconds
3. Click "Refresh" button
4. Observe loading state
5. Observe updated timestamp

**Expected Results**:
- ✅ Refresh button shows loading spinner while fetching
- ✅ Transactions are reloaded
- ✅ "Last updated" timestamp resets to 0s ago
- ✅ Button is disabled during refresh

**Status**: [ ] Pass [ ] Fail

---

### TC11: Auto-Refresh for Pending Transactions
**Objective**: Verify auto-refresh works for pending transactions

**Steps**:
1. Ensure there is at least one PENDING transaction
2. Observe "Auto-refreshing pending transactions" indicator
3. Wait 10 seconds
4. Observe automatic refresh

**Expected Results**:
- ✅ Auto-refresh indicator is shown when pending transactions exist
- ✅ Transactions refresh automatically every 10 seconds
- ✅ "Last updated" timestamp resets after auto-refresh
- ✅ No auto-refresh when no pending transactions

**Status**: [ ] Pass [ ] Fail

---

### TC12: Status Indicators
**Objective**: Verify status badges and icons display correctly

**Steps**:
1. Find transactions with different statuses
2. Observe status badges and icons

**Expected Results**:
- ✅ COMPLETED shows green checkmark icon
- ✅ PENDING shows yellow clock icon with pulse animation
- ✅ FAILED shows red X icon
- ✅ Status text matches icon color
- ✅ Pending transactions show estimated confirmation time

**Status**: [ ] Pass [ ] Fail

---

### TC13: Amount Display
**Objective**: Verify amounts are displayed correctly with colors

**Steps**:
1. Find PAYMENT transactions
2. Find EARNING transactions
3. Find REFUND transactions
4. Observe amount formatting and colors

**Expected Results**:
- ✅ PAYMENT amounts are red with minus sign
- ✅ EARNING amounts are green with plus sign
- ✅ REFUND amounts are green with plus sign
- ✅ ESCROW_LOCK amounts are red with minus sign
- ✅ ESCROW_RELEASE amounts are green with plus sign
- ✅ Amounts show 2 decimal places
- ✅ "QUBIC" label is shown

**Status**: [ ] Pass [ ] Fail

---

### TC14: Job Information Display
**Objective**: Verify job information is shown when available

**Steps**:
1. Find transaction with associated job
2. Observe job information in table
3. Open transaction details
4. Observe job information in modal

**Expected Results**:
- ✅ Job model type is displayed in table
- ✅ Job ID (truncated) is displayed in table
- ✅ Full job details shown in modal
- ✅ Transactions without jobs show "—"

**Status**: [ ] Pass [ ] Fail

---

### TC15: Empty State
**Objective**: Verify empty state displays when no transactions

**Steps**:
1. Apply filters that result in no transactions
2. Observe empty state

**Expected Results**:
- ✅ Calendar icon is shown
- ✅ "No transactions found" message is displayed
- ✅ "Clear filters" button is shown
- ✅ Clicking "Clear filters" resets filters

**Status**: [ ] Pass [ ] Fail

---

### TC16: Loading State
**Objective**: Verify loading state displays correctly

**Steps**:
1. Refresh the page
2. Observe initial loading state
3. Click refresh button
4. Observe loading state

**Expected Results**:
- ✅ Loading spinner is shown on initial load
- ✅ "Loading transactions..." message is displayed
- ✅ Refresh button shows spinner during refresh
- ✅ Loading state doesn't flash too quickly

**Status**: [ ] Pass [ ] Fail

---

### TC17: Error State
**Objective**: Verify error state displays correctly

**Steps**:
1. Stop the backend server
2. Refresh the page or click refresh button
3. Observe error state
4. Start backend server
5. Click "Retry" button

**Expected Results**:
- ✅ Error icon is shown
- ✅ Error message is displayed
- ✅ "Retry" button is shown
- ✅ Clicking retry attempts to reload
- ✅ Success after backend is back online

**Status**: [ ] Pass [ ] Fail

---

### TC18: Responsive Design
**Objective**: Verify component works on different screen sizes

**Steps**:
1. Resize browser window to mobile size (375px)
2. Observe layout
3. Resize to tablet size (768px)
4. Observe layout
5. Resize to desktop size (1920px)
6. Observe layout

**Expected Results**:
- ✅ Table is scrollable on mobile
- ✅ All columns are accessible
- ✅ Filters panel adapts to screen size
- ✅ Modal is responsive
- ✅ No horizontal overflow

**Status**: [ ] Pass [ ] Fail

---

### TC19: Estimated Confirmation Time
**Objective**: Verify estimated time for pending transactions

**Steps**:
1. Find a PENDING transaction
2. Observe estimated confirmation time
3. Wait and observe time decrease

**Expected Results**:
- ✅ Estimated time is shown below status badge
- ✅ Format is "~Xs remaining"
- ✅ Shows "Confirming..." when time is up
- ✅ Time updates on refresh

**Status**: [ ] Pass [ ] Fail

---

### TC20: Transaction Type Icons
**Objective**: Verify correct icons for transaction types

**Steps**:
1. Find transactions of each type
2. Observe icons

**Expected Results**:
- ✅ PAYMENT shows red down-left arrow
- ✅ EARNING shows green up-right arrow
- ✅ REFUND shows yellow up-right arrow
- ✅ ESCROW_LOCK shows red down-left arrow
- ✅ ESCROW_RELEASE shows green up-right arrow

**Status**: [ ] Pass [ ] Fail

---

## Test Summary

**Total Test Cases**: 20
**Passed**: ___
**Failed**: ___
**Pass Rate**: ___%

## Issues Found

| Issue # | Description | Severity | Status |
|---------|-------------|----------|--------|
| | | | |

## Notes

- Test Date: ___________
- Tester: ___________
- Browser: ___________
- OS: ___________

## Sign-off

Tester Signature: ___________________ Date: ___________
