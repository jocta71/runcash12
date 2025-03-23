from enum import Enum
from terminal_table import TERMINAL_TABLE
import logging
from datetime import datetime
import sys
import os

# Importar a tabela de terminais
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from terminal_table import TERMINAL_TABLE

class RouletteState(Enum):
    MORTO = "MORTO"
    NEUTRAL = "NEUTRAL"
    TRIGGER = "TRIGGER"
    POST_GALE_NEUTRAL = "POST_GALE_NEUTRAL"

class StrategyAnalyzer:
    def __init__(self, table_name):
        """Inicializa o analisador de estratégia para uma mesa específica"""
        self.table_name = table_name
        self.numbers = []
        self.max_history = 20  # Máximo de números a manter no histórico
        self.last_update = None
        
        # Variáveis da estratégia
        self.current_state = RouletteState.NEUTRAL
        self.trigger_number = -1
        self.previous_trigger_number = -1
        self.win_count = 0
        self.loss_count = 0
        self.suggestion_display = ""
        
    def add_number(self, number):
        """Adiciona um único número e o processa"""
        return self.add_numbers([number])
        
    def add_numbers(self, new_numbers):
        """Adiciona novos números ao histórico e mantém apenas os mais recentes"""
        if not new_numbers:
            return False
            
        # Adiciona números apenas se forem novos
        changed = False
        for num in new_numbers:
            try:
                # Converta para inteiro, e só adicione se for um número válido (0-36)
                num_int = int(num)
                if 0 <= num_int <= 36 and (not self.numbers or num_int != self.numbers[0]):
                    self.numbers.insert(0, num_int)
                    # Processa o número na estratégia
                    self.process_number(num_int)
                    changed = True
            except (ValueError, TypeError):
                # Ignora valores que não podem ser convertidos para inteiros
                continue
        
        # Limita o tamanho do histórico
        self.numbers = self.numbers[:self.max_history]
        
        if changed:
            self.last_update = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        return changed
        
    def process_number(self, number):
        """
        Processa um novo número seguindo a máquina de estados da estratégia:
        - NEUTRAL: Ignora o primeiro número, define o segundo como gatilho
        - TRIGGER: Verifica o terceiro número contra os terminais do gatilho
        - POST_GALE_NEUTRAL: Verifica o quarto número contra os terminais do gatilho anterior
        - MORTO: Finaliza o ciclo e reseta para NEUTRAL
        """
        old_state = self.current_state
        logging.info(f"[{self.table_name}] Processando número: {number} | Estado atual: {self.current_state.value}")
        
        if self.current_state == RouletteState.MORTO:
            # Reseta para NEUTRAL e não continua o processamento
            self.current_state = RouletteState.NEUTRAL
            logging.info(f"[{self.table_name}] Resetando para NEUTRAL após MORTO")
            return
            
        if self.current_state == RouletteState.NEUTRAL:
            # Define o número como gatilho e muda o estado para TRIGGER
            self.trigger_number = number
            self.current_state = RouletteState.TRIGGER
            
            # Atualiza a sugestão de exibição com os terminais
            self._update_suggestion_display()
            
        elif self.current_state == RouletteState.TRIGGER:
            # Verifica se o número está nos terminais do gatilho
            if self._check_number_in_terminals(number, self.trigger_number):
                # Vitória!
                logging.info(f"[{self.table_name}] Vitória! {number} está nos terminais de {self.trigger_number}")
                self.win_count += 1
                self.current_state = RouletteState.MORTO
            else:
                # Falha, vamos para POST_GALE_NEUTRAL
                self.previous_trigger_number = self.trigger_number
                self.current_state = RouletteState.POST_GALE_NEUTRAL
                logging.info(f"[{self.table_name}] Falha! {number} não está nos terminais de {self.trigger_number}")
                
        elif self.current_state == RouletteState.POST_GALE_NEUTRAL:
            # Verifica se o número está nos terminais do gatilho anterior
            if self._check_number_in_terminals(number, self.previous_trigger_number):
                # Vitória!
                logging.info(f"[{self.table_name}] Vitória após gale! {number} está nos terminais de {self.previous_trigger_number}")
                self.win_count += 1
            else:
                # Derrota!
                logging.info(f"[{self.table_name}] Derrota! {number} não está nos terminais de {self.previous_trigger_number}")
                self.loss_count += 1
                
            # Em ambos os casos, vamos para MORTO
            self.current_state = RouletteState.MORTO
            
        if old_state != self.current_state:
            logging.info(f"[{self.table_name}] Estado alterado: {old_state.value} -> {self.current_state.value}")
            
    def _check_number_in_terminals(self, number, trigger):
        """Verifica se um número está nos terminais do gatilho"""
        if trigger in TERMINAL_TABLE:
            return number in TERMINAL_TABLE[trigger]
        return False
        
    def _update_suggestion_display(self):
        """Atualiza a sugestão de exibição com os terminais do número gatilho"""
        if self.trigger_number in TERMINAL_TABLE:
            # Pegando os 3 primeiros terminais para exibição
            terminals = TERMINAL_TABLE[self.trigger_number][:3]
            self.suggestion_display = ", ".join(map(str, terminals))
        else:
            self.suggestion_display = ""
    
    def get_data(self):
        """Retorna os dados da mesa no formato para armazenamento"""
        # Obter os terminais do número gatilho atual
        terminais_atuais = []
        if self.trigger_number in TERMINAL_TABLE:
            terminais_atuais = TERMINAL_TABLE[self.trigger_number]
        
        # Obter os terminais do número gatilho anterior
        terminais_anteriores = []
        if self.previous_trigger_number in TERMINAL_TABLE:
            terminais_anteriores = TERMINAL_TABLE[self.previous_trigger_number]
        
        estrategia_data = {
            "estado": self.current_state.value,
            "numero_gatilho": self.trigger_number,
            "numero_gatilho_anterior": self.previous_trigger_number,
            "terminais_gatilho": terminais_atuais[:3],  # Apenas os 3 primeiros para exibição
            "terminais_gatilho_anterior": terminais_anteriores[:3],  # Apenas os 3 primeiros para exibição
            "vitorias": self.win_count,
            "derrotas": self.loss_count,
            "sugestao_display": self.suggestion_display
        }
        
        return {
            "numeros": self.numbers,
            "ultima_atualizacao": self.last_update,
            "estrategia": estrategia_data
        }