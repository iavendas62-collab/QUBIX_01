# ProviderEarnings Component - Manual Test Plan

## Test Environment Setup

1. **Start Backend Server**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend Server**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access Demo Page**
   - Navigate to: `http://localhost:5173/provider-earnings-demo`

## Test Cases

### TC1: Initial Load and Display

**Objective**: Verify component loads and displays all sections correctly

**Steps**:
1. Navigate to `/provider-earnings-demo`
2. Enter a valid Qubic address or use sample address
3. Click "View Dashboard"

**Expected Results**:
- [ ] Component loads without errors
- [ ] Loading spinner appears briefly
- [ ] All 5 earnings summary cards display (Total, Today, Week, Month, Pending)
- [ ] Performance metrics cards display (Uptime, Jobs Completed, Rating, Avg Rate)
- [ ] Earnings history chart renders with 30 days of data
- [ ] Active jobs table displays (or "No active jobs" message)
- [ ] Transaction history table displays (or "No transactions" message)
- [ ] "Last updated" timestamp shows current time

**Status**: ⬜ Pass / ⬜ Fail

---

### TC2: Earnings Summary Cards

**Objective**: Verify earnings summary displays correct data and formatting

**Steps**:
1. View the 5 earnings summary cards
2. Check values and formatting

**Expected Results**:
- [ ] Total Earned shows in green with QUBIC label
- [ ] Today's Earnings shows with calendar icon
- [ ] This Week shows with trending up icon
- [ ] This Month shows with activity icon
- [ ] Pending shows in yellow with clock icon
- [ ] All amounts formatted to 2 decimal places
- [ ] Icons display correctly

**Status**: ⬜ Pass / ⬜ Fail

---

### TC3: Performance Metrics

**Objective**: Verify performance metrics display correctly

**Steps**:
1. View the 4 performance metric cards
2. Check values and formatting

**Expected Results**:
- [ ] Uptime shows as percentage (e.g., "95.5%")
- [ ] Jobs Completed shows as integer
- [ ] Average Rating shows with star/award icon
- [ ] Average Hourly Rate shows with "QUBIC/h" unit
- [ ] All values are non-negative

**Status**: ⬜ Pass / ⬜ Fail

---

### TC4: Earnings History Chart

**Objective**: Verify 30-day earnings chart displays and functions correctly

**Steps**:
1. View the earnings history chart
2. Hover over data points
3. Check date range

**Expected Results**:
- [ ] Chart displays with green gradient area
- [ ] X-axis shows dates
- [ ] Y-axis shows amounts
- [ ] Chart spans 30 days
- [ ] Hovering shows tooltip with exact values
- [ ] Tooltip shows date and amount
- [ ] Chart is responsive to window resize

**Status**: ⬜ Pass / ⬜ Fail

---

### TC5: Active Jobs Table - No Jobs

**Objective**: Verify empty state displays when no active jobs

**Steps**:
1. View active jobs section when no jobs are running
2. Check empty state message

**Expected Results**:
- [ ] Table header shows "Active Jobs (0)"
- [ ] Empty state message displays: "No active jobs at the moment"
- [ ] Message is centered and styled appropriately

**Status**: ⬜ Pass / ⬜ Fail

---

### TC6: Active Jobs Table - With Jobs

**Objective**: Verify active jobs display with live earnings counter

**Prerequisites**: Have at least one running job

**Steps**:
1. Start a job (or use mock data)
2. View active jobs table
3. Wait 5 seconds
4. Observe earnings counter

**Expected Results**:
- [ ] Table shows all active jobs
- [ ] Job ID displays (truncated with "...")
- [ ] Client address displays (truncated)
- [ ] GPU model displays
- [ ] Duration updates every 5 seconds (e.g., "5m 30s" → "5m 35s")
- [ ] Earnings So Far updates every 5 seconds
- [ ] Earnings formatted to 4 decimal places
- [ ] Estimated Total displays
- [ ] Status badge shows "running" in green
- [ ] All columns align properly

**Status**: ⬜ Pass / ⬜ Fail

---

### TC7: Live Earnings Counter Accuracy

**Objective**: Verify earnings calculation is accurate

