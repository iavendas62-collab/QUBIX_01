# SmartMatcher Component

## Overview

The SmartMatcher component is an intelligent GPU matching and recommendation engine that analyzes job requirements and recommends the best GPUs based on compatibility, performance, and cost-benefit analysis.

## Features

✅ **Intelligent Compatibility Analysis** (Requirements 3.1, 3.2, 3.4)
- Analyzes VRAM and RAM requirements
- Classifies GPUs as: Recommended, Compatible, Borderline, or Insufficient
- Color-coded badges (green/cyan/yellow/red)

✅ **Smart Sorting** (Requirement 3.5)
- Best Value (cost-benefit score)
- Lowest Price
- Fastest Performance
- Available Now

✅ **Detailed Estimates** (Requirements 3.6, 3.7)
- Estimated completion time
- Estimated total cost
- Cost-benefit score (0-100)

✅ **Top 3 Recommendations** (Requirement 3.7)
- Side-by-side comparison view
- Highlights best value option
- Expandable/collapsible

✅ **Warning System** (Requirement 3.3)
- Shows warnings for borderline GPUs
- Explains insufficient resources

✅ **Disabled State** (Requirement 3.8)
- Disables selection for insufficient GPUs
- Disables offline/unavailable GPUs
- Visual feedback with reduced opacity

## Usage

```tsx
import { SmartMatcher, Provider } from '../components/SmartMatcher';
import { JobAnalysis } from '../components/JobUploader';

function MyComponent() {
  const [selectedGPU, setSelectedGPU] = useState<Provider | null>(null);

  const jobRequirements: JobAnalysis = {
    jobType: 'mnist_training',
    detectedFramework: 'pytorch',
    estimatedVRAM: 8,
    estimatedCompute: 10,
    estimatedRAM: 16,
    estimatedStorage: 5,
    confidence: 'high'
  };

  const availableGPUs: Provider[] = [
    // ... your GPU providers
  ];

  return (
    <SmartMatcher
      jobRequirements={jobRequirements}
      availableGPUs={availableGPUs}
      onGPUSelected={setSelectedGPU}
      selectedGPU={selectedGPU}
    />
  );
}
```

## Props

### `jobRequirements: JobAnalysis` (required)
The analyzed job requirements from JobUploader component.

### `availableGPUs: Provider[]` (required)
Array of available GPU providers to match against.

### `onGPUSelected: (gpu: Provider) => void` (required)
Callback function called when user selects a GPU.

### `selectedGPU?: Provider | null` (optional)
Currently selected GPU (for visual feedback).

## Compatibility Levels

### 🟢 Recommended
- VRAM ratio ≥ 1.5x required
- RAM ratio ≥ 1.3x required
- Best choice for optimal performance

### 🔵 Compatible
- VRAM ratio ≥ 1.2x required
- RAM ratio ≥ 1.1x required
- Good fit, will run well

### 🟡 Borderline
- VRAM ratio ≥ 1.0x required
- RAM ratio ≥ 1.0x required
- Minimum requirements met, may run slower
- Shows warnings

### 🔴 Insufficient
- VRAM or RAM below requirements
- Cannot run the job
- Selection disabled

## Sorting Options

### Best Value (Default)
Sorts by cost-benefit score (performance per dollar).

### Lowest Price
Sorts by estimated total cost (ascending).

### Fastest
Sorts by estimated duration (ascending).

### Available Now
Prioritizes online and available GPUs.

## Cost-Benefit Score

The cost-benefit score (0-100) is calculated as:
- 60% performance score (1000 / duration)
- 40% cost score (1 / cost)
- Normalized to 0-100 range

Higher scores indicate better value for money.

## Benchmark Data

The component uses simplified benchmark data for common GPU models:
- RTX 4090, 4080
- RTX 3090, 3080, 3070, 3060

Supported job types:
- MNIST Training
- Stable Diffusion
- Inference
- Custom Scripts

## Demo

Run the demo page to see the component in action:

```bash
# Navigate to the demo page in your browser
http://localhost:5173/smart-matcher-demo
```

## Integration with JobWizard

The SmartMatcher component is designed to be used in Step 2 of the JobWizard:

```tsx
// In JobWizard Step 2
{currentStep === 2 && (
  <SmartMatcher
    jobRequirements={jobAnalysis}
    availableGPUs={providers}
    onGPUSelected={setSelectedGPU}
    selectedGPU={selectedGPU}
  />
)}
```

## Styling

The component uses:
- TailwindCSS for styling
- Lucide React for icons
- Card components from UI library
- Dark theme with cyan accents
- Smooth transitions and hover effects

## Accessibility

- Keyboard navigation support
- ARIA labels for screen readers
- Color-blind friendly badges
- Clear visual feedback
- Disabled state handling

## Requirements Coverage

✅ 3.1 - Filter marketplace GPUs by compatibility
✅ 3.2 - Mark compatible GPUs with green badges
✅ 3.3 - Show warnings for borderline GPUs
✅ 3.4 - Mark insufficient GPUs red and disable
✅ 3.5 - Sort by cost-benefit ratio by default
✅ 3.6 - Display estimated completion time
✅ 3.7 - Display total cost estimate
✅ 3.8 - Show side-by-side comparison of top 3
✅ 3.8 - Handle GPU selection callback

## Future Enhancements

- Real-time availability updates via WebSocket
- Advanced filtering (location, GPU generation)
- Benchmark data from backend API
- User reviews and ratings
- Historical performance data
- Custom benchmark parameters
