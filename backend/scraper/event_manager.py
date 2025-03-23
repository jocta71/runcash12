#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Gerenciador de eventos SSE para o sistema
Minimalista - sem logs
"""

import queue
import time
import threading
import uuid
import logging
from typing import Dict, List, Any, Optional

# Configurar logger - silenciar completamente
logger = logging.getLogger("event_manager")
logger.setLevel(logging.CRITICAL)  # Nível CRITICAL significa nenhum log normal

class EventManager:
    """Gerenciador de eventos usando padrão Singleton"""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EventManager, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
        
    def __init__(self):
        if self._initialized:
            return
            
        # Fila de eventos para histórico
        self.event_queue = queue.Queue(maxsize=100)
        
        # Lista de clientes conectados (filas individuais)
        self.clients = []
        
        # Marcar como inicializado
        self._initialized = True
    
    def register_client(self):
        """Registra um novo cliente e retorna a fila"""
        client_queue = queue.Queue()
        self.clients.append(client_queue)
        return client_queue
        
    def unregister_client(self, client_queue):
        """Remove um cliente"""
        if client_queue in self.clients:
            self.clients.remove(client_queue)
    
    def notify_clients(self, event_data, silent=True):
        """Notifica todos os clientes com os dados do evento"""
        # Adicionar o evento à fila para histórico
        try:
            self.event_queue.put(event_data, block=False)
        except queue.Full:
            # Se a fila estiver cheia, remover o item mais antigo
            try:
                self.event_queue.get(block=False)
                self.event_queue.put(event_data, block=False)
            except:
                pass
        
        # Enviar para cada cliente
        for client_queue in self.clients[:]:
            try:
                client_queue.put(event_data, block=False)
            except:
                self.unregister_client(client_queue)
    
    def get_event_history(self, limit=10):
        """Obtém os últimos eventos da fila de histórico"""
        events = []
        temp_events = []
        
        # Extrair eventos da fila sem removê-los permanentemente
        try:
            while len(events) < limit:
                event = self.event_queue.get(block=False)
                temp_events.append(event)
                events.append(event)
        except queue.Empty:
            pass
        
        # Colocar os eventos de volta na fila
        for event in temp_events:
            try:
                self.event_queue.put(event, block=False)
            except queue.Full:
                break
                
        return events

# Singleton
event_manager = EventManager() 