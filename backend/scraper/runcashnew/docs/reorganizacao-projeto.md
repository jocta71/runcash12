# Reorganização do Projeto RunCash

## Alterações Realizadas

### Estrutura de Diretórios
- ✅ Criação da pasta `docs/` para centralizar toda a documentação
- ✅ Criação da pasta `scripts/` para centralizar todos os scripts
  - Subpasta `scripts/db/` para scripts relacionados ao banco de dados
  - Subpasta `scripts/maintenance/` para scripts de manutenção
- ✅ Mantida a separação entre `frontend/`, `backend/` e `api/`
- ✅ Removidas pastas redundantes `src/` e `lib/` na raiz

### Migração de Arquivos
- ✅ Documentação: Todos os arquivos MD foram movidos para `docs/`
- ✅ Scripts: Todos os scripts (JS, Python, PS1, SQL) foram movidos para `scripts/`
- ✅ Utilidades: Funções de `src/lib/utils.ts` foram migradas para `frontend/src/lib/utils.ts`

### Limpeza
- ✅ Removidos arquivos temporários ou de erro (`tatus`, `h -v origin master`)
- ✅ Removido arquivo `lib/utils.ts` que continha apenas mensagens de erro

## Benefícios da Nova Estrutura

1. **Organização:** A nova estrutura é mais intuitiva e facilita a navegação pelo projeto
2. **Manutenção:** Arquivos relacionados estão agrupados, facilitando manutenção
3. **Documentação:** Toda documentação centralizada em um único local
4. **Scripts:** Scripts organizados por função (banco de dados, manutenção)
5. **Código Limpo:** Remoção de diretórios e arquivos redundantes ou desnecessários

## Próximos Passos Recomendados

1. Atualizar referências em documentação que possam apontar para os antigos caminhos
2. Revisar os READMEs para refletir a nova estrutura do projeto
3. Considerar a remoção da pasta `temp_org/` após confirmação de que não é mais necessária 