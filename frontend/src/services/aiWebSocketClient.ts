export interface PredictionEvent {
  pred_word?: string;
  confidence?: number;
  landmarks?: number[][];
  error?: string;
}

export type ConnectionState = "connecting" | "connected" | "disconnected" | "error";

export class AIWebSocketClient {
  private url: string;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: ((event: PredictionEvent) => void)[] = [];
  private stateListeners: ((state: ConnectionState) => void)[] = [];

  constructor(serverIp?: string) {
    const ip = serverIp || process.env.EXPO_PUBLIC_AI_SERVER_IP || "192.168.1.5";
    this.url = `ws://${ip}:8000/ws/live`;
  }

  public connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.notifyState("connecting");

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.notifyState("connected");
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const data: PredictionEvent = JSON.parse(event.data);
          this.listeners.forEach((fn) => fn(data));
        } catch (_) {}
      };

      this.ws.onerror = () => {
        this.notifyState("error");
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        this.notifyState("disconnected");
        this.attemptReconnect();
      };
    } catch {
      this.notifyState("error");
    }
  }

  public disconnect(): void {
    this.stopHeartbeat();
    this.reconnectAttempts = this.maxReconnectAttempts; // prevent reconnect
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.notifyState("disconnected");
  }

  public sendFrame(base64Frame: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ frame: base64Frame }));
    }
  }

  public onPrediction(callback: (event: PredictionEvent) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((fn) => fn !== callback);
    };
  }

  public onStateChange(callback: (state: ConnectionState) => void): () => void {
    this.stateListeners.push(callback);
    return () => {
      this.stateListeners = this.stateListeners.filter((fn) => fn !== callback);
    };
  }

  private notifyState(state: ConnectionState): void {
    this.stateListeners.forEach((fn) => fn(state));
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "ping" }));
      }
    }, 15000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.pow(2, this.reconnectAttempts) * 1000;
      this.reconnectAttempts += 1;
      setTimeout(() => {
        this.connect();
      }, delay);
    }
  }
}
