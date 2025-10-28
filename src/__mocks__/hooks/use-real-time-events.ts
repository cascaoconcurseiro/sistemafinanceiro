// Mock global para use-real-time-events
export const useRealTimeEvents = jest.fn(() => ({
  isConnected: false,
  connectionError: null,
  lastEvent: null,
  connect: jest.fn(),
  disconnect: jest.fn(),
  reconnect: jest.fn(),
}));

export const useEventListener = jest.fn();

export const useMultipleEventListeners = jest.fn();

export const useAutoRefresh = jest.fn();