/**
 * Animation Demo Page
 * Demonstrates all UI/UX animations and interactions
 * Requirements: Task 21 - Polish UI/UX with animations and feedback
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Zap, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  Trash2,
  Play
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { notify, ConfirmDialog } from '../components/ui';
import { Skeleton, SkeletonCard, SkeletonTable, SkeletonStats, SkeletonChart, SkeletonGPUCard } from '../components/ui/Skeleton';
import {
  fadeIn,
  fadeInUp,
  scaleIn,
  slideInLeft,
  slideInRight,
  cardHover,
  gpuCardHover,
  listContainer,
  listItem,
} from '../utils/animations';

export default function AnimationDemo() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);

  const handleToastDemo = (type: 'success' | 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'success':
        notify.success('Operation completed successfully!');
        break;
      case 'error':
        notify.error('An error occurred. Please try again.');
        break;
      case 'warning':
        notify.warning('This action requires your attention.');
        break;
      case 'info':
        notify.info('Here is some helpful information.');
        break;
    }
  };

  const handleLoadingDemo = () => {
    setShowLoading(true);
    const toastId = notify.loading('Processing your request...');
    
    setTimeout(() => {
      notify.dismiss(toastId);
      notify.success('Request completed!');
      setShowLoading(false);
    }, 3000);
  };

  const handleConfirmAction = () => {
    notify.success('Action confirmed!');
    setShowConfirm(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Sparkles className="w-10 h-10 text-cyan-400" />
            Animation & UX Demo
          </h1>
          <p className="text-slate-400 text-lg">
            Showcasing smooth animations, transitions, and user feedback
          </p>
        </motion.div>

        {/* Toast Notifications */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Toast Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button 
                  variant="success" 
                  onClick={() => handleToastDemo('success')}
                  leftIcon={<CheckCircle className="w-4 h-4" />}
                >
                  Success
                </Button>
                <Button 
                  variant="danger" 
                  onClick={() => handleToastDemo('error')}
                  leftIcon={<AlertTriangle className="w-4 h-4" />}
                >
                  Error
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => handleToastDemo('warning')}
                  leftIcon={<AlertTriangle className="w-4 h-4" />}
                >
                  Warning
                </Button>
                <Button 
                  variant="primary" 
                  onClick={() => handleToastDemo('info')}
                  leftIcon={<Zap className="w-4 h-4" />}
                >
                  Info
                </Button>
              </div>
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  onClick={handleLoadingDemo}
                  isLoading={showLoading}
                  fullWidth
                >
                  Loading Demo (3s)
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Confirmation Dialog */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Confirmation Dialogs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button 
                  variant="danger" 
                  onClick={() => setShowConfirm(true)}
                  leftIcon={<Trash2 className="w-4 h-4" />}
                >
                  Delete Action
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => setShowConfirm(true)}
                >
                  Warning Dialog
                </Button>
                <Button 
                  variant="primary" 
                  onClick={() => setShowConfirm(true)}
                >
                  Info Dialog
                </Button>
                <Button 
                  variant="success" 
                  onClick={() => setShowConfirm(true)}
                >
                  Success Dialog
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Card Hover Animations */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Interactive Card Animations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((num) => (
                  <motion.div
                    key={num}
                    variants={cardHover}
                    initial="rest"
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => setSelectedCard(num)}
                  >
                    <Card 
                      variant={selectedCard === num ? 'bordered' : 'default'}
                      className="cursor-pointer"
                    >
                      <CardContent className="p-6 text-center">
                        <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Zap className="w-6 h-6 text-cyan-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">
                          Card {num}
                        </h3>
                        <p className="text-sm text-slate-400">
                          Hover and click to see animations
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* GPU Card Hover */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>GPU Card Hover Effects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['RTX 4090', 'RTX 3090'].map((gpu) => (
                  <motion.div
                    key={gpu}
                    variants={gpuCardHover}
                    initial="rest"
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <Card className="cursor-pointer border-2">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-green-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-base font-semibold text-white">{gpu}</h4>
                            <p className="text-sm text-slate-400">24GB VRAM • Available</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-cyan-400">$2.50/hr</p>
                            <p className="text-xs text-slate-400">~5 min</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* List Stagger Animation */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Staggered List Animation</CardTitle>
            </CardHeader>
            <CardContent>
              <motion.div
                variants={listContainer}
                initial="hidden"
                animate="visible"
                className="space-y-3"
              >
                {['First Item', 'Second Item', 'Third Item', 'Fourth Item', 'Fifth Item'].map((item, idx) => (
                  <motion.div
                    key={idx}
                    variants={listItem}
                  >
                    <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg flex items-center gap-3">
                      <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                        <span className="text-cyan-400 font-semibold">{idx + 1}</span>
                      </div>
                      <span className="text-white">{item}</span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Different Entry Animations */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Entry Animation Variants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div variants={fadeIn} initial="hidden" animate="visible">
                  <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg text-center">
                    <p className="text-white font-medium mb-2">Fade In</p>
                    <p className="text-xs text-slate-400">Opacity transition</p>
                  </div>
                </motion.div>
                
                <motion.div variants={fadeInUp} initial="hidden" animate="visible">
                  <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg text-center">
                    <p className="text-white font-medium mb-2">Fade In Up</p>
                    <p className="text-xs text-slate-400">From bottom</p>
                  </div>
                </motion.div>
                
                <motion.div variants={slideInLeft} initial="hidden" animate="visible">
                  <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg text-center">
                    <p className="text-white font-medium mb-2">Slide Left</p>
                    <p className="text-xs text-slate-400">From left side</p>
                  </div>
                </motion.div>
                
                <motion.div variants={scaleIn} initial="hidden" animate="visible">
                  <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg text-center">
                    <p className="text-white font-medium mb-2">Scale In</p>
                    <p className="text-xs text-slate-400">Spring effect</p>
                  </div>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Loading Skeletons */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Loading Skeletons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-3">Stats Skeleton</h4>
                <SkeletonStats count={4} />
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-3">Card Skeleton</h4>
                <SkeletonCard />
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-3">Table Skeleton</h4>
                <SkeletonTable rows={3} />
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-3">GPU Card Skeleton</h4>
                <SkeletonGPUCard />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Button States */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.8 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Button States & Animations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="success">Success</Button>
                  <Button variant="danger">Danger</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Button variant="primary" size="sm">Small</Button>
                  <Button variant="primary" size="md">Medium</Button>
                  <Button variant="primary" size="lg">Large</Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="primary" isLoading>Loading...</Button>
                  <Button variant="primary" disabled>Disabled</Button>
                </div>
                
                <Button 
                  variant="primary" 
                  fullWidth 
                  leftIcon={<Play className="w-4 h-4" />}
                  rightIcon={<Zap className="w-4 h-4" />}
                >
                  Full Width with Icons
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmAction}
        title="Confirm Action"
        message="Are you sure you want to proceed with this action? This cannot be undone."
        confirmText="Yes, Continue"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
