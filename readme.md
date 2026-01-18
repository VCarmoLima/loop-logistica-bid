# Sistema de Gestão de BIDs Logísticos (SaaS)

Sistema web desenvolvido em Python para gestão de leilões de fretes (BIDs), permitindo a conexão entre embarcadores e transportadoras em tempo real. O sistema foca em transparência, auditoria e escolha baseada em critérios de Preço vs Prazo.

## Funcionalidades

- **Painel Administrativo:**
    - Cadastro de novas cargas (BIDs) com upload de fotos.
    - Definição de prazos de leilão e limites de entrega.
    - Monitoramento de lances em tempo real (Ranking de Preço, Prazo e Score).
    - Homologação de vencedores e geração automática de auditoria em PDF.

- **Painel do Transportador:**
    - Visualização de oportunidades disponíveis.
    - Envio de lances com validação inteligente (só aceita lance maior se o prazo for menor).
    - Feedback visual imediato sobre a posição no ranking.

- **Automação (Worker):**
    - Monitoramento de prazos em segundo plano.
    - Envio automático de e-mails de notificação e relatórios.

## Tecnologias Utilizadas
- **Frontend/Backend:** [Streamlit](https://streamlit.io/) / Python
- **Banco de Dados:** Supabase (PostgreSQL)
- **Armazenamento:** Supabase Storage (Imagens)
- **Relatórios:** FPDF (Geração de PDFs)

## Como Rodar o Projeto

### Pré-requisitos
- Python 3.9+
- Conta no Supabase

### 1. Instalação
Clone o repositório e instale as dependências:
```bash
git clone [https://github.com/SEU_USUARIO/NOME_DO_REPO.git](https://github.com/SEU_USUARIO/NOME_DO_REPO.git)
cd NOME_DO_REPO
pip install -r requirements.txt
```
### 2. Configuração
Crie um arquivo .env na raiz do projeto com as chaves do Supabase e E-mail:
```bash
SUPABASE_URL="sua_url_supabase"
SUPABASE_KEY="sua_chave_anonima"
```
### 3. Execução
   Inicie o servidor web:
```bash
streamlit run app.py
```
Em outro terminal, inicie o robô de monitoramento:
```bash
python worker.py
```

### 4. Segurança do Git (`.gitignore`)

**MUITO IMPORTANTE:** Antes de dar o `git push`, garanta que o arquivo `.gitignore` contenha as seguintes linhas para impedir que seus dados reais subam:

```text
.env
.venv/
__pycache__/
*.pyc
credentials.json
Auditoria_BIDs/
image/logo.webp
```

---
## Segurança e Privacidade
Este repositório contém uma versão demonstrativa. Logos e dados reais de empresas foram removidos ou ofuscados para proteção de propriedade intelectual e dados sensíveis.

---
### Desenvolvido por `VCarmoLima`.