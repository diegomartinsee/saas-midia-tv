# QA Checklist: SaaS Mídia TV

## 🎯 Testes de Funcionalidade Básica

### Instalação e Primeiro Uso
- [ ] `npm install` executa sem erros
- [ ] `npm start` abre o painel de controle
- [ ] Painel aparece centralizado na tela
- [ ] Todos os campos estão visíveis

### Adicionar Propagandas
- [ ] Drag & drop de vídeo MP4 funciona
- [ ] Drag & drop de imagem JPG funciona
- [ ] Clique no drop zone abre file picker
- [ ] Múltiplos arquivos podem ser adicionados
- [ ] Nome e duração aparecem na lista
- [ ] Botão "🗑" remove propaganda da lista
- [ ] Formatos não suportados mostram erro claro

### Configurar Frequência
- [ ] Slider move suavemente de 1 a 12
- [ ] Preview atualiza instantaneamente
- [ ] "A cada X minutos" calcula corretamente
  - 1x/hora → 60 minutos
  - 6x/hora → 10 minutos
  - 12x/hora → 5 minutos

### Configurar Horário
- [ ] Dropdowns populam com 00:00 a 24:00
- [ ] Selecionar horários funciona
- [ ] Erro aparece se "Até" <= "De"
- [ ] Checkbox "24 horas" desabilita dropdowns
- [ ] Desmarcar checkbox restaura valores

### Iniciar Sistema
- [ ] Botão fica desabilitado sem propagandas
- [ ] Botão fica habilitado com ≥1 propaganda
- [ ] Clicar "INICIAR" muda para "PAUSAR"
- [ ] Status muda de "○ PAUSADO" para "● ATIVO"
- [ ] Countdown começa a contar
- [ ] Painel pode ser fechado (minimiza para tray)

---

## 🎬 Testes de Overlay e Foco

### Exibição de Vídeo
- [ ] Vídeo MP4 carrega corretamente
- [ ] Vídeo aparece em fullscreen
- [ ] Vídeo toca automaticamente
- [ ] Vídeo ocupa tela sem distorção (contain)
- [ ] Vídeo termina automaticamente
- [ ] Overlay desaparece após término

### Exibição de Imagem
- [ ] Imagem JPG carrega corretamente
- [ ] Imagem aparece em fullscreen
- [ ] Imagem centralizada (contain)
- [ ] Imagem desaparece após duração configurada

### Focus Stealing (CRÍTICO)
- [ ] Overlay aparece sobre navegador (Chrome/Edge)
- [ ] Overlay aparece sobre YouTube fullscreen
- [ ] Overlay aparece sobre Netflix
- [ ] Overlay aparece sobre PowerPoint em apresentação
- [ ] Overlay aparece sobre jogos fullscreen
- [ ] Alt+Tab é bloqueado durante propaganda
- [ ] Overlay mantém foco mesmo com cliques

### Invisibilidade (Estado HIDDEN)
- [ ] Overlay não aparece quando inativo
- [ ] Click-through funciona (cliques passam através)
- [ ] Não aparece na barra de tarefas
- [ ] Não interfere com uso normal do PC

---

## ⏱️ Testes de Scheduler

### Timing Preciso
- [ ] **6x/hora**: Propaganda aparece a cada 10min
  - Testar: :00, :10, :20, :30, :40, :50
- [ ] **12x/hora**: Propaganda aparece a cada 5min
  - Testar: :00, :05, :10, :15, etc.
- [ ] Não exibe duas vezes no mesmo slot

### Janela de Tolerância
- [ ] Propaganda exibe até metade do intervalo
  - Ex: Slot :10, intervalo 10min, válido até :15
- [ ] Não exibe após janela expirar
  - Ex: Após :15:01, pula para próximo slot

### Resiliência
- [ ] **Pausar e Retomar**
  - Pausar sistema
  - Aguardar 5 minutos
  - Retomar
  - Próxima propaganda calcula corretamente
  
- [ ] **Fechar e Reabrir**
  - Fechar painel (minimiza)
  - Reabrir via tray
  - Sistema continua rodando
  - Countdown continua correto

- [ ] **Crash Recovery** (Simular)
  - Forçar fechamento (Task Manager)
  - Reabrir aplicação
  - Estado restaurado corretamente
  - Não exibe propaganda duplicada

---

## 🔄 Testes de Persistência

### Config.json
- [ ] Mudanças são salvas automaticamente
- [ ] Configuração persiste após fechar app
- [ ] Arquivo backup (.bak) é criado

