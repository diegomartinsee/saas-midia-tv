# SaaS Mídia TV

Sistema de overlay de propaganda para TV - Exibe propagandas em tela cheia sobre qualquer conteúdo.

## 📋 Requisitos

- Node.js 16+ 
- Windows 10/11

## 🚀 Instalação

1. Clone ou extraia o projeto

2. Instale as dependências:
```bash
npm install
```

## ▶️ Execução

### Modo Desenvolvimento
```bash
npm start
```

### Modo Produção
```bash
npm run start
```

## 📖 Uso

### Primeira Configuração (< 5 minutos)

1. **Adicione Propagandas**
   - Arraste vídeos (MP4, WEBM) ou imagens (JPG, PNG) para a área de drop
   - Ou clique para escolher arquivos

2. **Configure Frequência**
   - Use o slider para definir quantas vezes por hora exibir
   - Padrão: 6x/hora (a cada 10 minutos)

3. **Defina Horário** (Opcional)
   - Configure horário de funcionamento
   - Ou marque "24 horas"

4. **Inicie o Sistema**
   - Clique em "INICIAR SISTEMA"
   - Painel minimiza automaticamente

### Durante Operação

- **System Tray**: Ícone na bandeja do sistema
  - Clique direito para abrir menu
  - Opções: Abrir Painel, Pausar/Retomar, Sair

- **Painel de Controle**: 
  - Reabrir via System Tray
  - Adicionar/remover propagandas
  - Ajustar configurações

## 📁 Estrutura de Arquivos

```
saas-midia-tv/
├── package.json
├── src/
│   ├── main/                 # Main Process (Node.js)
│   │   ├── main.js           # Entry point
│   │   ├── scheduler/        # Scheduling logic
│   │   ├── overlay/          # Overlay engine
│   │   ├── storage/          # Data persistence
│   │   ├── windows/          # Window managers
│   │   ├── ipc/              # IPC handlers
│   │   └── tray/             # System tray
│   ├── preload/              # Preload scripts (security bridge)
│   │   ├── controlPanel.js
│   │   └── overlay.js
│   └── renderer/             # Renderer Process (HTML/CSS/JS)
│       ├── controlPanel/     # Control panel UI
│       └── overlay/          # Overlay UI
```

## 💾 Dados Persistidos

Todos os dados são salvos localmente em:
```
%APPDATA%/saas-midia-tv/
├── config.json      # Configurações
├── ads.json         # Lista de propagandas
└── state.json       # Estado do sistema
```

### config.json
```json
{
  "displayConfig": {
    "adsPerHour": 6,
    "defaultImageDuration": 15,
    "activeHours": {
      "enabled": true,
      "start": 8,
      "end": 22
    }
  }
}
```

### ads.json
```json
{
  "ads": [
    {
      "id": "ad-1234567890",
      "filePath": "C:\\path\\to\\video.mp4",
      "fileName": "video.mp4",
      "type": "video",
      "duration": 30,
      "status": "valid"
    }
  ]
}
```

## 🔧 Arquitetura Técnica

### Main Process
- **Scheduler**: Cálculo determinístico de slots de tempo
- **Overlay Engine**: State machine para controle de overlay
- **Storage**: Persistência com atomic writes e backup
- **IPC Handlers**: Comunicação segura Main ↔ Renderer

### Renderer Process
- **Control Panel**: Interface de configuração
- **Overlay**: Exibição fullscreen de mídia

### Segurança
- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`
- APIs limitadas via `contextBridge`

## 🎯 Funcionalidades Principais

### Scheduler Determinístico
- Slots calculados matematicamente (não armazenados)
- Baseado em divisão da hora
- Janela de tolerância (metade do intervalo)
- Sobrevive a crash/reboot

### Overlay Agressivo
- Fullscreen sem frame
- AlwaysOnTop: 'screen-saver' (nível máximo)
- Focus stealing com polling (100ms)
- Bloqueia Alt+Tab durante exibição
- Previne screensaver

### Estados do Overlay
1. **HIDDEN**: Invisível, click-through
2. **PREPARING**: Carregando mídia
3. **DISPLAYING**: Visível, bloqueante
4. **FINISHING**: Fade out, limpeza

## 🐛 Troubleshooting

### Vídeo não carrega
- Verifique se o arquivo existe
- Formatos suportados: MP4, WEBM
- Codecs: H.264, VP8/VP9

### Propaganda não aparece
- Verifique se sistema está ATIVO
- Verifique se há propagandas adicionadas
- Verifique se está dentro do horário configurado

### Overlay não rouba foco
- Reinicie o aplicativo
- Verifique permissões do Windows

## 📝 Limitações do MVP

- Apenas monitor primário (multi-monitor não implementado)
- Sem cloud sync
- Sem analytics
- Sem pill flutuante (apenas system tray)
- Sem auto-start (será implementado)

## 🔮 Próximas Features

- Pill flutuante (contador visual)
- Auto-start com Windows
- Multi-monitor support
- Logs detalhados
- Interface de configurações avançadas

## 📄 Licença

ISC
