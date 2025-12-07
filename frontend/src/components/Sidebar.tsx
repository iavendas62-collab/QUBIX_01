import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Cpu, 
  HardDrive, 
  Network, 
  DollarSign, 
  BookOpen, 
  MessageCircle, 
  Settings 
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { 
    name: 'Compute', 
    icon: Cpu,
    children: [
      { name: 'GPU Marketplace', href: '/compute/gpu-marketplace' },
      { name: 'My Instances', href: '/compute/instances' },
      { name: 'Launch Instance', href: '/compute/launch' },
    ]
  },
  { 
    name: 'Storage', 
    icon: HardDrive,
    children: [
      { name: 'Datasets', href: '/storage/datasets' },
      { name: 'Models', href: '/storage/models' },
      { name: 'Snapshots', href: '/storage/snapshots' },
    ]
  },
  { name: 'Network', href: '/network', icon: Network },
  { name: 'Billing & Usage', href: '/billing', icon: DollarSign },
  { name: 'Documentation', href: '/docs', icon: BookOpen },
  { name: 'Support', href: '/support', icon: MessageCircle },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="w-64 bg-[#232F3E] text-white h-screen fixed left-0 top-0 overflow-y-auto">
      {/* Logo */}
      <div className="p-4 border-b border-gray-700">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-[#FF9900] rounded flex items-center justify-center font-bold">
            Q
          </div>
          <span className="text-xl font-semibold">QUBIX</span>
        </Link>
        <p className="text-xs text-gray-400 mt-1">Compute Hub</p>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {navigation.map((item) => (
          <div key={item.name}>
            {item.children ? (
              <div>
                <div className="flex items-center px-3 py-2 text-sm font-medium text-gray-300">
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </div>
                <div className="ml-8 space-y-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.name}
                      to={child.href}
                      className={`block px-3 py-2 text-sm rounded transition ${
                        location.pathname === child.href
                          ? 'bg-[#FF9900] text-white'
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link
                to={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded transition ${
                  location.pathname === item.href
                    ? 'bg-[#FF9900] text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* User Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold">U</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">User Account</p>
            <p className="text-xs text-gray-400 truncate">0x1234...5678</p>
          </div>
        </div>
      </div>
    </div>
  );
}

