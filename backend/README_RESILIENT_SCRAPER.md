# Guia do Scraper Resiliente

Este documento explica como configurar e manter o scraper com recursos de auto-recuperação para garantir funcionamento 24/7.

## Visão Geral das Melhorias

O código do scraper foi atualizado com:

1. **Sistema de Auto-Recuperação do WebDriver**:
   - Reinicialização automática do driver em caso de falha
   - Regeneração do driver a cada hora para evitar vazamentos de memória
   - Backoff exponencial para tentativas de reconexão

2. **Extração Robusta de Números**:
   - Melhor tratamento de tipos de dados
   - Validação rigorosa dos números extraídos
   - Verificação de intervalo válido (0-36)

3. **Monitoramento de Threads**:
   - Thread separada para cada roleta
   - Auto-recuperação de threads mortas
   - Gestão independente de erros por roleta

4. **Tratamento de Erros Avançado**:
   - Captura específica de exceções de conexão
   - Logging detalhado para diagnóstico
   - Tentativas de recuperação com backoff

## Opções para Execução 24/7

Existem três maneiras de executar o scraper com alta disponibilidade:

### 1. Script de Monitoramento Python (Recomendado para Desenvolvimento)

```bash
python backend/start_resilient_scraper.py
```

Este script iniciará o scraper e o monitorará, reiniciando-o automaticamente em caso de falha.

### 2. Supervisor (Recomendado para Produção no Linux)

Para configurar o [Supervisor](http://supervisord.org/) (recomendado para ambientes Linux):

1. Instale o Supervisor:
   ```bash
   pip install supervisor
   ```

2. Crie um arquivo de configuração em `/etc/supervisor/conf.d/runcash-scraper.conf`:
   ```ini
   [program:runcash-scraper]
   command=python /caminho/para/backend/start_resilient_scraper.py
   directory=/caminho/para/backend
   user=seu_usuario
   autostart=true
   autorestart=true
   startretries=10
   stderr_logfile=/var/log/supervisor/runcash-scraper.err.log
   stdout_logfile=/var/log/supervisor/runcash-scraper.out.log
   environment=PYTHONUNBUFFERED=1
   ```

3. Recarregue o Supervisor:
   ```bash
   supervisorctl reread
   supervisorctl update
   ```

4. Gerenciar o serviço:
   ```bash
   supervisorctl status runcash-scraper
   supervisorctl restart runcash-scraper
   ```

### 3. Serviço do Windows (Recomendado para Produção no Windows)

Para executar como serviço do Windows, você pode usar o NSSM (Non-Sucking Service Manager):

1. Baixe o NSSM do site oficial: https://nssm.cc/download

2. Instale o serviço:
   ```
   nssm.exe install RunCashScraper
   ```

3. Na tela de configuração, configure:
   - Path: Caminho para o Python (ex: C:\Python310\python.exe)
   - Startup Directory: Caminho para o diretório backend
   - Arguments: start_resilient_scraper.py
   - Em "Details", dê um nome e descrição para o serviço

4. Inicie o serviço:
   ```
   nssm.exe start RunCashScraper
   ```

## Monitoramento e Manutenção

### Logs

O scraper gera logs detalhados com timestamps para facilitar o diagnóstico. Monitore estes logs regularmente para detectar problemas.

### Configurações

Você pode ajustar as configurações no início do arquivo `start_resilient_scraper.py`:

- `MAX_RESTARTS`: Número máximo de reinicializações permitidas em 24h
- `MIN_RUNTIME`: Tempo mínimo de execução considerado como "saudável"
- `COOLDOWN_TIME`: Tempo de espera entre reinícios

### No arquivo `scraper_mongodb.py`:

- `DRIVER_MAX_AGE`: Tempo máximo de vida do driver em segundos
- `MAX_ERROS_CONSECUTIVOS`: Número máximo de erros consecutivos permitidos

## Solução de Problemas

1. **Driver não inicia**: Verifique se o ChromeDriver está instalado e é compatível com sua versão do Chrome.

2. **Erros de conexão frequentes**: Verifique a conectividade de rede e os timeouts configurados.

3. **Consumo de memória excessivo**: Ajuste o `DRIVER_MAX_AGE` para um valor menor (ex: 1800 segundos).

4. **Reinicializações frequentes**: Verifique os logs para identificar o padrão de falhas e ajuste as configurações de acordo.

## Apoio e Contato

Se precisar de assistência adicional, entre em contato com a equipe de desenvolvimento. 