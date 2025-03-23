import { io, Socket } from 'socket.io-client';
import { toast } from '@/components/ui/use-toast';
import config from '@/config/env';
import { 
  RouletteNumberEvent,
  RouletteEventCallback,
  StrategyUpdateEvent
} from './EventService';

// Nova interface para eventos recebidos pelo socket
interface SocketEvent {
  type: string;
  roleta_id: string;
  roleta_nome: string;
  [key: string]: any;
}

/**
 * Serviço que gerencia a conexão WebSocket via Socket.IO
 * para receber dados em tempo real do MongoDB
 */
class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private listeners: Map<string, Set<RouletteEventCallback>> = new Map();
  private isConnected: boolean = false;
  private connectionAttempts: number = 0;
  private reconnectTimeout: number | null = null;
  
  private constructor() {
    console.log('[SocketService] Inicializando serviço Socket.IO');
    
    // Adicionar listener global para logging de todos os eventos
    this.subscribe('*', (event: RouletteNumberEvent | StrategyUpdateEvent) => {
      if (event.type === 'new_number') {
        console.log(`[SocketService][GLOBAL] Evento recebido para roleta: ${event.roleta_nome}, número: ${event.numero}`);
      } else if (event.type === 'strategy_update') {
        console.log(`[SocketService][GLOBAL] Atualização de estratégia para roleta: ${event.roleta_nome}, estado: ${event.estado}`);
      }
    });
    
    this.connect();
  }
  
  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }
  
  private getSocketUrl(): string {
    // URL do servidor WebSocket a partir da configuração centralizada
    return config.wsServerUrl;
  }
  
  private connect(): void {
    if (this.socket) {
      console.log('[SocketService] Fechando conexão existente antes de reconectar');
      this.socket.close();
      this.socket = null;
    }
    
    try {
      const socketUrl = this.getSocketUrl();
      console.log(`[SocketService] Tentando conexão Socket.IO: ${socketUrl}`);
      
      // Conectar ao servidor Socket.IO
      this.socket = io(socketUrl, {
        reconnectionAttempts: 10,
        reconnectionDelay: 3000,
        timeout: 15000,
        autoConnect: true,
        transports: ['websocket', 'polling'], // Tentar WebSocket primeiro, depois polling
        forceNew: true,
        extraHeaders: {
          'ngrok-skip-browser-warning': 'true',  // Adicionar para ignorar a proteção do ngrok
          'bypass-tunnel-reminder': 'true',      // Contornar página de lembrete do localtunnel
          'User-Agent': 'Mozilla/5.0 RunCash Custom Client' // User-Agent personalizado
        },
        auth: {
          token: 'anonymous' // Permitir conexão anônima sem autenticação
        }
      });
      
      // Evento de conexão estabelecida
      this.socket.on('connect', () => {
        console.log(`[SocketService] Conexão Socket.IO estabelecida! ID: ${this.socket?.id}`);
        this.isConnected = true;
        this.connectionAttempts = 0;
        
        toast({
          title: "Conexão em tempo real estabelecida",
          description: "Recebendo atualizações instantâneas das roletas via WebSocket",
          variant: "default"
        });
      });
      
      // Evento de desconexão
      this.socket.on('disconnect', (reason) => {
        console.log(`[SocketService] Desconectado do Socket.IO: ${reason}`);
        this.isConnected = false;
        
        // Mostrar toast apenas se for desconexão inesperada
        if (reason !== 'io client disconnect') {
          toast({
            title: "Conexão em tempo real perdida",
            description: "Tentando reconectar...",
            variant: "destructive"
          });
        }
      });
      
      // Evento de erro
      this.socket.on('error', (error) => {
        console.error('[SocketService] Erro na conexão Socket.IO:', error);
      });
      
      // Evento de reconexão
      this.socket.on('reconnect', (attempt) => {
        console.log(`[SocketService] Reconectado após ${attempt} tentativas`);
        this.isConnected = true;
        
        toast({
          title: "Conexão restabelecida",
          description: "Voltando a receber atualizações em tempo real",
          variant: "default"
        });
      });
      
      // Evento de falha na reconexão
      this.socket.on('reconnect_failed', () => {
        console.error('[SocketService] Falha nas tentativas de reconexão');
        
        toast({
          title: "Não foi possível reconectar",
          description: "Por favor, recarregue a página para tentar novamente",
          variant: "destructive"
        });
      });
      
      // Receber novo número
      this.socket.on('new_number', (event: RouletteNumberEvent) => {
        console.log(`[SocketService] Novo número recebido: ${event.roleta_nome} - ${event.numero}`);
        this.notifyListeners(event);
      });
      
      // Receber histórico recente
      this.socket.on('recent_history', (numbers: any[]) => {
        console.log(`[SocketService] Histórico recente recebido: ${numbers.length} números`);
        
        // Processar histórico recente (opcional, depende da lógica de negócio)
        if (numbers && numbers.length > 0) {
          // Ordenar por timestamp, mais recente primeiro
          numbers.sort((a, b) => {
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
          });
          
          // Notificar sobre cada número (pode ser opcional dependendo da UI)
          numbers.forEach(number => {
            // Certificar que o número tem o campo 'type' para compatibilidade
            const formattedNumber: RouletteNumberEvent = {
              type: 'new_number',
              roleta_id: number.roleta_id,
              roleta_nome: number.roleta_nome,
              numero: number.numero,
              timestamp: number.timestamp
            };
            
            this.notifyListeners(formattedNumber);
          });
        }
      });
      
      // Evento para atualizações de estratégia
      this.socket.on('strategy_update', (data: any) => {
        console.log(`[SocketService] Atualização de estratégia recebida para ${data.roleta_nome}`);
        
        // Formatar o evento de estratégia
        const strategyEvent: StrategyUpdateEvent = {
          type: 'strategy_update',
          roleta_id: data.roleta_id,
          roleta_nome: data.roleta_nome,
          estado: data.estado,
          numero_gatilho: data.numero_gatilho || 0,
          terminais_gatilho: data.terminais_gatilho || [],
          vitorias: data.vitorias || 0,
          derrotas: data.derrotas || 0,
          sugestao_display: data.sugestao_display || '',
          timestamp: data.timestamp || new Date().toISOString()
        };
        
        this.notifyListeners(strategyEvent as any);
      });
      
    } catch (error) {
      console.error('[SocketService] Erro ao criar conexão Socket.IO:', error);
      
      // Tentar reconectar após um atraso
      this.scheduleReconnect();
    }
  }
  
  private scheduleReconnect(): void {
    // Limpar timeout existente
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    // Incrementar tentativas
    this.connectionAttempts++;
    
    // Calcular tempo de espera com backoff exponencial
    const delay = Math.min(1000 * Math.pow(1.5, this.connectionAttempts), 30000);
    console.log(`[SocketService] Tentando reconectar em ${Math.round(delay/1000)}s (tentativa ${this.connectionAttempts})`);
    
    // Agendar reconexão
    this.reconnectTimeout = window.setTimeout(() => {
      console.log('[SocketService] Executando reconexão agendada');
      this.connect();
    }, delay);
  }
  
  // Adiciona um listener para eventos de uma roleta específica
  public subscribe(roletaNome: string, callback: RouletteEventCallback): void {
    console.log(`[SocketService] Inscrevendo para eventos da roleta: ${roletaNome}`);
    
    if (!this.listeners.has(roletaNome)) {
      this.listeners.set(roletaNome, new Set());
      
      // Se for uma roleta específica (não o global '*')
      if (roletaNome !== '*' && this.socket && this.isConnected) {
        console.log(`[SocketService] Enviando subscrição para roleta: ${roletaNome}`);
        this.socket.emit('subscribe_to_roleta', roletaNome);
      }
    }
    
    const listeners = this.listeners.get(roletaNome);
    listeners?.add(callback);
    
    const count = listeners?.size || 0;
    console.log(`[SocketService] Total de listeners para ${roletaNome}: ${count}`);
    
    // Verificar conexão ao inscrever um novo listener
    if (!this.isConnected || !this.socket) {
      console.log('[SocketService] Conexão Socket.IO não ativa, reconectando...');
      this.connect();
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
  private notifyListeners(event: RouletteNumberEvent | StrategyUpdateEvent): void {
    // Verificar o tipo de evento para log
    if (event.type === 'new_number') {
      const numEvent = event as RouletteNumberEvent;
      console.log(`[SocketService] Notificando sobre novo número: ${numEvent.roleta_nome} - ${numEvent.numero}`);
    } else if (event.type === 'strategy_update') {
      const stratEvent = event as StrategyUpdateEvent;
      console.log(`[SocketService] Notificando sobre estratégia: ${stratEvent.roleta_nome} - ${stratEvent.estado}`);
    }
    
    // Notificar listeners da roleta específica
    const roletaListeners = this.listeners.get(event.roleta_nome);
    if (roletaListeners && roletaListeners.size > 0) {
      roletaListeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error(`[SocketService] Erro ao notificar listener para ${event.roleta_nome}:`, error);
        }
      });
    }
    
    // Notificar listeners globais (*)
    const globalListeners = this.listeners.get('*');
    if (globalListeners && globalListeners.size > 0) {
      globalListeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('[SocketService] Erro ao notificar listener global:', error);
        }
      });
    }
  }
  
  // Fecha a conexão - chamar quando o aplicativo for encerrado
  public disconnect(): void {
    console.log('[SocketService] Desconectando Socket.IO');
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.isConnected = false;
  }
  
  // Verifica se a conexão está ativa
  public isSocketConnected(): boolean {
    return this.isConnected && !!this.socket;
  }
  
  // Alias para isSocketConnected para compatibilidade com o código existente
  public getConnectionStatus(): boolean {
    return this.isSocketConnected();
  }
  
  // Método para emitir eventos para o servidor
  public emit(eventName: string, data: any): void {
    if (this.socket && this.isConnected) {
      console.log(`[SocketService] Emitindo evento ${eventName}:`, data);
      this.socket.emit(eventName, data);
    } else {
      console.warn(`[SocketService] Tentativa de emitir evento ${eventName} falhou: Socket não conectado`);
    }
  }
  
  // Método para verificar se há dados reais disponíveis
  public hasRealData(): boolean {
    // Se não há conexão, não pode haver dados reais
    if (!this.isConnected || !this.socket) {
      return false;
    }
    
    // A conexão existe, então pode haver dados reais
    return true;
  }
}

export default SocketService; 