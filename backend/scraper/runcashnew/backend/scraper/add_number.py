import os
import random
from dotenv import load_dotenv
from supabase import create_client
from datetime import datetime

# Carregar variáveis de ambiente
load_dotenv()

# Configuração do Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Inicialização do cliente Supabase
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def adicionar_numero_aleatorio():
    """Adiciona um número aleatório à roleta"""
    try:
        # Gerar um número aleatório entre 0 e 36
        novo_numero = random.randint(0, 36)
        print(f"Número aleatório gerado: {novo_numero}")
        
        # Nome da roleta
        nome_roleta = "Ruleta XL"
        id_roleta = "2341648"
        
        # Obter os números atuais da roleta
        response = supabase.table("roletas").select("numeros").eq("id", id_roleta).execute()
        
        if response.data and len(response.data) > 0:
            numeros_atuais = response.data[0].get("numeros", [])
            print(f"Números atuais: {numeros_atuais}")
        else:
            numeros_atuais = []
            print("Nenhum número encontrado. Criando nova lista.")
        
        # Adicionar o novo número no início da lista (mais recente)
        numeros_atuais.insert(0, novo_numero)
        
        # Limitar a lista a 1000 números
        if len(numeros_atuais) > 1000:
            numeros_atuais = numeros_atuais[:1000]
        
        # Atualizar os dados no Supabase
        registro = {
            "id": id_roleta,
            "nome": nome_roleta,
            "numeros": numeros_atuais,
            "updated_at": datetime.now().isoformat()
        }
        
        response = supabase.table("roletas").upsert(registro).execute()
        
        print(f"Número {novo_numero} adicionado com sucesso à roleta '{nome_roleta}'")
        print(f"Total de números: {len(numeros_atuais)}")
        print(f"Últimos 5 números: {numeros_atuais[:5]}")
        
        return True
    
    except Exception as e:
        print(f"Erro ao adicionar número: {str(e)}")
        return False

if __name__ == "__main__":
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Erro: SUPABASE_URL e SUPABASE_KEY devem ser definidos no arquivo .env")
        exit(1)
    
    adicionar_numero_aleatorio() 