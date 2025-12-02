# Configuração do MCP (Model Context Protocol) para Prisma

## 📋 O que é MCP?

O MCP (Model Context Protocol) permite que o Cursor acesse informações do projeto de forma estruturada, incluindo schemas Prisma, modelos, enums e outras informações do banco de dados.

## 🚀 Configuração Realizada

### 1. Servidor MCP Prisma Criado

**Arquivo:** `scripts/prisma-mcp-server.mjs`

**Funcionalidades:**
- ✅ Leitura do schema Prisma completo
- ✅ Extração de modelos e suas propriedades
- ✅ Listagem de enums e seus valores
- ✅ Validação do schema Prisma
- ✅ Informações detalhadas sobre modelos específicos

### 2. Configuração MCP Atualizada

**Arquivo:** `c:\Users\denis\.cursor\mcp.json`

```json
{
  "mcpServers": {
    "Prisma-MCP": {
      "command": "node",
      "args": ["D:\\Repositorio\\Venda facil\\BackEnd\\scripts\\prisma-mcp-server.mjs"],
      "cwd": "D:\\Repositorio\\Venda facil\\BackEnd",
      "env": {
        "NODE_ENV": "development",
        "DATABASE_URL": "${env:DATABASE_URL}",
        "DIRECT_URL": "${env:DIRECT_URL}"
      }
    }
  }
}
```

**Nota:** O caminho no `args` deve ser **absoluto** para garantir que o Cursor encontre o arquivo corretamente, independentemente do diretório de trabalho atual.

### 3. Dependências Instaladas

```bash
npm install @modelcontextprotocol/sdk
```

## 🔧 Recursos Disponíveis

### Recursos (Resources)

1. **`prisma://schema`** - Schema Prisma completo
2. **`prisma://models`** - Lista de todos os modelos
3. **`prisma://enums`** - Lista de todos os enums

### Ferramentas (Tools)

1. **`validate_schema`** - Valida sintaxe do schema Prisma
2. **`get_model_info`** - Informações detalhadas de um modelo específico

## 📖 Como Usar

### No Cursor

Após reiniciar o Cursor, você poderá:

1. **Acessar Schema:** O Cursor pode ler automaticamente o schema Prisma
2. **Validar Schema:** Executar validações antes de aplicar mudanças
3. **Explorar Modelos:** Obter informações detalhadas sobre qualquer modelo
4. **Listar Enums:** Ver todos os enums disponíveis e seus valores

### Comandos Diretos (opcional)

```bash
# Validar schema
node scripts/prisma-mcp-server.mjs validate

# Ver todos os modelos
node scripts/prisma-mcp-server.mjs models

# Ver todos os enums  
node scripts/prisma-mcp-server.mjs enums
```

## ⚡ Benefícios

1. **Contexto Automático:** O Cursor entende automaticamente o schema do banco
2. **Validação Rápida:** Detecção de erros antes de aplicar migrations
3. **Exploração Eficiente:** Navegação rápida entre modelos e relações
4. **Desenvolvimento Seguro:** Prevenção de erros relacionados ao schema
5. **Documentação Viva:** Schema sempre atualizado no contexto

## 🔄 Reinicialização

**IMPORTANTE:** Após esta configuração, reinicie o Cursor para ativar o MCP.

## 🐛 Solução de Problemas

### Erro: "Cannot find module" ou "MODULE_NOT_FOUND"
**Causa:** O caminho do arquivo no `args` não está sendo resolvido corretamente.

**Solução:**
1. Use um **caminho absoluto** no `args` em vez de relativo
2. Exemplo: `"args": ["D:\\Repositorio\\Venda facil\\BackEnd\\scripts\\prisma-mcp-server.mjs"]`
3. Certifique-se de que o caminho está correto e o arquivo existe
4. Verifique se as barras estão escapadas corretamente (`\\`)

### Erro: "No server info found"
**Causa:** O servidor MCP não está implementando o handler `initialize` corretamente.

**Solução:**
1. Verifique se o arquivo `prisma-mcp-server.mjs` tem o método `setupInitializeHandler()`
2. Confirme que o handler retorna `protocolVersion`, `capabilities` e `serverInfo`
3. Reinicie o Cursor após corrigir

### Servidor MCP não inicia?
1. Verifique se as dependências estão instaladas: `npm list @modelcontextprotocol/sdk`
2. Confirme o caminho no arquivo de configuração MCP (use caminho absoluto)
3. Verifique as variáveis de ambiente DATABASE_URL e DIRECT_URL
4. Teste o arquivo manualmente: `node "D:\Repositorio\Venda facil\BackEnd\scripts\prisma-mcp-server.mjs"`

### Cursor não reconhece o MCP?
1. Reinicie completamente o Cursor
2. Verifique se o arquivo `mcp.json` está no local correto: `c:\Users\<usuario>\.cursor\mcp.json`
3. Consulte os logs do Cursor para possíveis erros
4. Verifique se o caminho absoluto no `args` está correto

## 📝 Status de Implementação

- ✅ **Servidor MCP criado** e configurado
- ✅ **Dependências instaladas** e atualizadas
- ✅ **Configuração MCP** atualizada para o projeto atual
- ✅ **Documentação** completa criada
- 🔄 **Reinicialização do Cursor** necessária para ativação

---

**Próximo passo:** Reinicie o Cursor para começar a usar o MCP com informações do schema Prisma!