**Prerequisites**: Have an active job with known hourly rate

**Steps**:
1. Note the job's price per hour (e.g., 2.0 QUBIC/h)
2. Note the current duration (e.g., 1800 seconds = 0.5 hours)
3. Calculate expected earnings: 0.5 * 2.0 = 1.0 QUBIC
4. Compare with displayed earnings

**Expected Results**:
- [ ] Displayed earnings matches calculation
- [ ] Formula: (durationInSeconds / 3600) * pricePerHour
- [ ] Updates every 5 seconds
- [ ] Precision is 4 decimal places

**Status**: ⬜ Pass / ⬜ Fail

---

### TC8: Transaction History - Empty State

**Objective**: Verify empty state displays when no transactions

**Steps**:
1. View transaction history section with no transactions
2. Check empty state message

**Expected Results**:
- [ ] Empty state message displays: "No transactions yet"
- [ ] Message is centered and styled appropriately

**Status**: ⬜ Pass / ⬜ Fail

---

### TC9: Transaction History - With Transactions

**Objective**: Verify transaction history displays correctly

**Prerequisites**: Have transaction history

**Steps**:
1. View transaction history table
2. Check all columns and data

**Expected Results**:
- [ ] Date column shows formatted date and time
- [ ] Type column shows transaction type badge
- [ ] ESCROW_RELEASE/EARNING shows green badge
- [ ] REFUND shows yellow badge
- [ ] PAYMENT shows blue badge
- [ ] Amount column shows value with QUBIC unit
- [ ] Earnings show with "+" prefix in green
- [ ] Status column shows status badge
- [ ] COMPLETED shows green
- [ ] PENDING shows yellow
- [ ] FAILED shows red
- [ ] Explorer column shows link icon or "N/A"

**Status**: ⬜ Pass / ⬜ Fail

---

### TC10: Blockchain Explorer Links

**Objective**: Verify explorer links work correctly

**Prerequisites**: Have transactions with qubicTxHash

**Steps**:
1. Find a transaction with a hash
2. Click the external link icon
3. Verify URL format

**Expected Results**:
- [ ] Link icon displays for transactions with hash
- [ ] "N/A" displays for transactions without hash
- [ ] Clicking opens new tab
- [ ] URL format: `https://explorer.qubic.org/tx/{hash}`
- [ ] Link is blue and changes on hover

**Status**: ⬜ Pass / ⬜ Fail

---

### TC11: Manual Refresh

**Objective**: Verify manual refresh button works

**Steps**:
1. Click the "Refresh" button
2. Observe loading state
3. Wait for refresh to complete

**Expected Results**:
- [ ] Button shows loading spinner during refresh
- [ ] Button is disabled during refresh
- [ ] Data updates after refresh completes
- [ ] "Last updated" timestamp resets to "0s ago"
- [ ] No errors in console

**Status**: ⬜ Pass / ⬜ Fail

---

### TC12: Auto-refresh

**Objective**: Verify auto-refresh works every 30 seconds

**Steps**:
1. Note the "Last updated" timestamp
2. Wait 30 seconds
3. Observe if data refreshes

**Expected Results**:
- [ ] Data refreshes automatically after ~30 seconds
- [ ] "Last updated" timestamp resets
- [ ] No loading spinner shows (silent refresh)
- [ ] Active jobs earnings continue updating during refresh

**Status**: ⬜ Pass / ⬜ Fail

---

### TC13: Last Updated Timestamp

**Objective**: Verify timestamp updates correctly

**Steps**:
1. Note the "Last updated" timestamp
2. Wait 10 seconds
3. Check if timestamp increments

**Expected Results**:
- [ ] Timestamp shows "0s ago" immediately after load/refresh
- [ ] After 10 seconds, shows "10s ago"
- [ ] After 60 seconds, shows "1m ago"
- [ ] After 3600 seconds, shows "1h ago"
- [ ] Format is human-readable

**Status**: ⬜ Pass / ⬜ Fail

---

### TC14: WebSocket Live Updates

**Objective**: Verify WebSocket updates work

**Prerequisites**: WebSocket server running, providerId available

**Steps**:
1. Open browser console
2. Check WebSocket connection status
3. Trigger an earnings update event (complete a job)
4. Observe if dashboard updates

