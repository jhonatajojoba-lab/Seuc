# 🛡️ SIRC — Sistema Integrado de Registros Criminais

> Protótipo modular de front-end para registro, consulta, auditoria e inteligência policial da **Delegacia de Polícia Civil de Caxias-MA**.

---

## 📋 Sumário

- [Visão Geral](#-visão-geral)
- [Histórico de Alterações Realizadas](#-histórico-de-alterações-realizadas)
- [Estrutura do Sistema e Arquitetura](#-estrutura-do-sistema-e-arquitetura)
- [Comunicação Entre Componentes (Fluxo de Dados)](#-comunicação-entre-componentes-fluxo-de-dados)
- [Estrutura de Diretórios](#-estrutura-de-diretórios)
- [Credenciais de Acesso (RBAC)](#-credenciais-de-acesso-rbac)
- [Como Rodar a Aplicação](#-como-rodar-a-aplicação)

---

## 🔍 Visão Geral

O **SIRC** é uma aplicação web voltada para a gestão de informações policiais e registros criminais. O sistema opera em arquitetura front-end modular desacoplada, utilizando **HTML5**, **Vanilla CSS (Design Tokens)** e **JavaScript ES6+**, com persistência local reativa via `LocalStorage`.

---

## 📝 Histórico de Alterações Realizadas

### 1. Painel de Inteligência Operacional (Dashboard DS Lumimotion)
- **Acesso Restrito**: Posicionado na página de Gestão de Usuários (`usuarios.html`), acessível exclusivamente a Administradores.
- **Dimensões & Layout Expandidos**: Ajustado para tamanho **Extra-Large (largura de 700px, container de 1720px, padding de 28px)** com raio de bordas suaves de **20px**.
- **Paleta de Cores SIRC Oficial**: Padronizado com as cores oficiais da aplicação — Dark Blue (`#0b1120`, `#0f1628`), Azul Elétrico (`#3b82f6`), Índigo (`#818cf8`) e Sapphire Glow.
- **4 Métricas Superiores**: `REGISTROS` (fichas ativas), `SERVIDORES` (operadores), `AUDITORIA` (ações gravadas) e `ADMINS` (gestores).
- **Seletor de Período Interativo**: Botões pill `30D`, `7D` e `Tudo` que filtram e recalculam instantaneamente os dados do gráfico e do ranking.
- **Gráfico de Linha (Sparkline Neon)**: Calculado em **100% dados reais** divididos em 7 intervalos de datas a partir do histórico de `Store.getLogs()` e `Store.getRecords()`, sem números fictícios ou modificadores randômicos.
- **Gráfico Donut de Perfis de Acesso**: Agrupamento dinâmico por perfil cadastrado no `Store.getUsers()`. Suporta exibição em cor sólida quando há apenas 1 perfil ativo e `conic-gradient` para múltiplos perfis.
- **Ranking de Operações SIRC**: Agrupamento em tempo real dos tipos de ações de auditoria (Cadastros, Edições, Acessos, Exclusões).

### 2. Gestão de Usuários (`usuarios.html` & `js/usuarios.js`)
- **Cards da Visão Geral em Grade 2x2**: Posicionada a grade com os 4 cartões da Visão Geral diretamente abaixo do painel do Dashboard, organizada em **2 blocos no topo e 2 blocos abaixo**.
- **Lista de Atividade Recente com Scroll**: Configurado limite de altura (`max-height: 480px`, `min-height: 280px`) com rolagem vertical e barra de scroll azul customizada, mantendo a listagem completa dos logs do sistema.

### 3. Tabela de Auditoria (`auditoria.html` & `css/auditoria.css`)
- **Scroll Vertical & Sticky Header**: Tabela de logs configurada com rolagem vertical (`max-height: 720px`, `min-height: 420px`) e cabeçalho fixo no topo (`position: sticky`) para navegação em históricos longos.

### 4. Visão Geral (`dashboard.html` & `js/dashboard.js`)
- **Limpeza de Duplicidades**: Removida a grade antiga de cartões para evitar redundância com a página de usuários.
- **Barra de Pesquisa Global Centralizada**: Adicionada barra de busca no centro exato da tela (com compensação de eixo `transform: translateX(25px)` para alinhamento perfeito em relação à sidebar) e formato pill `border-radius: 28px`.
- **Motor de Busca em Tempo Real**: Varredura instantânea por registros criminais (nome, número, observações) e eventos de auditoria (usuário, ação, detalhe) diretamente da tela inicial, exibindo resultados apenas quando uma pesquisa é realizada.

---

## 🏛️ Estrutura do Sistema e Arquitetura

O sistema é dividido em três camadas fundamentais:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           CAMADA DE APRESENTAÇÃO (UI)                           │
│                                                                                 │
│   ┌──────────────┐  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  │
│   │  index.html  │  │ dashboard.html │  │ registros.html │  │ usuarios.html  │  │
│   │ (Tela Login) │  │ (Visão Geral)  │  │  (Registros)   │  │   (Usuários)   │  │
│   └──────┬───────┘  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘  │
│          │                  │                   │                   │           │
│   ┌──────▼───────┐  ┌───────▼────────┐  ┌───────▼────────┐  ┌───────▼────────┐  │
│   │  login.css   │  │ dashboard.css  │  │ registros.css  │  │  usuarios.css  │  │
│   └──────────────┘  └────────────────┘  └────────────────┘  └────────────────┘  │
│                                                                                 │
│               [ css/global.css    — Variáveis, Design Tokens, Modais ]          │
│               [ css/sidebar.css   — Layout Shell e Menu Lateral ]               │
│               [ css/auditoria.css — Estilos da Tabela com Scroll e Sticky ]     │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
┌────────────────────────────────────────▼────────────────────────────────────────┐
│                        CAMADA DE LÓGICA E COMPONENTES                           │
│                                                                                 │
│   ┌──────────────┐  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  │
│   │   login.js   │  │  dashboard.js  │  │  registros.js  │  │  usuarios.js   │  │
│   └──────┬───────┘  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘  │
│          │                  │                   │                   │           │
│          └──────────────────┼───────────────────┴───────────────────┘           │
│                             ▼                                                   │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │  js/components.js  ──► Renderiza Sidebar, Banner e Proteção de Rota     │   │
│   │  js/icons.js       ──► Biblioteca de Ícones SVG Padronizados            │   │
│   │  js/interactions.js ──► Ambient Lighting, Cursor Customizado, Animações │   │
│   └─────────────────────────────────┬───────────────────────────────────────┘   │
└─────────────────────────────────────┼───────────────────────────────────────────┘
                                      │
┌─────────────────────────────────────▼───────────────────────────────────────────┐
│                      CAMADA DE DADOS E PERSISTÊNCIA                             │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │  js/store.js  (Gerenciador Global de Estado)                             │   │
│   │  - Autenticação e Sessão (requireAuth, requireAdmin)                    │   │
│   │  - CRUD de Registros (getRecords, addRecord, updateRecord, deleteRecord)│   │
│   │  - Controle de Usuários (getUsers, addUser, toggleUserStatus)           │   │
│   │  - Logs & Métricas (getLogs, addLog, computeStats)                      │   │
│   └─────────────────────────────────┬───────────────────────────────────────┘   │
│                                     │                                           │
│                                     ▼                                           │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │  Navegador Web: window.localStorage                                     │   │
│   │  ├── sirc_current_user  (Sessão do usuário ativo)                       │   │
│   │  ├── sirc_records       (Base de dados de registros criminais)          │   │
│   │  ├── sirc_users         (Usuários e credenciais do sistema)             │   │
│   │  └── sirc_logs          (Histórico imutável de auditoria)               │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Comunicação Entre Componentes (Fluxo de Dados)

Toda a comunicação do sistema é baseada em **Estado Único Centralizado (`Store`)** com reatividade direta no ciclo de vida das páginas:

```
┌─────────────────┐       1. Executa Ação (CRUD/Status)      ┌─────────────────┐
│   Interface UI  ├─────────────────────────────────────────►│    js/store.js  │
│ (Controller JS) │                                          │ (Central State) │
└────────┬────────┘                                          └────────┬────────┘
         ▲                                                            │
         │                                                            │ 2. Salva Estado &
         │ 4. Re-renderiza Componentes & Gráficos                    │    Gera Log Automático
         │    (updateDashboardMetrics, renderTable)                   ▼
┌────────┴────────┐                                          ┌─────────────────┐
│ Estado Atualizado│◄─────────────────────────────────────────┤  LocalStorage   │
│   do Sistema    │       3. Leitura dos Dados Persistidos   │  (Navegador)    │
└─────────────────┘                                          └─────────────────┘
```

### Exemplo Prático do Fluxo de Comunicação:
1. **Cadastro de Novo Registro Criminal (`registros.js`)**:
   - O usuário preenche o formulário modal na tela de Registros.
   - `registros.js` chama `Store.addRecord(novoRegistro)`.
   - O `Store` grava o novo registro no `localStorage` (`sirc_records`).
   - O `Store` gera um evento imutável automático chamando `Store.addLog("Cadastro de registro", ...)` no `sirc_logs`.
2. **Atualização Reativa nas Demais Telas**:
   - Ao acessar `usuarios.html`, a função `updateDashboardMetrics()` consulta o `Store` atualizado.
   - Os 4 cards em grade 2x2 recalculam o total de registros via `Store.computeStats()`.
   - O gráfico de **Sparkline de Atividade** relê os logs e desenha a nova curva com a data atual.
   - O gráfico **Donut de Perfis** e o **Ranking de Ações** recalculam suas porcentagens.
   - Ao pesquisar na **Visão Geral (`dashboard.html`)**, o motor de busca encontra instantaneamente o registro recém-criado.

---

## 📁 Estrutura de Diretórios

```text
sirc-frontend/
├── README.md               # Documentação técnica e arquitetura do sistema
│
└── SIRC/
    ├── README.md               # Cópia local da documentação técnica
    ├── iniciar-servidor.bat    # Executável do servidor HTTP local (1 clique)
    │
    ├── index.html              # Tela de Autenticação (Login)
    ├── dashboard.html          # Visão Geral e Pesquisa Global em Tempo Real
    ├── registros.html          # Gestão de Registros Criminais (CRUD + Upload Foto)
    ├── auditoria.html          # Histórico de Auditoria com Scroll e Sticky Header
    ├── usuarios.html           # Gestão de Servidores & Painel de Inteligência (DS)
    │
    ├── css/                    # Estilos CSS modulares
    │   ├── global.css          # Design Tokens, Variáveis, Botões e Modais
    │   ├── sidebar.css         # Shell Layout, Menu Lateral e Banners
    │   ├── login.css           # Estilos da tela de login
    │   ├── dashboard.css       # Estilos da Visão Geral, Busca e Painel DS
    │   ├── registros.css       # Estilos da tabela de registros e uploads
    │   ├── auditoria.css       # Estilos da tabela de auditoria e scroll
    │   └── usuarios.css        # Estilos da gestão de usuários e grid 2x2
    │
    └── js/                     # Lógica JavaScript modular
        ├── icons.js            # Biblioteca de ícones SVG
        ├── store.js            # Central de estado, persistência e auditoria
        ├── components.js       # Shell, Sidebar ativa e controle RBAC
        ├── interactions.js     # Efeitos de iluminação ambiente e cursor
        ├── login.js            # Autenticação e validação de sessão
        ├── dashboard.js        # Motor de pesquisa global em tempo real
        ├── registros.js        # Manipulação de registros criminais
        ├── auditoria.js        # Renderização da tabela de auditoria
        └── usuarios.js         # Lógica de usuários e gráficos do Painel DS
```

---

## 🔑 Credenciais de Acesso (RBAC)

| Usuário | Senha | Perfil | Permissões no Sistema |
| :--- | :--- | :--- | :--- |
| **`admin`** | `admin@sirc` | **Administrador** | Acesso total: Visão Geral, Registros, Auditoria e Painel de Inteligência Operacional (`usuarios.html`). |
| **`servidor`** | (Qualquer criado) | **Servidor** | Operacional: Visão Geral, Registros Criminais e Auditoria. |

---

## 🚀 Como Rodar a Aplicação

1. **Via Servidor Local Nativo (Windows)**:
   - Dê um duplo clique no arquivo `iniciar-servidor.bat` dentro da pasta `SIRC/`.
   - O sistema abrirá em `http://localhost:8080`.
2. **Via Abertura Direta**:
   - Dê um duplo clique no arquivo `SIRC/index.html`.

---

<p align="center">
  <strong>SIRC — Delegacia de Polícia Civil de Caxias-MA</strong><br>
  Desenvolvido com foco em alta performance, legibilidade e arquitetura modular.
</p>
