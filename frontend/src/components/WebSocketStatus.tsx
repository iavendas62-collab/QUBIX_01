import { useWebSocket } from '../hooks/useWebSocket';

export function WebSocketStatus() {
  const { isConnected, connectionState } = useWebSocket();

  const getStatusColor = () => {
    if (isConnected) return 'bg-green-500';
    if (connectionState === 'CONNECTING') return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusText = () => {
    if (isConnected) return 'Connected';
    if (connectionState === 'CONNECTING') return 'Connecting...';
    return 'Disconnected';
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
      <span className="text-gray-600">{getStatusText()}</span>
    </div>
  );
}
