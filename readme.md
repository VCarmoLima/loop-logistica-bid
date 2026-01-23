# Sistema de BID Logístico (SaaS Enterprise)

![Python](https://img.shields.io/badge/Python-3.9%2B-blue)
![Streamlit](https://img.shields.io/badge/Frontend-Streamlit-red)
![Supabase](https://img.shields.io/badge/Database-Supabase-green)
![Status](https://img.shields.io/badge/Status-Production-success)

> **Uma plataforma completa para digitalização, governança e auditoria de cotações de frete.**

O **Sistema de BID Logístico** é um sistema web *Full-Stack* que substitui negociações descentralizadas (e-mail/WhatsApp) por um ambiente de **Leilão Reverso** estruturado. O foco do projeto é **Compliance**: garantir que a escolha do transportador seja baseada em dados (Score Preço vs. Prazo) e que todo o processo seja auditável.

---
### ![Login Preview](image/Login.png)

---
### ![BID Preview](image/BID.png)

---
## Visão Geral do Projeto

Este projeto foi concebido para resolver a ineficiência no processo de contratação de fretes spot e dedicados. A solução centraliza as ofertas, valida as regras de negócio automaticamente e fornece ferramentas de auditoria para compliance.

### Principais Diferenciais Técnicos
### 1. Governança e Segurança (RBAC)
O sistema implementa controle de acesso baseado em função:
* **Master Admin:** Aprovação final de BIDs, gestão de usuários e acesso a logs sensíveis.
* **Standard Admin:** Criação de BIDs e análise técnica de propostas.
* **Transportador:** Visualização apenas de BIDs abertos e envio de lances (blindado contra dados de concorrentes).

### 2. Motor de Notificações Inteligente
Sistema de e-mails transacionais em HTML (Threaded Background Tasks) para comunicação automática:
* **Novo BID:** Alerta massivo para transportadores cadastrados.
* **Vencedor:** E-mail de "Parabéns" para o ganhador (com Admins em cópia oculta/CC para transparência).
* **Auditoria:** Envio automático de **PDFs e Logs** para a diretoria assim que um BID é aprovado.

### 3. Matriz de Decisão & Score
Algoritmo de classificação que pondera as ofertas:
* **Ranking por Preço:** Menor valor.
* **Ranking por Prazo:** Entrega mais rápida.
* **Score Combinado:** `(70% Preço + 30% Prazo)` para identificar o melhor custo-benefício.

### 4. Auditoria e Compliance (PDF)
Geração automática de documentação jurídica pós-leilão:
* Histórico temporal de todos os lances (quem, quando, quanto).
* Scorecard do vencedor.
* Workflow de aprovação (quem criou, quem selecionou, quem aprovou).

## Funcionalidades

### Painel Administrativo (Gestão)
* **Cadastro de BIDs:** Interface para input detalhado de rotas, especificações de veículos e upload de imagens (integrado ao Supabase Storage).
* **Dashboard em Tempo Real:** Monitoramento ao vivo das cotações com atualização automática de status e rankings.
* **Matriz de Decisão:** Classificação automática de propostas baseada em Preço, Prazo e Score ponderado (Custo-Benefício).
* **Homologação e Encerramento:** Fluxo de aprovação formal com geração automática de PDF contendo o histórico completo dos lances e dados do vencedor.

### Portal do Transportador
* **Marketplace de Oportunidades:** Visualização de cargas disponíveis com detalhes técnicos e fotos.
* **Feedback Inteligente:** O sistema informa visualmente o "Preço a Bater" e o "Prazo do Líder", orientando a competitividade.
* **Validação de Input:** Bloqueio preventivo de lances que não atendem aos critérios mínimos de melhoria (Preço vs. Prazo).

### Automação (Backend Worker)
* **Monitoramento de Prazos:** Serviço em background que verifica o vencimento dos leilões a cada 10 segundos.
* **Alteração de Status:** Transição automática de status de "Aberto" para "Em Análise" sem intervenção humana.

## Stack Tecnológico

| Componente | Tecnologia | Função |
| :--- | :--- | :--- |
| **Frontend** | Streamlit | Interface reativa, Dashboards e Formulários. |
| **Backend** | Python (Threading) | Regras de negócio, Workers em background e Gestão de Estado. |
| **Database** | Supabase (PostgreSQL) | Persistência de dados, Relacionamentos e Storage de Imagens. |
| **Comms** | SMTP (Gmail API) | Disparo de e-mails assíncronos com HTML Templates. |
| **Reporting** | FPDF & Pandas | Geração de relatórios de auditoria e manipulação de dados. |

## Estrutura do Repositório

```text
/
├── database/           # Scripts SQL (Schema do Supabase)
├── src/                # Código Fonte
│   ├── app.py          # Core Application (UI + Lógica + Workers)
│   ├── utils_pdf.py    # Engine de Geração de PDFs e Logs (CSV/JSON)
│   └── sync_users.py   # Script de Sincronização de Usuários (Batch)
├── image/              # Assets visuais
├── requirements.txt    # Dependências
└── README.md           # Documentação 
```

---

### 1. Pré-requisitos
 - Python instalado.
 - Conta configurada no Supabase (URL e Key).
 - Conta de E-mail (com Senha de App configurada).

### 2. Instalação
Clone o repositório e instale as dependências:
```bash
git clone [https://github.com/VCarmoLima/logistica-bid.git](https://github.com/VCarmoLima/logistica-bid.git)
cd logistica-bid
pip install -r requirements.txt
```
### 3. Configuração das Variáveis de Ambiente
Crie um arquivo .env na raiz do projeto com as chaves do Supabase:
```bash
SUPABASE_URL="sua_url_supabase"
SUPABASE_KEY="sua_chave_anonima"
EMAIL_USER = "seu_email@dominio.com"
EMAIL_PASS = "sua_senha_de_aplicativo"
```

### 4. Configuração do Banco de Dados
   Execute o script SQL localizado em database/schema.sql no seu painel do Supabase para criar as tabelas necessárias.

### 5. Execução
```bash
streamlit run src/app.py
```
O sistema estará acessível em [http://localhost:8501](http://localhost:8501).

---

## Melhorias
Para visualizar as funcionalidades planejadas e o progresso do desenvolvimento, consulte o arquivo [ROADMAP.md](https://github.com/VCarmoLima/logistica-bid/blob/main/ROADMAP.md).

---
## Segurança e Privacidade
Este repositório contém uma versão demonstrativa. Logos e dados reais de empresas foram removidos ou ofuscados para proteção de propriedade intelectual e dados sensíveis.

---
Este projeto está licenciado sob a licença MIT. Consulte o arquivo LICENSE para mais detalhes.

Desenvolvido por [VCarmoLima](https://www.linkedin.com/in/viniciusdocarmolima/). 
