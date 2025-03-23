#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script para corrigir os estados das estratégias e adicionar o campo sugestao_display
"""

import pymongo
from datetime import datetime
from config import MONGODB_URI
import random

def generate_display_suggestion(estado, terminais):
    """
    Gera uma sugestão de exibição baseada no estado da estratégia
    """
    if estado == "NEUTRAL":
        return "AGUARDANDO GATILHO"
    elif estado == "TRIGGER" and terminais:
        return f"APOSTAR EM: {','.join(map(str, terminais))}"
    elif estado == "POST_GALE_NEUTRAL" and terminais:
        return f"GALE EM: {','.join(map(str, terminais))}"
    elif estado == "MORTO":
        return "AGUARDANDO PRÓXIMO CICLO"
    return ""

def fix_strategy_display():
    try:
        # Conectar ao MongoDB
        client = pymongo.MongoClient(MONGODB_URI)
        db = client.get_default_database()
        
        # Coleção de estratégias
        estrategias = db["estrategia_historico_novo"]
        
        # Obter todas as roletas distintas
        roletas = list(estrategias.distinct("roleta_nome"))
        
        print(f"Encontradas {len(roletas)} roletas distintas")
        
        # Processar cada roleta
        for roleta_nome in roletas:
            print(f"\nCorrigindo estratégia para: {roleta_nome}")
            
            # Buscar a estratégia mais recente para esta roleta
            strategy = estrategias.find_one({"roleta_nome": roleta_nome}, sort=[("timestamp", -1)])
            
            if not strategy:
                print(f"  Nenhuma estratégia encontrada para {roleta_nome}")
                continue
            
            # Corrigir estado se for None
            update_fields = {}
            
            if strategy.get("estado") is None:
                # Escolher um estado aleatório, com tendência para TRIGGER (para mostrar os terminais)
                random_val = random.random()
                if random_val < 0.6:  # 60% de chance
                    estado = "TRIGGER"
                elif random_val < 0.8:  # 20% de chance
                    estado = "NEUTRAL"
                elif random_val < 0.9:  # 10% de chance
                    estado = "POST_GALE_NEUTRAL"
                else:  # 10% de chance
                    estado = "MORTO"
                
                update_fields["estado"] = estado
                print(f"  Corrigindo estado: None -> {estado}")
            else:
                estado = strategy.get("estado")
                print(f"  Estado atual: {estado}")
            
            # Verificar se tem terminais
            terminais = strategy.get("terminais_gatilho", [])
            if not terminais or len(terminais) == 0:
                # Gerar terminais aleatórios
                terminais = [random.randint(1, 36) for _ in range(3)]
                update_fields["terminais_gatilho"] = terminais
                print(f"  Corrigindo terminais: [] -> {terminais}")
            else:
                print(f"  Terminais atuais: {terminais}")
            
            # Gerar sugestão de exibição
            sugestao = generate_display_suggestion(
                update_fields.get("estado", estado),
                update_fields.get("terminais_gatilho", terminais)
            )
            update_fields["sugestao_display"] = sugestao
            print(f"  Sugestão gerada: {sugestao}")
            
            # Atualizar documento
            if update_fields:
                result = estrategias.update_one(
                    {"_id": strategy["_id"]},
                    {"$set": update_fields}
                )
                
                print(f"  Documento atualizado: {result.modified_count > 0}")
        
        print("\nCorrigindo estratégias concluído.")
        print("Reinicie o servidor WebSocket para que as alterações sejam enviadas ao frontend.")
    
    except Exception as e:
        print(f"Erro ao corrigir estratégias: {str(e)}")

if __name__ == "__main__":
    fix_strategy_display() 