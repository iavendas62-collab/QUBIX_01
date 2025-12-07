# Animation & UX Quick Start Guide

## Getting Started

### Installation
Framer Motion is already installed. If you need to reinstall:
```bash
npm install framer-motion
```

## Basic Usage

### 1. Simple Fade In Animation

```tsx
import { motion } from 'framer-motion';
import { fadeIn } from '../utils/animations';

function MyComponent() {
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
    >
      <h1>This fades in smoothly</h1>
    </motion.div>
  );
}
```

### 2. Card with Hover Effect

```tsx
import { motion } from 'framer-motion';
import { cardHover } from '../utils/animations';

function MyCard() {
  return (
    <motion.div
      variants={cardHover}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      className="card"
    >
      <h3>Hover me!</h3>
    </motion.div>
  );
}
```

### 3. Staggered List

```tsx
import { motion } from 'framer-motion';
import { listContainer, listItem } from '../utils/animations';

function MyList({ items }) {
  return (
    <motion.ul
      variants={listContainer}
      initial="hidden"
      animate="visible"
    >
      {items.map(item => (
        <motion.li key={item.id} variants={listItem}>
          {item.name}
        </motion.li>
      ))}
    </motion.ul>
  );
}
```

### 4. Toast Notifications

```tsx
import { notify } from './components/ui';

function MyComponent() {
  const handleSuccess = () => {
    notify.success('Operation completed!');
  };

  const handleError = () => {
    notify.error('Something went wrong');
  };

  const handleLoading = async () => {
    const toastId = notify.loading('Processing...');
    await doSomething();
    notify.dismiss(toastId);
    notify.success('Done!');
  };

  return (
    <div>
      <button onClick={handleSuccess}>Success</button>
      <button onClick={handleError}>Error</button>
      <button onClick={handleLoading}>Loading</button>
    </div>
  );
}
```

### 5. Confirmation Dialog

```tsx
import { useState } from 'react';
import { ConfirmDialog } from './components/ui';

function MyComponent() {
  const [showDialog, setShowDialog] = useState(false);

  const handleDelete = () => {
    // Perform delete
    setShowDialog(false);
  };

  return (
    <>
      <button onClick={() => setShowDialog(true)}>
        Delete Item
      </button>

      <ConfirmDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onConfirm={handleDelete}
        title="Delete Item"
        message="Are you sure? This cannot be undone."
        variant="danger"
      />
    </>
  );
}
```

### 6. Loading Skeleton

```tsx
import { SkeletonCard, SkeletonTable } from './components/ui/Skeleton';

function MyComponent() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  if (loading) {
    return (
      <div>
        <SkeletonCard />
        <SkeletonTable rows={5} />
      </div>
    );
  }

  return <div>{/* Render actual data */}</div>;
}
```

### 7. Keyboard Navigation

```tsx
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';

function MyModal({ isOpen, onClose }) {
  useKeyboardNavigation({
    onEscape: onClose,
    onEnter: handleConfirm,
    enabled: isOpen
  });

  return (
    <div className="modal">
      {/* Modal content */}
    </div>
  );
}
```

## Available Animations

### Fade Animations
- `fadeIn` - Simple opacity fade
- `fadeInUp` - Fade with upward motion
- `fadeInDown` - Fade with downward motion

### Scale Animations
- `scaleIn` - Scale with spring effect
- `scaleInBounce` - Bouncy scale animation

### Slide Animations
- `slideInLeft` - Slide from left
- `slideInRight` - Slide from right

### Interactive Animations
- `cardHover` - Card hover effect
- `gpuCardHover` - GPU card hover effect
- `buttonTap` - Button press effect

### List Animations
- `listContainer` - Container for staggered children
- `listItem` - Individual list item animation

### Modal Animations
- `modalBackdrop` - Backdrop fade
- `modalContent` - Modal content animation

### Feedback Animations
- `successPulse` - Success feedback
- `errorShake` - Error feedback

## Tailwind Animation Classes

