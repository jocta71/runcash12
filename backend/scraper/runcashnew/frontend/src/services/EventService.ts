// Serviço para gerenciar eventos em tempo real usando Server-Sent Events (SSE)
import { toast } from '@/components/ui/use-toast';
import config from '@/config/env';

// Definição dos tipos de eventos
export interface RouletteNumberEvent {
  type: 'new_number';
  roleta_id: string;
  roleta_nome: string;
  numero: number;
  timestamp: string;
}

export interface ConnectedEvent {
  type: 'connected';
  message: string;
}

export type EventData = RouletteNumberEvent | ConnectedEvent;

// Tipo para callbacks de eventos
export type RouletteEventCallback = (event: RouletteNumberEvent) => void;

// Serviço de eventos
class EventService {
  private static instance: EventService;
  private eventSource: EventSource | null = null;
  private listeners: Map<string, Set<RouletteEventCallback>> = new Map();
  private isConnected: boolean = false;
  private connectionAttempts: number = 0;
  private reconnectTimeout: number | null = null;
  private backoffTime: number = 1000; // Tempo inicial de backoff em ms

  // Obtém a URL do servidor de eventos da configuração centralizada
  private getServerUrl(): string {
    console.log(`[EventService] Usando URL do servidor de eventos: ${config.sseServerUrl}`);
    return config.sseServerUrl;
  }

  private constructor() {
    this.connect();
    console.log('EventService inicializado');
  }

  public static getInstance(): EventService {
    if (!EventService.instance) {
      EventService.instance = new EventService();
    }
    return EventService.instance;
  }

  private connect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    try {
      const serverUrl = this.getServerUrl();
      console.log(`Conectando ao servidor de eventos: ${serverUrl}`);
      this.eventSource = new EventSource(serverUrl);

      this.eventSource.onopen = () => {
        console.log('Conexão SSE estabelecida');
        this.isConnected = true;
        this.connectionAttempts = 0;
        this.backoffTime = 1000; // Resetar o tempo de backoff
        
        toast({
          title: "Conexão em tempo real estabelecida",
          description: "Você receberá atualizações automáticas das roletas",
          variant: "default"
        });
      };

      this.eventSource.onerror = (error) => {
        console.error('Erro na conexão SSE:', error);
        this.isConnected = false;
        
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }

        // Tentar reconectar com backoff exponencial
        this.connectionAttempts++;
        const delay = Math.min(this.backoffTime * Math.pow(1.5, this.connectionAttempts - 1), 30000);
        
        console.log(`Tentando reconectar em ${delay}ms (tentativa ${this.connectionAttempts})`);
        
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
        }
        
        this.reconnectTimeout = window.setTimeout(() => {
          this.connect();
        }, delay);
        
        if (this.connectionAttempts > 3) {
          toast({
            title: "Problemas de conexão",
            description: "Tentando reconectar ao servidor de eventos...",
            variant: "destructive"
          });
        }
      };

      this.eventSource.onmessage = (event) => {
        try {
          // Log do evento bruto para depuração
          console.log(`[SSE][RAW] Evento recebido:`, event.data);
          
          const data = JSON.parse(event.data) as EventData;
          
          if (data.type === 'new_number') {
            console.log(`[SSE][EVENT] Novo número recebido para ${data.roleta_nome}: ${data.numero}`);
            
            // Verificar quantos listeners estão registrados para esta roleta
            const roletaListeners = this.listeners.get(data.roleta_nome);
            const globalListeners = this.listeners.get('*');
            
            console.log(`[SSE][STATS] Listeners para ${data.roleta_nome}: ${roletaListeners?.size || 0}`);
            console.log(`[SSE][STATS] Listeners globais: ${globalListeners?.size || 0}`);
            
            this.notifyListeners(data);
          } else if (data.type === 'connected') {
            console.log('[SSE][CONN] Conexão confirmada pelo servidor:', data.message);
          } else {
            console.log(`[SSE][UNKNOWN] Tipo de evento desconhecido:`, data);
          }
        } catch (error) {
          console.error('[SSE][ERROR] Erro ao processar evento:', error, 'Dados brutos:', event.data);
        }
      };
    } catch (error) {
      console.error('Erro ao criar conexão SSE:', error);
      this.isConnected = false;
    }
  }

  // Adiciona um listener para eventos de uma roleta específica
  public subscribe(roletaNome: string, callback: RouletteEventCallback): void {
    console.log(`[SSE][SUB] Tentando inscrever para eventos da roleta: ${roletaNome}`);
    
    if (!this.listeners.has(roletaNome)) {
      console.log(`[SSE][SUB] Criando novo conjunto de listeners para ${roletaNome}`);
      this.listeners.set(roletaNome, new Set());
    }

    const listeners = this.listeners.get(roletaNome);
    listeners?.add(callback);
    
    const count = listeners?.size || 0;
    console.log(`[SSE][SUB] Inscrito para eventos da roleta: ${roletaNome}. Total de listeners: ${count}`);
    
    // Verificar se a conexão SSE está ativa
    if (!this.isConnected || !this.eventSource) {
      console.log(`[SSE][SUB] Conexão SSE não está ativa. Tentando reconectar...`);
      this.connect();
    } else {
      console.log(`[SSE][SUB] Conexão SSE já está ativa.`);
    }
  }

  // Remove um listener
  public unsubscribe(roletaNome: string, callback: RouletteEventCallback): void {
    const callbacks = this.listeners.get(roletaNome);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(roletaNome);
      }
    }
  }

  // Notifica os listeners sobre um novo evento
  private notifyListeners(event: RouletteNumberEvent): void {
    console.log(`[SSE][NOTIFY] Notificando listeners para ${event.roleta_nome}, número: ${event.numero}`);
    
    // Notificar listeners da roleta específica
    const roletaListeners = this.listeners.get(event.roleta_nome);
    if (roletaListeners && roletaListeners.size > 0) {
      console.log(`[SSE][NOTIFY] Encontrados ${roletaListeners.size} listeners para ${event.roleta_nome}`);
      roletaListeners.forEach(callback => {
        try {
          console.log(`[SSE][NOTIFY] Chamando callback para ${event.roleta_nome}`);
          callback(event);
        } catch (error) {
          console.error(`[SSE][ERROR] Erro ao chamar callback para ${event.roleta_nome}:`, error);
        }
      });
    } else {
      console.log(`[SSE][NOTIFY] Nenhum listener encontrado para ${event.roleta_nome}`);
    }
    
    // Notificar listeners globais (*)
    const globalListeners = this.listeners.get('*');
    if (globalListeners && globalListeners.size > 0) {
      console.log(`[SSE][NOTIFY] Notificando ${globalListeners.size} listeners globais`);
      globalListeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('[SSE][ERROR] Erro ao chamar callback global:', error);
        }
      });
    }
  }

  // Fecha a conexão - chamar quando o aplicativo for encerrado
  public disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.isConnected = false;
    console.log('Desconectado do servidor de eventos');
  }
}

export default EventService; 