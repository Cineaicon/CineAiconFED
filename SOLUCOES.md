# 🔧 Soluções para Problemas no Frontend

## Problemas Comuns e Soluções

### 1. Erro: "Porta 3000 já está em uso"

**Solução:**
```powershell
# Opção 1: Matar o processo na porta 3000
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force

# Opção 2: Usar outra porta
$env:PORT=3001
npm start
```

### 2. Erro: "Module not found" ou dependências faltando

**Solução:**
```powershell
# Limpar cache e reinstalar
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm cache clean --force
npm install
```

### 3. Erro: "react-scripts não encontrado"

**Solução:**
```powershell
npm install react-scripts --save
```

### 4. Erro de sintaxe ou compilação

**Solução:**
```powershell
# Limpar cache do npm
npm cache clean --force

# Reinstalar dependências
Remove-Item -Recurse -Force node_modules
npm install

# Tentar novamente
npm start
```

### 5. Erro: "Cannot find module"

**Solução:**
```powershell
# Verificar se está no diretório correto
cd C:\Users\gab23\Documents\AiconERP\CineAiconFED

# Reinstalar tudo
npm install
```

### 6. Problemas com permissões no Windows

**Solução:**
```powershell
# Executar PowerShell como Administrador e depois:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 7. Versão do Node.js incompatível

**Solução:**
- O projeto requer Node.js 16+
- Você tem: v22.14.0 ✅ (está OK)

### 8. Limpar tudo e começar do zero

```powershell
cd C:\Users\gab23\Documents\AiconERP\CineAiconFED

# Remover node_modules e lock
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue

# Limpar cache
npm cache clean --force

# Reinstalar
npm install

# Rodar
npm start
```

## Comandos Úteis

### Verificar se o servidor está rodando:
```powershell
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
```

### Ver processos Node.js:
```powershell
Get-Process node -ErrorAction SilentlyContinue
```

### Matar todos os processos Node.js:
```powershell
Get-Process node | Stop-Process -Force
```

## Rodar o Diagnóstico

Execute o script de diagnóstico:
```powershell
cd C:\Users\gab23\Documents\AiconERP\CineAiconFED
.\diagnostico.ps1
```

