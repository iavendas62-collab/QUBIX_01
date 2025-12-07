# ProviderEarnings Component

## Overview

The `ProviderEarnings` component is a comprehensive real-time earnings dashboard for GPU providers on the QUBIX platform. It displays earnings summaries, active jobs with live earnings counters, transaction history with blockchain verification, and performance metrics.

## Features

### 1. Earnings Summary Cards (Requirement 9.1)
- **Total Earned**: Lifetime earnings across all jobs
- **Today's Earnings**: Current day earnings with live updates
- **This Week**: Last 7 days earnings
- **This Month**: Current month earnings
- **Pending Payouts**: Funds in escrow awaiting release

### 2. Performance Metrics (Requirement 9.7)
- **Uptime Percentage**: Provider availability metric
- **Jobs Completed**: Total number of successfully completed jobs
- **Average Rating**: Provider rating from consumers (placeholder)
- **Average Hourly Rate**: Calculated from all completed jobs (Requirement 9.6)

### 3. Earnings History Chart (Requirement 9.3)
- Line chart showing daily earnings for the last 30 days
- Smooth gradient visualization
- Interactive tooltips with exact values

### 4. Active Jobs Table (Requirement 9.4)
- Real-time table of currently running jobs
- **Live Duration Counter**: Updates every 5 seconds
- **Live Earnings Counter**: Calculates earnings-so-far based on duration and hourly rate (Requirement 9.2)
- Shows job ID, client address, GPU model, estimated total
- Status indicators

### 5. Transaction History (Requirements 10.1, 10.2, 10.3)
- Complete transaction history with date, type, amount, status
- **Blockchain Explorer Links**: Clickable links to Qubic explorer for verification
- Color-coded transaction types (earnings, refunds, escrow)
- Status indicators (pending, completed, failed)

### 6. Real-time Updates
- **WebSocket Integration**: Live earnings updates via WebSocket (Requirement 9.2)
- **Auto-refresh**: Fetches latest data every 30 seconds (Requirement 13.6)
- **Manual Refresh**: Button with loading state (Requirements 13.1, 13.2, 13.3)
- **Last Updated Timestamp**: Shows time since last update (Requirement 13.5)

## Usage

### Basic Usage

```tsx
import ProviderEarnings from '../components/ProviderEarnings';

function MyProviderDashboard() {
  return (
    <ProviderEarnings 
      qubicAddress="YOUR_QUBIC_ADDRESS_HERE"
    />
  );
}
```

### With Provider ID

