# TransactionHistory Component

## Overview

The `TransactionHistory` component provides a comprehensive transaction history display with pagination, filtering, blockchain verification, and auto-refresh capabilities. It's designed to meet all requirements for displaying transaction data in the QUBIX platform.

## Features

### Core Features
- ✅ **Pagination** - Navigate through large transaction lists with page controls
- ✅ **Filtering** - Filter by transaction type, status, and date range
- ✅ **Blockchain Links** - Direct links to Qubic explorer for verification
- ✅ **Auto-Refresh** - Automatic updates every 10 seconds for pending transactions
- ✅ **Transaction Details** - Click any row to view detailed information
- ✅ **Status Indicators** - Visual feedback for pending/completed/failed states
- ✅ **Estimated Confirmation Time** - Shows remaining time for pending transactions
- ✅ **Last Updated Timestamp** - Displays how long ago data was refreshed

### Requirements Coverage

| Requirement | Description | Status |
|------------|-------------|--------|
| 10.1 | Display all payments, earnings, and refunds | ✅ |
| 10.2 | Show date, amount, type, and status | ✅ |
| 10.3 | Provide clickable links to Qubic explorer | ✅ |
| 10.4 | Show pending status with estimated confirmation time | ✅ |
| 10.5 | Auto-update when transaction confirms | ✅ |
| 10.6 | Support filtering by type and date range | ✅ |

## Usage

### Basic Usage

```tsx
import TransactionHistory from './components/TransactionHistory';
import TransactionDetails from './components/TransactionDetails';
import { useState } from 'react';

function MyComponent() {
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const qubicAddress = 'YOUR_QUBIC_ADDRESS';

  return (
    <>
      <TransactionHistory 
        qubicAddress={qubicAddress}
        onTransactionClick={setSelectedTransaction}
      />
      
      {selectedTransaction && (
        <TransactionDetails
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </>
  );
}
```

### Props

#### TransactionHistory

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `qubicAddress` | `string` | Yes | User's Qubic wallet address |
| `onTransactionClick` | `(tx: Transaction) => void` | No | Callback when transaction row is clicked |

#### TransactionDetails

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `transaction` | `Transaction` | Yes | Transaction object to display |
| `onClose` | `() => void` | Yes | Callback to close the modal |

### Transaction Type

```typescript
interface Transaction {
  id: string;
  type: 'PAYMENT' | 'EARNING' | 'REFUND' | 'ESCROW_LOCK' | 'ESCROW_RELEASE';
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  qubicTxHash: string | null;
  createdAt: string;
  completedAt: string | null;
  job?: {
    id: string;
    modelType: string;
    status: string;
  } | null;
}
```

## Features in Detail

### Pagination

- Default page size: 20 transactions
- Navigation controls at bottom of table
- Shows current page and total pages
- Displays range of items being shown

### Filtering

Click the "Filters" button to show/hide filtering options:

- **Type Filter**: PAYMENT, EARNING, REFUND, ESCROW_LOCK, ESCROW_RELEASE
- **Status Filter**: PENDING, COMPLETED, FAILED
- **Date Range**: Start date and end date pickers
- **Clear Filters**: Quick button to reset all filters

Active filters are indicated with a badge showing the count.

### Auto-Refresh

- Automatically refreshes every 10 seconds when pending transactions exist
- Manual refresh button always available
- Shows "Last updated: Xs ago" timestamp
- Visual indicator when auto-refresh is active

### Transaction Details Modal

Click any transaction row to open a detailed modal showing:

- Transaction status with icon
- Full amount with color coding
- Transaction ID with copy button
- Transaction type and description
- Created and completed timestamps
- Associated job information (if applicable)
- Blockchain transaction hash with copy button
- Direct link to Qubic Explorer
- Estimated confirmation time for pending transactions

### Status Indicators

- **Completed**: Green checkmark icon
- **Pending**: Yellow clock icon with pulse animation
- **Failed**: Red X icon

### Blockchain Verification

- Transaction hash displayed in Blockchain column
- Click "View" to open in Qubic Explorer
- Explorer URL format: `https://explorer.qubic.org/network/tx/{hash}`
- Copy button in details modal for easy sharing

## API Integration

### Backend Endpoint

```
GET /api/transactions/history/:qubicAddress
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)
- `type` - Filter by transaction type
- `status` - Filter by status
- `startDate` - Filter by start date (ISO string)
- `endDate` - Filter by end date (ISO string)

**Response:**
```json
{
  "success": true,
  "transactions": [...],
  "total": 150,
  "page": 1,
  "totalPages": 8
}
```

## Styling

The component uses Tailwind CSS with the QUBIX dark theme:

- Background: `slate-800`
- Borders: `slate-700`
- Text: `white` / `slate-400`
- Accent: `cyan-400`
- Success: `green-400`
- Warning: `yellow-400`
- Error: `red-400`

## Demo

Visit `/transaction-history-demo` to see the component in action with:
- Sample transactions
- All filtering options
- Pagination controls
- Transaction details modal
- Usage instructions

## Testing

### Manual Testing Checklist

- [ ] Transactions load correctly
- [ ] Pagination works (next/previous)
- [ ] Type filter works for all types
- [ ] Status filter works for all statuses
- [ ] Date range filter works
- [ ] Clear filters resets all filters
- [ ] Clicking transaction opens details modal
- [ ] Blockchain links open in new tab
- [ ] Copy buttons work in details modal
- [ ] Auto-refresh works for pending transactions
- [ ] Manual refresh button works
- [ ] Last updated timestamp increments
- [ ] Loading states display correctly
- [ ] Error states display correctly
- [ ] Empty state displays when no transactions

### Property-Based Tests

The following properties should be tested:

**Property 34: Transaction Display Completeness**
- For any transaction, display should include date, amount, type, and status

**Property 35: Explorer Link Validity**
- For any transaction with hash, explorer link should be in format "https://explorer.qubic.org/network/tx/{hash}"

**Property 36: Transaction Status Updates**
- For any pending transaction, when it receives 3 confirmations, status should automatically update to 'confirmed'

## Performance Considerations

- Pagination limits data fetched per request
- Auto-refresh only active when pending transactions exist
- Debounced filter changes to avoid excessive API calls
- Efficient re-rendering with React keys

## Accessibility

- Keyboard navigation supported
- ARIA labels on interactive elements
- Color coding supplemented with icons
- High contrast text for readability

## Future Enhancements

- CSV export functionality
- Advanced search by transaction ID
- Bulk operations (mark as reviewed, etc.)
- Transaction categories/tags
- Graphical timeline view
- Mobile-optimized layout
- Real-time WebSocket updates
- Transaction notifications

## Troubleshooting

### Transactions not loading
- Check that `qubicAddress` prop is valid
- Verify backend API is running
- Check browser console for errors
- Ensure CORS is configured correctly

### Auto-refresh not working
- Check that transactions have `status: 'PENDING'`
- Verify component is mounted
- Check browser console for errors

### Filters not working
- Ensure filter values match backend enum values
- Check date format (ISO string required)
- Verify API endpoint supports filtering

## Related Components

- `TransactionDetails` - Modal for detailed transaction view
- `ProviderEarnings` - Uses transaction data for earnings display
- `Payments` - Page that integrates TransactionHistory

## Support

For issues or questions:
1. Check the demo page at `/transaction-history-demo`
2. Review the integration code examples
3. Check browser console for errors
4. Verify API responses in Network tab
