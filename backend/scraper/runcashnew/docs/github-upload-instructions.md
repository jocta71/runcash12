# Instruções para Upload do Projeto RunCash no GitHub

## Método 1: Usando o GitHub Desktop (Recomendado)

1. **Instale o GitHub Desktop**:
   - Baixe e instale o [GitHub Desktop](https://desktop.github.com/)
   - Este é um cliente Git com interface gráfica, fácil de usar

2. **Configure sua conta**:
   - Abra o GitHub Desktop e faça login com sua conta GitHub
   - Se não tiver uma conta, crie uma em [github.com](https://github.com/)

3. **Adicione o repositório local**:
   - Clique em "File" > "Add local repository" 
   - Navegue até a pasta `C:\Users\opc\Downloads\runcash2-master\runcash2-master`
   - Se aparecer uma mensagem dizendo que não é um repositório Git, clique em "create a repository"

4. **Crie o repositório**:
   - Preencha o nome: "runcash"
   - Descrição: "Plataforma de análise de roletas online"
   - Mantenha a opção "Keep this code private" se quiser um repositório privado
   - Clique em "Create repository"

5. **Commit inicial**:
   - GitHub Desktop mostrará todos os arquivos a serem adicionados
   - Escreva "Initial commit" no campo "Summary"
   - Clique em "Commit to main"

6. **Publique no GitHub**:
   - Clique no botão "Publish repository"
   - Mantenha o nome e a descrição
   - Escolha se será público ou privado
   - Clique em "Publish repository"

## Método 2: Usando o GitHub.com (Upload via web)

1. **Crie uma conta no GitHub**:
   - Acesse [github.com](https://github.com/) e crie uma conta, se ainda não tiver

2. **Crie um novo repositório**:
   - Clique no botão "+" no canto superior direito e selecione "New repository"
   - Nome do repositório: "runcash"
   - Descrição: "Plataforma de análise de roletas online"
   - Escolha entre público ou privado
   - Não inicialize com README, .gitignore ou licença
   - Clique em "Create repository"

3. **Prepare seu projeto**:
   - Compacte a pasta inteira do projeto (C:\Users\opc\Downloads\runcash2-master\runcash2-master)
   - Ou, se preferir, divida em arquivos menores (cada um menor que 25MB)

4. **Faça upload dos arquivos**:
   - No repositório vazio, clique em "Uploading an existing file"
   - Arraste os arquivos para a área de upload ou clique para selecionar
   - Escreva "Initial commit" na descrição do commit
   - Clique em "Commit changes"

5. **Configuração do Repositório**:
   - Vá para a aba "Settings" do repositório
   - Configure as permissões de acesso em "Manage access" se necessário

## Método 3: Instalando Git e Usando a Linha de Comando

1. **Instale o Git**:
   - Baixe o Git para Windows em [git-scm.com](https://git-scm.com/download/win)
   - Instale com as opções padrão

2. **Abra um novo Prompt de Comando ou PowerShell**:
   - Depois de instalar o Git, abra um novo terminal para que ele reconheça o comando git

3. **Configure o Git**:
   ```
   git config --global user.name "Seu Nome"
   git config --global user.email "seu.email@exemplo.com"
   ```

4. **Navegue até a pasta do projeto**:
   ```
   cd C:\Users\opc\Downloads\runcash2-master\runcash2-master
   ```

5. **Inicialize o repositório Git**:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   ```

6. **Crie um repositório no GitHub**:
   - Acesse [github.com](https://github.com/)
   - Clique em "+" > "New repository"
   - Nome: "runcash"
   - Não inicialize com README, .gitignore ou licença
   - Clique em "Create repository"

7. **Conecte e envie para o GitHub**:
   ```
   git remote add origin https://github.com/seu-usuario/runcash.git
   git branch -M main
   git push -u origin main
   ```

## Próximos Passos

1. Após o upload, seu código estará disponível no GitHub
2. Copie a URL do repositório (https://github.com/seu-usuario/runcash)
3. Use esta URL para conectar com o Vercel, conforme as instruções de deploy
4. Continue com o processo de deploy seguindo o arquivo `deploy-instructions.md` 