```tsx
// Fade in
<div className="animate-fade-in">Content</div>

// Slide in from right
<div className="animate-slide-in-right">Content</div>

// Scale in
<div className="animate-scale-in">Content</div>

// Pulse glow
<div className="animate-pulse-glow">Content</div>

// Shimmer (for loading)
<div className="animate-shimmer">Content</div>
```

## Responsive Design

### Breakpoints
```tsx
// Mobile first approach
<div className="
  w-full           // Mobile: full width
  md:w-1/2         // Tablet: half width
  lg:w-1/3         // Desktop: third width
">
  Content
</div>
```

### Utility Classes
```tsx
// Stack on mobile
<div className="flex flex-col md:flex-row">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

// Hide on mobile
<div className="hidden md:block">
  Desktop only content
</div>

// Full width on mobile
<button className="w-full md:w-auto">
  Button
</button>
```

## Best Practices

### Do's ✅
```tsx
// Use GPU-accelerated properties
<motion.div
  animate={{ x: 100, opacity: 1 }}  // Good: transform and opacity
/>

// Respect reduced motion
import { shouldReduceMotion } from '../utils/animations';

const duration = shouldReduceMotion() ? 0.01 : 0.3;

// Provide loading feedback
const handleSubmit = async () => {
  const toastId = notify.loading('Submitting...');
  try {
    await submit();
    notify.dismiss(toastId);
    notify.success('Submitted!');
  } catch (error) {
    notify.dismiss(toastId);
    notify.error('Failed to submit');
  }
};
```

### Don'ts ❌
```tsx
// Don't animate layout properties
<motion.div
  animate={{ width: 200, height: 100 }}  // Bad: causes reflow
/>

// Don't use excessive durations
<motion.div
  animate={{ opacity: 1 }}
  transition={{ duration: 2 }}  // Bad: too slow
/>

// Don't forget loading states
const handleClick = async () => {
  await doSomething();  // Bad: no feedback
};
```

## Common Patterns

### Loading State
```tsx
function MyComponent() {
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    setLoading(true);
    try {
      await doSomething();
      notify.success('Success!');
    } catch (error) {
      notify.error('Error!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleAction}
      isLoading={loading}
    >
      Submit
    </Button>
  );
}
```

### Conditional Animation
```tsx
function MyComponent({ isVisible }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          Content
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### Sequential Animations
```tsx
function MyComponent() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <motion.h1
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.4 }}
      >
        Title
      </motion.h1>
      <motion.p
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.6 }}
      >
        Description
      </motion.p>
    </motion.div>
  );
}
```

## Testing Animations

### Visual Testing
```bash
# Start dev server
npm run dev

# Navigate to animation demo
http://localhost:5173/animation-demo
```

### Reduced Motion Testing
```tsx
// In browser DevTools
// 1. Open DevTools (F12)
// 2. Press Cmd/Ctrl + Shift + P
// 3. Type "Emulate CSS prefers-reduced-motion"
// 4. Select "prefers-reduced-motion: reduce"
```

### Performance Testing
```tsx
// In browser DevTools
// 1. Open Performance tab
// 2. Start recording
// 3. Interact with animations
// 4. Stop recording
// 5. Check for 60fps and no layout thrashing
```

## Troubleshooting

### Animations not working?
1. Check if Framer Motion is installed
2. Verify import paths
3. Check for CSS conflicts
4. Ensure AnimatePresence is used for exit animations

### Performance issues?
1. Reduce number of animated elements
2. Use `will-change` sparingly
3. Debounce frequent updates
4. Check for memory leaks

### Accessibility issues?
1. Test with keyboard only
2. Test with screen reader
3. Verify focus indicators
4. Check reduced motion support

## Resources

- [Framer Motion Docs](https://www.framer.com/motion/)
- [Animation Guide](./ANIMATION_UX_GUIDE.md)
- [Demo Page](http://localhost:5173/animation-demo)
- [Verification Checklist](../TASK_21_VERIFICATION_CHECKLIST.md)