**Expected Results**:
- [ ] Console shows "WebSocket connected"
- [ ] Component subscribes to provider channel
- [ ] When earnings change, dashboard updates without refresh
- [ ] Today's earnings updates in real-time
- [ ] Active jobs table updates

**Status**: ⬜ Pass / ⬜ Fail

---

### TC15: Responsive Design

**Objective**: Verify component is responsive on different screen sizes

**Steps**:
1. View on desktop (1920x1080)
2. View on tablet (768x1024)
3. View on mobile (375x667)
4. Resize browser window

**Expected Results**:
- [ ] Desktop: 5 cards in one row, 4 metrics in one row
- [ ] Tablet: Cards stack appropriately
- [ ] Mobile: All cards stack vertically
- [ ] Tables scroll horizontally on small screens
- [ ] Chart remains readable on all sizes
- [ ] No horizontal overflow

**Status**: ⬜ Pass / ⬜ Fail

---

### TC16: Error Handling - Network Failure

**Objective**: Verify component handles network errors gracefully

**Steps**:
1. Stop backend server
2. Try to refresh data
3. Check error handling

**Expected Results**:
- [ ] Component doesn't crash
- [ ] Error logged to console
- [ ] Previous data remains displayed
- [ ] User can retry refresh
- [ ] No blank screens or broken UI

**Status**: ⬜ Pass / ⬜ Fail

---

### TC17: Error Handling - Invalid Address

**Objective**: Verify component handles invalid Qubic address

**Steps**:
1. Enter an invalid Qubic address (e.g., too short)
2. View dashboard

**Expected Results**:
- [ ] Component loads without crashing
- [ ] Shows empty state or zero values
- [ ] No console errors related to address validation

**Status**: ⬜ Pass / ⬜ Fail

---

### TC18: Performance - Large Dataset

**Objective**: Verify component performs well with large datasets

**Prerequisites**: Mock data with 100+ transactions, 10+ active jobs

**Steps**:
1. Load component with large dataset
2. Scroll through tables
3. Interact with charts

**Expected Results**:
- [ ] Initial load completes in < 2 seconds
- [ ] Scrolling is smooth (60fps)
- [ ] No lag when updating active jobs
- [ ] Chart renders without delay
- [ ] Memory usage is reasonable

**Status**: ⬜ Pass / ⬜ Fail

---

### TC19: Average Hourly Rate Calculation

**Objective**: Verify average hourly rate is calculated correctly

**Prerequisites**: Have completed jobs with known durations and costs

**Steps**:
1. Note completed jobs: Job1 (2h, 4 QUBIC), Job2 (1h, 2 QUBIC)
2. Calculate expected: (4 + 2) / (2 + 1) = 2.0 QUBIC/h
3. Compare with displayed average

**Expected Results**:
- [ ] Displayed average matches calculation
- [ ] Formula: totalEarnings / totalHours
- [ ] Formatted to 2 decimal places
- [ ] Shows "QUBIC/h" unit

**Status**: ⬜ Pass / ⬜ Fail

---

### TC20: Duration Formatting

**Objective**: Verify duration displays in human-readable format

**Steps**:
1. Check various duration values in active jobs
2. Verify formatting

**Expected Results**:
- [ ] < 60s: Shows "Xs" (e.g., "45s")
- [ ] 60-3599s: Shows "Xm Ys" (e.g., "5m 30s")
- [ ] ≥ 3600s: Shows "Xh Ym" (e.g., "2h 15m")
- [ ] No negative durations
- [ ] Format is consistent

**Status**: ⬜ Pass / ⬜ Fail

---

## Test Summary

**Total Test Cases**: 20

**Passed**: _____ / 20

**Failed**: _____ / 20

**Blocked**: _____ / 20

**Not Tested**: _____ / 20

## Issues Found

| Issue ID | Description | Severity | Status |
|----------|-------------|----------|--------|
| | | | |

## Notes

- Test Date: ___________
- Tester: ___________
- Environment: ___________
- Browser: ___________
- Backend Version: ___________
- Frontend Version: ___________

## Sign-off

**Tester Signature**: ___________

**Date**: ___________