```tsx
<ProviderEarnings 
  providerId="provider-uuid"
  qubicAddress="QUBIC_ADDRESS"
/>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `providerId` | `string` | No | Provider UUID for WebSocket subscriptions |
| `qubicAddress` | `string` | No | Qubic wallet address to fetch earnings for |

## API Endpoints Used

### GET `/api/providers/my/earnings`
Fetches earnings summary and history.

**Query Parameters:**
- `qubicAddress`: Filter by Qubic address

**Response:**
```json
{
  "total": 4240.50,
  "today": 45.20,
  "thisWeek": 210.00,
  "thisMonth": 850.00,
  "pending": 125.00,
  "averageHourlyRate": 2.50,
  "history": [
    { "date": "2024-01-01", "amount": 45.20 },
    ...
  ]
}
```

### GET `/api/providers/my/jobs`
Fetches active and completed jobs.

**Query Parameters:**
- `qubicAddress`: Filter by Qubic address
- `status`: Filter by job status (e.g., "RUNNING")

### GET `/api/transactions/history/:userId`
Fetches transaction history for a user.

**Response:**
```json
[
  {
    "id": "tx-uuid",
    "type": "ESCROW_RELEASE",
    "amount": 45.20,
    "status": "COMPLETED",
    "qubicTxHash": "abc123...",
    "createdAt": "2024-01-15T10:30:00Z",
    "completedAt": "2024-01-15T10:35:00Z"
  },
  ...
]
```

## WebSocket Events

The component subscribes to the following WebSocket events:

### `EARNINGS_UPDATE`
Triggered when provider earnings change.

**Payload:**
```json
{
  "providerId": "provider-uuid",
  "todayEarnings": 45.20,
  "activeJobs": [...]
}
```

## Live Updates

### Active Jobs Earnings Counter
- Updates every **5 seconds** (Requirement 9.2)
- Calculates: `(durationInSeconds / 3600) * pricePerHour`
- Displays with 4 decimal precision

### Auto-refresh
- Fetches all data every **30 seconds** (Requirement 13.6)
- Can be disabled by user
- Shows "Last updated: Xs ago" timestamp

### Manual Refresh
- Button with loading spinner during refresh
- Fetches earnings, jobs, transactions, and metrics
- Updates "Last updated" timestamp

## Styling

The component uses:
- **TailwindCSS** for styling
- **Recharts** for data visualization
- **Lucide React** for icons
- **Custom Card component** for consistent UI

### Color Scheme
- Green: Earnings, positive transactions
- Yellow: Pending transactions, warnings
- Blue: Information, links
- Red: Failed transactions, errors
- Slate: Background, borders, text

## Performance Considerations

1. **Memoization**: Uses `useCallback` for stable function references
2. **Efficient Updates**: Only updates active jobs earnings every 5s, not full data
3. **Conditional Rendering**: Shows loading state only on initial load
4. **WebSocket**: Subscribes only when connected and providerId available

## Testing

### Manual Testing Checklist

1. **Earnings Display**
   - [ ] Total earnings shows correct sum
   - [ ] Today's earnings updates in real-time
   - [ ] Pending payouts shows escrow amounts

2. **Active Jobs**
   - [ ] Duration counter updates every 5 seconds
   - [ ] Earnings counter calculates correctly
   - [ ] Shows "No active jobs" when empty

3. **Transaction History**
   - [ ] Displays all transaction types
   - [ ] Explorer links open correct Qubic URLs
   - [ ] Status colors are correct

4. **Real-time Updates**
   - [ ] WebSocket updates earnings
   - [ ] Auto-refresh works every 30 seconds
   - [ ] Manual refresh button works

5. **Performance Metrics**
   - [ ] Uptime percentage displays
   - [ ] Jobs completed count is accurate
   - [ ] Average hourly rate calculates correctly

## Demo

Access the demo at: `/provider-earnings-demo`

The demo allows you to:
- Enter your Qubic address
- Use a sample address for testing
- View all features with live data

## Requirements Validation

This component satisfies the following requirements:

- ✅ **9.1**: Display total earnings, today's earnings, and pending payouts
- ✅ **9.2**: Update earnings-so-far every 5 seconds for active jobs
- ✅ **9.3**: Show earnings history line chart (last 30 days)
- ✅ **9.4**: Display active jobs table with live duration and earnings columns
- ✅ **9.5**: Add transaction history entry with explorer link
- ✅ **9.6**: Calculate and show average hourly rate
- ✅ **9.7**: Display performance metrics (uptime, jobs completed, rating)
- ✅ **10.1**: Display all payments, earnings, and refunds
- ✅ **10.2**: Show transaction date, amount, type, and status
- ✅ **10.3**: Provide clickable link to Qubic explorer
- ✅ **13.1**: Fetch latest data on refresh button click
- ✅ **13.2**: Show loading spinner during refresh
- ✅ **13.3**: Update displayed data after refresh
- ✅ **13.5**: Display "Last updated: X seconds ago" timestamp
- ✅ **13.6**: Auto-refresh data every 30 seconds

## Future Enhancements

1. **Export Functionality**: CSV/PDF export of earnings and transactions
2. **Date Range Filters**: Custom date ranges for history
3. **Earnings Projections**: Predict future earnings based on trends
4. **Detailed Analytics**: Breakdown by GPU, job type, time of day
5. **Notifications**: Alert when earnings reach milestones
6. **Tax Reports**: Generate tax-ready reports
7. **Comparison Charts**: Compare with other providers (anonymized)

## Related Components

- `JobMonitor`: Real-time job monitoring dashboard
- `TransactionHistory`: Standalone transaction history component
- `EarningsChart`: Reusable earnings visualization
- `ActiveJobsTable`: Reusable active jobs table

## Support

For issues or questions:
1. Check the console for error messages
2. Verify API endpoints are accessible
3. Ensure WebSocket connection is established
4. Check that qubicAddress is valid (60 uppercase characters)
