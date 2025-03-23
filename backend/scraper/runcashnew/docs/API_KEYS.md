# Configuração de Variáveis de Ambiente no Vercel

Este documento lista todas as variáveis de ambiente necessárias para configurar o projeto no Vercel.

## Variáveis Obrigatórias

### Supabase
- **SUPABASE_URL**: URL da sua instância do Supabase
- **SUPABASE_KEY**: Chave de serviço (service key) do Supabase, usada pelos backends

### Asaas
- **ASAAS_API_KEY**: Chave de API do Asaas (comece com `$aact_` para ambiente de produção ou `$aact_YYY` para sandbox)
- **ASAAS_WEBHOOK_SECRET**: Secret para validação dos webhooks do Asaas

## Como configurar no Vercel

1. Acesse o [Dashboard do Vercel](https://vercel.com/dashboard)
2. Selecione seu projeto
3. Vá em "Settings" > "Environment Variables"
4. Adicione cada uma das variáveis acima com seus respectivos valores
5. Clique em "Save" para salvar as alterações

## Exemplos de valores

```
SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
SUPABASE_KEY=eyJxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ASAAS_API_KEY=$aact_YYY.....
ASAAS_WEBHOOK_SECRET=whsec_xxxxxx
```

## Observações Importantes

- **NUNCA armazene estas chaves diretamente no código**
- Certifique-se de que as chaves da API estão corretas para o ambiente desejado (sandbox ou produção)
- Após adicionar ou modificar variáveis, será necessário fazer um novo deploy para que as alterações tenham efeito
- Você pode configurar variáveis diferentes para ambientes de produção e preview no Vercel

## API Keys no Código

Todas as APIs no projeto estão configuradas para acessar as chaves a partir de `process.env.NOME_DA_VARIAVEL`, seguindo as melhores práticas de segurança. Por exemplo:

```javascript
// Exemplo de uso no código
const apiKey = process.env.ASAAS_API_KEY;
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
``` 