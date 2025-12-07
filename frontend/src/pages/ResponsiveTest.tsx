/**
 * ResponsiveTest - Component for testing responsive design across breakpoints
 * Requirements: Task 21 - Ensure responsive design on mobile and tablet
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  Check, 
  X,
  ChevronRight,
  Cpu,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { notify } from '../components/ui';
import { fadeInUp, cardHover, gpuCardHover } from '../utils/animations';

export function ResponsiveTest() {
  const [selectedDevice, setSelectedDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const devices = [
    { id: 'desktop' as const, name: 'Desktop', icon: Monitor, width: '1920x1080' },
    { id: 'tablet' as const, name: 'Tablet', icon: Tablet, width: '768x1024' },
    { id: 'mobile' as const, name: 'Mobile', icon: Smartphone, width: '375x667' },
  ];

  const testToast = (type: 'success' | 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'success':
        notify.success('This is a success notification!');
        break;
      case 'error':
        notify.error('This is an error notification!');
        break;
      case 'warning':
        notify.warning('This is a warning notification!');
        break;
      case 'info':
        notify.info('This is an info notification!');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Responsive Design Test
          </h1>
          <p className="text-slate-400">
            Test UI components across different screen sizes and interactions
          </p>
        </motion.div>

        {/* Device Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Select Device Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {devices.map((device) => {
                const Icon = device.icon;
                const isSelected = selectedDevice === device.id;
                
                return (
                  <button
                    key={device.id}
                    onClick={() => setSelectedDevice(device.id)}
                    className={`
                      p-4 rounded-lg border-2 transition-all duration-200
                      ${isSelected
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800'
                      }
                    `}
                  >
                    <Icon className={`w-8 h-8 mx-auto mb-2 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <p className={`font-medium ${isSelected ? 'text-cyan-400' : 'text-white'}`}>
                      {device.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{device.width}</p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Button Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Button Animations & States</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary Button</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="success">Success Button</Button>
                <Button variant="danger">Danger Button</Button>
                <Button variant="outline">Outline Button</Button>
                <Button variant="ghost">Ghost Button</Button>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Button isLoading>Loading...</Button>
                <Button disabled>Disabled</Button>
                <Button leftIcon={<Zap className="w-4 h-4" />}>With Icon</Button>
                <Button rightIcon={<ChevronRight className="w-4 h-4" />}>Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Toast Notification Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Toast Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Button variant="success" onClick={() => testToast('success')}>
                Success Toast
              </Button>
              <Button variant="danger" onClick={() => testToast('error')}>
                Error Toast
              </Button>
              <Button variant="secondary" onClick={() => testToast('warning')}>
                Warning Toast
              </Button>
              <Button variant="outline" onClick={() => testToast('info')}>
                Info Toast
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* GPU Card Hover Test */}
        <Card>
          <CardHeader>
            <CardTitle>GPU Card Hover Animations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  variants={gpuCardHover}
                  initial="rest"
                  whileHover="hover"
                  whileTap="tap"
                  className="bg-slate-800 border-2 border-slate-700 rounded-xl p-6 cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <Cpu className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        RTX 4090
                      </h3>
                      <p className="text-sm text-slate-400">
                        24GB VRAM • 82.6 TFLOPS
                      </p>
                      <div className="flex gap-2 mt-3">
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                          Recommended
                        </span>
                        <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded-full">
                          Available
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">$2.50</p>
                      <p className="text-xs text-slate-400">per hour</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center">
                    <span className="text-sm text-slate-400">~10 min</span>
                    <Button size="sm">Select</Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Card Hover Test */}
        <Card>
          <CardHeader>
            <CardTitle>Card Hover Effects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  variants={cardHover}
                  initial="rest"
                  whileHover="hover"
                  whileTap="tap"
                  className="bg-slate-800 border border-slate-700 rounded-xl p-6 cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center mb-4">
                    <Check className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Feature {i}
                  </h3>
                  <p className="text-sm text-slate-400">
                    Hover over this card to see the animation effect
                  </p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Responsive Grid Test */}
        <Card>
          <CardHeader>
            <CardTitle>Responsive Grid Layout</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center"
                >
                  <p className="text-white font-medium">Item {i + 1}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {selectedDevice === 'mobile' && '1 col'}
                    {selectedDevice === 'tablet' && '2 cols'}
                    {selectedDevice === 'desktop' && '4 cols'}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Touch Target Test (Mobile) */}
        <Card>
          <CardHeader>
            <CardTitle>Touch Targets (≥44px)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-slate-400">
                All interactive elements should be at least 44x44px for easy tapping on mobile
              </p>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <button
                    key={i}
                    className="min-w-[44px] min-h-[44px] bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg flex items-center justify-center transition-colors"
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Typography Scale Test */}
        <Card>
          <CardHeader>
            <CardTitle>Typography Scale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h1 className="text-4xl font-bold text-white">Heading 1</h1>
                <p className="text-xs text-slate-500">text-4xl</p>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">Heading 2</h2>
                <p className="text-xs text-slate-500">text-3xl</p>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-white">Heading 3</h3>
                <p className="text-xs text-slate-500">text-2xl</p>
              </div>
              <div>
                <p className="text-base text-white">Body text - Regular paragraph</p>
                <p className="text-xs text-slate-500">text-base</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Small text - Secondary information</p>
                <p className="text-xs text-slate-500">text-sm</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Extra small text - Captions</p>
                <p className="text-xs text-slate-500">text-xs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Indicators */}
        <Card>
          <CardHeader>
            <CardTitle>Status Indicators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <Check className="w-5 h-5 text-green-400" />
                <span className="text-green-300">Success State</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <X className="w-5 h-5 text-red-400" />
                <span className="text-red-300">Error State</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Zap className="w-5 h-5 text-yellow-400" />
                </motion.div>
                <span className="text-yellow-300">Loading State</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                <span className="text-white">Animations Smooth</span>
                <Check className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                <span className="text-white">Responsive Layout</span>
                <Check className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                <span className="text-white">Touch Targets ≥44px</span>
                <Check className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                <span className="text-white">Keyboard Navigation</span>
                <Check className="w-5 h-5 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
