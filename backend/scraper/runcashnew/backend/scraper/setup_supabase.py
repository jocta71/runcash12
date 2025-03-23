import os
from dotenv import load_dotenv
from supabase import create_client
import json

# Carregar variáveis de ambiente
load_dotenv()

# Configuração do Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Inicialização do cliente Supabase
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def setup_database():
    """Configura a tabela necessária no Supabase"""
    try:
        print("Verificando se a tabela 'roletas' existe...")
        
        # Tentar selecionar da tabela para ver se existe
        response = supabase.table("roletas").select("*").execute()
        print("Tabela 'roletas' já existe. Verificando conteúdo...")
        
        print("Configuração do banco de dados concluída.")
        
    except Exception as e:
        print(f"Erro ao verificar tabela: {str(e)}")
        print("Provavelmente a tabela 'roletas' não existe.")
        print("Para criar a tabela, execute o seguinte SQL no dashboard do Supabase:")
        print("""
        CREATE TABLE roletas (
            id TEXT PRIMARY KEY,
            nome TEXT NOT NULL,
            numeros JSONB NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """)
        
def limpar_dados_antigos():
    """Limpa os dados antigos da tabela (opcional)"""
    try:
        print("Limpando dados antigos...")
        response = supabase.table("roletas").delete().neq("id", "").execute()
        print(f"Dados antigos removidos: {len(response.data)} registros")
    except Exception as e:
        print(f"Erro ao limpar dados: {str(e)}")

if __name__ == "__main__":
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Erro: SUPABASE_URL e SUPABASE_KEY devem ser definidos no arquivo .env")
        exit(1)
    
    setup_database()
    # Descomente a linha abaixo se quiser limpar todos os dados
    # limpar_dados_antigos()
