import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageContext';
import { ErrorBoundary, Toaster, Skeleton } from './components/ui';

// Eagerly loaded - critical for initial render
import LandingPage from './pages/LandingPage';

// Lazy loaded - code splitting for better performance
const QuickProviderDemo = lazy(() => import('./pages/QuickProviderDemo'));
const JobUploaderDemo = lazy(() => import('./pages/JobUploaderDemo').then(m => ({ default: m.JobUploaderDemo })));
const JobWizardDemo = lazy(() => import('./pages/JobWizardDemo'));
const JobMonitorDemo = lazy(() => import('./pages/JobMonitorDemo'));
const ProviderEarningsDemo = lazy(() => import('./pages/ProviderEarningsDemo'));
const TransactionHistoryDemo = lazy(() => import('./pages/TransactionHistoryDemo'));

// Auth Pages
const ProfileSelector = lazy(() => import('./pages/ProfileSelector'));

// App Layout with Sidebar
const AppLayout = lazy(() => import('./layouts/AppLayout'));

// Consumer Pages - lazy loaded
const ConsumerDashboard = lazy(() => import('./pages/consumer/Dashboard'));
const Marketplace = lazy(() => import('./pages/consumer/Marketplace'));
const GPUDetails = lazy(() => import('./pages/consumer/GPUDetails'));
const RentGPU = lazy(() => import('./pages/consumer/RentGPU'));
const MyInstances = lazy(() => import('./pages/consumer/MyInstances'));
const InstanceDetails = lazy(() => import('./pages/consumer/InstanceDetails'));
const Jobs = lazy(() => import('./pages/consumer/Jobs'));
const JobSubmit = lazy(() => import('./pages/consumer/JobSubmit'));
const JobDetails = lazy(() => import('./pages/consumer/JobDetails'));

// Provider Pages - lazy loaded
const ProviderDashboard = lazy(() => import('./pages/provider/Dashboard'));
const ProviderDashboardSimple = lazy(() => import('./pages/provider/DashboardSimple'));
const MyHardware = lazy(() => import('./pages/provider/MyHardware'));
const AddHardware = lazy(() => import('./pages/provider/AddHardware'));
const HardwareDetails = lazy(() => import('./pages/provider/HardwareDetails'));
const ProviderMonitor = lazy(() => import('./pages/provider/Monitor'));
const Earnings = lazy(() => import('./pages/provider/Earnings'));

// General Pages - lazy loaded
const Payments = lazy(() => import('./pages/general/Payments'));
const Account = lazy(() => import('./pages/general/Account'));

// Qubic Wallet - lazy loaded
const QubicWallet = lazy(() => import('./pages/QubicWallet').then(m => ({ default: m.QubicWallet })));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-black text-white flex items-center justify-center">
    <div className="w-full max-w-4xl p-8 space-y-4">
      <div className="animate-pulse">
        <div className="h-12 bg-slate-800 rounded-lg w-3/4 mb-4"></div>
        <div className="h-64 bg-slate-800 rounded-lg w-full mb-4"></div>
        <div className="grid grid-cols-3 gap-4">
          <div className="h-32 bg-slate-800 rounded-lg"></div>
          <div className="h-32 bg-slate-800 rounded-lg"></div>
          <div className="h-32 bg-slate-800 rounded-lg"></div>
        </div>
      </div>
    </div>
  </div>
);

function App() {
  // Para hackathon: sempre autenticado, sem login/registro
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
  };

  return (
    <ErrorBoundary>
      <LanguageProvider>
        {/* Global Toast Notifications */}
        <Toaster />

        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <Suspense fallback={<PageLoader />}>
            <Routes>
            {/* ========== PUBLIC ROUTES ========== */}
            <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
            <Route path="/share-gpu" element={<QuickProviderDemo />} />
            <Route path="/job-uploader-demo" element={<JobUploaderDemo />} />
            <Route path="/job-wizard-demo" element={<JobWizardDemo />} />
            <Route path="/job-monitor-demo" element={<JobMonitorDemo />} />
            <Route path="/provider-earnings-demo" element={<ProviderEarningsDemo />} />
            <Route path="/transaction-history-demo" element={<TransactionHistoryDemo />} />

          {/* ========== DEMO ROUTES ========== */}
          <Route path="/onboarding" element={<ProfileSelector />} />

          {/* ========== APP ROUTES (with sidebar) ========== */}
          <Route path="/app" element={
            <ProtectedRoute><AppLayout /></ProtectedRoute>
          }>
            {/* Consumer Routes */}
            <Route path="dashboard" element={<ConsumerDashboard />} />
            <Route path="marketplace" element={<Marketplace />} />
            <Route path="marketplace/:gpuId" element={<GPUDetails />} />
            <Route path="rent/:gpuId" element={<RentGPU />} />
            <Route path="instances" element={<MyInstances />} />
            <Route path="instances/:instanceId" element={<InstanceDetails />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="jobs/submit" element={<JobSubmit />} />
            <Route path="jobs/submit/:gpuId" element={<JobSubmit />} />
            <Route path="jobs/:jobId" element={<JobDetails />} />

            {/* Provider Routes */}
            <Route path="provider" element={<ProviderDashboard />} />
            <Route path="provider/test" element={<ProviderDashboardSimple />} />
            <Route path="provider/hardware" element={<MyHardware />} />
            <Route path="provider/hardware/add" element={<AddHardware />} />
            <Route path="provider/hardware/:machineId" element={<HardwareDetails />} />
            <Route path="provider/monitor" element={<ProviderMonitor />} />
            <Route path="provider/earnings" element={<Earnings />} />

            {/* General Routes */}
            <Route path="payments" element={<Payments />} />
            <Route path="account" element={<Account />} />

            {/* Qubic Wallet */}
            <Route path="wallet" element={<QubicWallet />} />

            {/* Default redirect */}
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* Legacy redirects */}
          <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/provider" element={<Navigate to="/app/provider" replace />} />
          <Route path="/consumer" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/select-profile" element={<Navigate to="/onboarding" replace />} />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </LanguageProvider>
  </ErrorBoundary>
  );
}

export default App;