### Ads.json
- [ ] Lista de propagandas persiste
- [ ] Adicionar/remover salva imediatamente
- [ ] Arquivo backup (.bak) é criado

### State.json
- [ ] lastSlotId persiste
- [ ] Sistema restaura estado ao reabrir
- [ ] Slots antigos (>1h) são descartados

---

## 🖱️ Testes de System Tray

### Menu
- [ ] Ícone aparece na bandeja
- [ ] Clique direito abre menu
- [ ] "● ATIVO" ou "○ PAUSADO" aparece
- [ ] "Próxima propaganda: MM:SS" atualiza
- [ ] "Abrir Painel" funciona
- [ ] "Pausar/Retomar" funciona
- [ ] "Sair" fecha aplicação

### Countdown no Tray
- [ ] Tempo atualiza a cada segundo
- [ ] Quando pausado, mostra "Sistema pausado"
- [ ] Quando sem propagandas, mostra mensagem apropriada

---

## 🎨 Testes de UI/UX

### Responsividade
- [ ] Painel não redimensiona (600x700 fixo)
- [ ] Todos os elementos cabem na janela
- [ ] Scroll não aparece

### Validações
- [ ] Erro claro para formato inválido
- [ ] Erro claro para horário inválido
- [ ] Mensagens de erro desaparecem ao corrigir

### Feedback Visual
- [ ] Drag over muda cor do drop zone
- [ ] Slider mostra posição atual
- [ ] Botões mudam ao hover
- [ ] Status dot muda de cor (verde/cinza)

---

## 🚨 Testes de Edge Cases

### Sem Propagandas
- [ ] Botão "INICIAR" fica desabilitado
- [ ] Tooltip explica: "Adicione pelo menos uma propaganda"
- [ ] Sistema não tenta exibir nada

### Arquivo Deletado
- [ ] Se arquivo foi deletado do disco
- [ ] Sistema pula para próxima propaganda
- [ ] Erro é logado (não trava aplicação)

### Vídeo Corrompido
- [ ] Sistema detecta erro de carregamento
- [ ] Marca propaganda como "corrupted"
- [ ] Pula para próxima propaganda
- [ ] Não trava overlay

### Multi-Monitor
- [ ] Overlay aparece no monitor primário
- [ ] Não tenta exibir em monitores secundários (MVP)

### Resolução Diferente
- [ ] Vídeo 1920x1080 em tela 1366x768
  - Letterboxing correto
  - Sem distorção
- [ ] Imagem vertical em tela horizontal
  - Centralizada

---

## ⚡ Testes de Performance

### CPU
- [ ] Overlay invisível usa <1% CPU
- [ ] Durante exibição, CPU aceitável
- [ ] Sem memory leaks após 10 exibições

### Memória
- [ ] Memória não cresce indefinidamente
- [ ] Vídeos são liberados após exibição

### Inicialização
- [ ] App inicia em <3 segundos
- [ ] Painel aparece rapidamente

---

## ✅ Checklist de Aceitação Final

- [ ] Configuração completa em <5 minutos
- [ ] Overlay rouba foco de QUALQUER aplicação
- [ ] Sistema funciona 24/7 sem intervenção
- [ ] Não há crashes ou freezes
- [ ] Todas as configurações persistem
- [ ] Documentação (README) está completa
- [ ] Código está comentado

---

## 🎯 Cenários de Uso Real

### Caso 1: Bar/Restaurante
**Setup:**
- 3 vídeos de promoções
- 6x/hora (a cada 10min)
- Horário: 11:00 - 23:00

**Teste:**
1. Configurar conforme acima
2. Deixar rodando por 1 hora
3. Verificar se exibiu 6 vezes

### Caso 2: Loja 24h
**Setup:**
- 5 imagens estáticas
- 12x/hora (a cada 5min)
- Horário: 24 horas

**Teste:**
1. Configurar conforme acima
2. Deixar rodando overnight
3. Verificar consistência no dia seguinte

### Caso 3: Escritório
**Setup:**
- Mix de vídeos e imagens
- 3x/hora (a cada 20min)
- Horário: 08:00 - 18:00

**Teste:**
1. Simular horário fora da janela (07:00)
   - Não deve exibir
2. Entrar na janela (08:00)
   - Deve exibir primeiro slot

---

## 📊 Critérios de Sucesso

- [ ] 100% dos casos de overlay funcionam
- [ ] 0 crashes em 24h de operação
- [ ] Timing preciso (±1 segundo)
- [ ] UX clara e intuitiva
- [ ] Documentação completa
