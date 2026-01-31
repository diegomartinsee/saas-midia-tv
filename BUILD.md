# Build & Deployment Instructions

## 🔨 Development Build

### Requisitos
- Node.js 16+
- Windows 10/11

### Instalação
```bash
cd saas-midia-tv
npm install
```

### Execução
```bash
npm start
```

---

## 📦 Production Build (Futuro)

### Instalar Electron Builder
```bash
npm install --save-dev electron-builder
```

### Atualizar package.json
Adicionar seção "build":
```json
{
  "build": {
    "appId": "com.saasmidia.tv",
    "productName": "SaaS Mídia TV",
    "win": {
      "target": "nsis",
      "icon": "assets/icons/icon.ico"
    },
    "files": [
      "src/**/*",
      "package.json"
    ],
    "directories": {
      "output": "dist"
    }
  },
  "scripts": {
    "build": "electron-builder"
  }
}
```

### Build
```bash
npm run build
```

Instalador será gerado em `dist/`

---

## 🎯 Verificação Pós-Build

### 1. Instalação
- [ ] npm install sem erros
- [ ] node_modules criado (~200MB)
- [ ] Versão do Electron: 28.x

### 2. Primeiro Start
```bash
npm start
```

**Verificar:**
- [ ] Painel de controle abre
- [ ] Overlay window existe (invisível)
- [ ] System tray aparece na bandeja
- [ ] Console sem erros críticos

### 3. Teste Básico
1. Adicionar 1 vídeo MP4
2. Configurar 12x/hora (5min)
3. Iniciar sistema
4. Aguardar 5 minutos
5. Verificar se propaganda aparece em tela cheia

---

## 🐛 Debug

### Enable DevTools

**Overlay Window:**
Editar `src/main/windows/overlay.js`:
```javascript
// Adicionar após create:
window.webContents.openDevTools({ mode: 'detach' });
```

**Control Panel Window:**
Editar `src/main/windows/controlPanel.js`:
```javascript
// Adicionar após create:
window.webContents.openDevTools({ mode: 'detach' });
```

### Logs
- Main Process: Console onde `npm start` executou
- Renderer Process: DevTools console

### Arquivos de Dados
```
%APPDATA%/saas-midia-tv/
├── config.json
├── ads.json
└── state.json
```

Deletar esses arquivos para reset completo.

---

## 📋 Checklist de Deploy

### Antes de Distribuir
- [ ] Testar em Windows limpo
- [ ] Testar com diferentes resoluções
- [ ] Testar overlay sobre apps populares
- [ ] Verificar uso de memória/CPU
- [ ] Criar ícones (.ico, .png)
- [ ] Assinar aplicação (code signing)
- [ ] Criar instalador com auto-updater

### Documentação
- [ ] README completo
- [ ] QA Checklist preenchido
- [ ] Screenshots do painel
- [ ] Vídeo demo (opcional)

---

## 🚀 Distribuição

### Método 1: Portable (ZIP)
1. Build com electron-builder
2. Compactar pasta `dist/win-unpacked/`
3. Distribuir ZIP

### Método 2: Instalador (NSIS)
1. Build com electron-builder
2. Distribuir arquivo `.exe` de `dist/`

### Tamanho Estimado
- Portable: ~150MB
- Instalador: ~80MB

---

## 🔐 Code Signing (Opcional)

### Windows
Requer certificado code-signing válido.

```json
{
  "build": {
    "win": {
      "certificateFile": "path/to/cert.pfx",
      "certificatePassword": "password"
    }
  }
}
```

Sem assinatura, usuários verão "Publicador desconhecido".

---

## 🌐 Auto-Update (Futuro)

Implementar com `electron-updater`:
1. Hospedar releases em GitHub/servidor
2. Configurar auto-updater
3. App checa updates ao iniciar

---

## ⚠️ Problemas Conhecidos

### Windows Defender
Pode bloquear overlay agressivo. Solução:
- Assinar código
- Adicionar exceção no Defender

### Permissões
Overlay precisa permissão para:
- Fullscreen
- AlwaysOnTop
- Focus stealing

Se bloqueado, pedir ao usuário para permitir.

---

## 📞 Suporte

Para issues:
1. Checar console logs
2. Verificar arquivos em %APPDATA%
3. Testar com vídeo/imagem simples
4. Reiniciar aplicação
