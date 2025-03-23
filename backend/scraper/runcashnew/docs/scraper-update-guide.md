# Guia para Atualizar o Scraper para a Nova Estrutura de Tabela

## Alterações Necessárias

Atualmente, o scraper coleta números das roletas e os armazena na tabela `roletas` como um array na coluna `numeros`. Com a nova tabela `roleta_numeros`, precisamos modificar o scraper para:

1. Continuar coletando os números das roletas
2. Inserir cada novo número como um registro individual na tabela `roleta_numeros`
3. Opcionalmente, manter a atualização do campo `numeros` na tabela `roletas` para compatibilidade

## Passos para Implementação

### 1. Atualizar as Funções de Conexão com o Supabase

Adicione uma nova função para inserir números na tabela `roleta_numeros`:

```python
def insert_roleta_numero(roleta_id, roleta_nome, numero):
    """
    Insere um novo número na tabela roleta_numeros
    """
    url = "https://evzqzghxuttctbxgohpx.supabase.co/rest/v1/roleta_numeros"
    headers = {
        "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    
    data = {
        "roleta_id": roleta_id,
        "roleta_nome": roleta_nome,
        "numero": numero,
        "created_at": datetime.now().isoformat()
    }
    
    response = requests.post(url, headers=headers, json=data)
    return response.status_code == 201  # Retorna True se a inserção for bem-sucedida
```

### 2. Modificar a Função que Processa Novos Números

Quando um novo número é detectado, além de atualizar o array `numeros` na tabela `roletas`, insira também na nova tabela:

```python
def process_new_number(roleta_id, roleta_nome, new_number, current_numbers):
    """
    Processa um novo número detectado
    """
    # Atualiza a tabela roletas (manter para compatibilidade)
    updated_numbers = [new_number] + current_numbers
    update_roleta(roleta_id, updated_numbers)
    
    # Insere na nova tabela roleta_numeros
    insert_roleta_numero(roleta_id, roleta_nome, new_number)
    
    print(f"[{datetime.now()}] Novo número para {roleta_nome}: {new_number}")
```

### 3. Eventual Migração Completa

Após confirmar que a nova tabela está funcionando corretamente, você pode considerar:

1. Migrar os números históricos para a nova tabela
2. Remover a lógica de atualização do array `numeros` na tabela `roletas`

## Exemplo de Código Migrado

Aqui está um esboço de como o código principal do scraper ficaria após as alterações:

```python
def monitor_roleta(roleta_id, roleta_nome, scrape_function):
    """
    Monitora uma roleta específica e insere novos números
    """
    try:
        # Obtém o estado atual da roleta na tabela roletas
        response = get_roleta(roleta_id)
        if response:
            current_numbers = response.get("numeros", [])
        else:
            current_numbers = []
            
        # Obtém o número atual da roleta via scraping
        new_number = scrape_function()
        
        if new_number is not None:
            # Verifica se é um número novo
            if not current_numbers or new_number != current_numbers[0]:
                # Processa o novo número
                process_new_number(roleta_id, roleta_nome, new_number, current_numbers)
    except Exception as e:
        print(f"Erro ao monitorar {roleta_nome}: {str(e)}")
```

## Benefícios da Nova Estrutura

1. **Consultas Eficientes**: Você poderá consultar os números por data, por roleta ou por valor
2. **Limitação Automática**: A função e trigger implementadas limitarão automaticamente a 1000 registros por roleta
3. **Análise Facilitada**: Será mais fácil analisar padrões, tendências e estatísticas
4. **Escalabilidade**: A estrutura suporta o crescimento contínuo de dados 