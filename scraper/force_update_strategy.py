# Estados possíveis
ESTADOS = ["NEUTRAL", "TRIGGER", "POST_GALE_NEUTRAL", "MORTO"]

# Conectar ao MongoDB
def force_update_strategies():
    """Atualiza estratégias com estados aleatórios para simulação"""
    try:
        # Conectar ao MongoDB
        client = MongoClient('mongodb://localhost:27017/runcash')
        db = client.runcash
        
        # Pegar todas as roletas
        roletas = list(db.roletas.find({}))
        logger.info(f"Encontradas {len(roletas)} roletas para atualizar")
        
        # Para cada roleta, atualizar com estado aleatório
        for i, roleta in enumerate(roletas):
            roleta_id = roleta.get("_id") or roleta.get("id")
            roleta_nome = roleta.get("nome")
            
            if not roleta_id or not roleta_nome:
                logger.warning(f"Roleta com dados incompletos, ignorando: {roleta}")
                continue
            
            # Garantir diferentes estados na simulação
            # Forçar algumas roletas a ficarem em estados específicos
            if i % 4 == 0:  # A cada 4 roletas, uma fica em TRIGGER
                estado = "TRIGGER"
            elif i % 4 == 1:  # Uma fica em NEUTRAL
                estado = "NEUTRAL"
            elif i % 4 == 2:  # Uma fica em POST_GALE_NEUTRAL
                estado = "POST_GALE_NEUTRAL"
            else:  # Uma fica em MORTO
                estado = "MORTO"
            
            # Se for TRIGGER, gerar terminais
            terminais = []
            if estado == "TRIGGER" or estado == "POST_GALE_NEUTRAL":
                num_gatilho = random.randint(1, 36)
                # Gerar 3 terminais baseados no número
                terminais = [(num_gatilho + i) % 10 for i in range(1, 4)]
                # Garantir que os terminais são números válidos de 1-9
                terminais = [t if t > 0 else t+1 for t in terminais]
            else:
                num_gatilho = None
            
            # Gerar vitórias e derrotas aleatórias
            vitorias = random.randint(1, 5)  # Garantir pelo menos 1 vitória
            derrotas = random.randint(0, 3)
            
            # Criar timestamp atual
            timestamp = datetime.now().isoformat()
            
            # Inserir nova entrada na coleção de histórico
            db.estrategia_historico_novo.insert_one({
                "roleta_id": roleta_id,
                "roleta_nome": roleta_nome,
                "estado": estado,
                "numero_gatilho": num_gatilho,
                "terminais_gatilho": terminais,
                "timestamp": timestamp,
                "vitorias": vitorias,
                "derrotas": derrotas
            })
            
            # Atualizar documento na coleção principal
            db.roletas.update_one(
                {"_id": roleta_id},
                {
                    "$set": {
                        "estado_estrategia": estado,
                        "numero_gatilho": num_gatilho,
                        "terminais_gatilho": terminais,
                        "vitorias": vitorias,
                        "derrotas": derrotas,
                        "updated_at": timestamp
                    }
                }
            )
            
            logger.info(f"Roleta {roleta_nome} atualizada para estado {estado} com {vitorias}W/{derrotas}L")
        
        logger.info("Todas as estratégias foram atualizadas com sucesso!")
        return True
    except Exception as e:
        logger.error(f"Erro ao atualizar estratégias: {e}")
        return False 