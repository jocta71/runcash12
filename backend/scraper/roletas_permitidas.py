#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Módulo para gerenciar roletas permitidas
Arquivo separado para facilitar atualizações de configuração
"""

import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

# Obter lista de roletas permitidas do .env ou usar valores padrão
ALLOWED_ROULETTES_STR = os.environ.get('ALLOWED_ROULETTES', '2010016,2380335,2010065,2010096,2010017,2010098')

# Converter string em lista
ALLOWED_ROULETTES = ALLOWED_ROULETTES_STR.split(',')

def roleta_permitida_por_id(roleta_id):
    """
    Verifica se uma roleta está na lista de permitidas pelo ID
    
    Args:
        roleta_id: ID da roleta para verificar
        
    Returns:
        bool: True se a roleta está permitida, False caso contrário
    """
    # Remover qualquer prefixo/sufixo do ID (às vezes ocorre)
    if '_' in roleta_id:
        roleta_id = roleta_id.split('_')[0]
    
    return roleta_id in ALLOWED_ROULETTES

# Para debug
if __name__ == "__main__":
    print(f"Roletas permitidas: {ALLOWED_ROULETTES}") 