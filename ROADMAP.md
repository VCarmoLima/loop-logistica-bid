# Roadmap do Projeto: Sistema de BIDs

Este documento detalha as etapas de desenvolvimento, melhorias de interface, implementação de novas lógicas de negócio e profissionalização do sistema de leilão de fretes (BIDs).

---

## 📊 Progresso do Projeto

![Progresso do Roadmap](./assets/roadmap-progress.svg)

---

## 🟢 Interface (UX/UI) e Estrutura Base
Foco em usabilidade e navegação do sistema.

- [ ] **Página de Login:**
    - [ ] Reservar espaço superior para o logotipo da empresa/projeto.
    - [ ] Implementar sistema de recuperação de senha.
- [x] **Sidebar Dinâmica:**
    - [x] Implementar comportamento *hover* (expandir ao passar o mouse).
    - [x] Adicionar botão de alternância para fixar/desafixar a barra.
    - [x] Reservar espaço superior para o logotipo da empresa/projeto.
- [ ] **Tematização:**
    - [ ] Implementar seletor de tema (Light/Dark Mode). Definir padrão como Light.
- [x] **Ajustes de Branding:**
    - [x] Padronização de termos: Remover nomenclaturas genéricas como "(Standard)" do Painel de Aprovação.
- [ ] **Ajuste Pop-ups/Notificações**
    - [ ] Não utilizar Pop-ups do navegador, pois podem ser bloqueados. Criar Pop-up próprio do sistema.

## 🟡 Inteligência de Negócio e Painéis Admin
Implementação do Score dinâmico e refinamento da análise de dados.

- [ ] **Painel Geral:**
    - [ ] Transformar painel em uma experiência Mobile-First de alto nível.
- [ ] **Novo BID:**
    - [ ] Ordenação lógica da lista de pátios.
    - [ ] **Termômetro de Importância:** Criar slider dinâmico para peso Preço vs. Prazo (Padrão 70/30).
    - [ ] Implementar *Double Check* (confirmação) antes de publicar o BID.
    - [ ] Transformar painel em uma experiência Mobile-First de alto nível.
- [ ] **Monitoramento e Análise:**
    - [ ] Exibir líderes em tempo real por: Preço, Prazo e Score (ponderado).
    - [ ] Ajustar textos dos rankings para evitar abreviações.
    - [ ] Incluir coluna de "Prazo" na tela de seleção de vencedor.
    - [ ] Criar sistema de templates de justificativa para escolha do vencedor (com campo livre opcional).
    - [ ] Transformar painel em uma experiência Mobile-First de alto nível.
- [ ] **Aprovação Final:**
    - [ ] Transformar painel em uma experiência Mobile-First de alto nível.
- [ ] **Histórico Admin:**
    - [ ] Implementar filtros avançados: Data, Criador do BID (Meus BIDs), Tipo de Operação e Ordenação Cronológica.
    - [ ] Implementar download de PDFs em massa, de acordo com filtros.
    - [ ] Transformar painel em uma experiência Mobile-First de alto nível.
- [ ] **Acessos:**
    - [ ] Transformar painel em uma experiência Mobile-First de alto nível.
- [ ] **Minha Conta:**
    - [ ] Transformar painel em uma experiência Mobile-First de alto nível.

## 🟠 Experiência do Transportador
Refinamento da jornada de quem oferta os lances.

- [ ] **Card de BID:**
    - [ ] Ajustar layout de endereço para melhor leitura.
    - [ ] Adicionar botão de "Informações Detalhadas" (Imagem inteira do veículo, endereços completos não apenas cidade).
    - [ ] Tornar o Card dinâmico: destacar Preço ou Prazo conforme o "Termômetro" definido pelo Admin.
    - [ ] Transformar painel em uma experiência Mobile-First de alto nível.
- [ ] **Segurança de Lance:**
    - [ ] Implementar *Double Check* no envio de lances para evitar erros de digitação (ex: R$ 50,00 vs R$ 5.000,00).
- [ ] **Histórico e Consistência:**
    - [ ] Auditar e corrigir divergência de dados entre diferentes contas de transportadores.
    - [ ] Transformar painel em uma experiência Mobile-First de alto nível.
 - [ ] **Minha Conta:**
    - [ ] Transformar painel em uma experiência Mobile-First de alto nível.

## 🔵 Comunicação e Notificações (E-mail & Canais)
Automação de alertas seguindo normas de privacidade (LGPD).

- [ ] **Lógica de E-mails para Admins:**
    - [ ] Boas-vindas para novos usuários (Link + Credenciais).
    - [ ] Logs de atividade: Receber lances e alertas de "15 e 5 minutos para encerrar" dos BIDs criados pelo próprio admin.
    - [ ] Alertas de aprovação para Admins Master.
- [ ] **Lógica de E-mails para Transportadores:**
    - [ ] Aviso de novo BID publicado.
    - [ ] Alerta de "Lance Superado" imediato.
    - [ ] Lembrete de inatividade (a cada 10min se o BID estiver aberto e sem lances).
    - [ ] Lembrete de inatividade individual (a cada 10min se o BID estiver aberto mas ele ainda não participou).
    - [ ] Notificação de Vencedor (com Admins em cópia).
- [ ] **Privacidade (LGPD):**
    - [ ] Garantir que transportadores não vejam os e-mails uns dos outros (Uso de Cópia Oculta - CCO ou disparos individuais via script).
- [ ] **Integração de Canais:**
    - [ ] Criar bot/canal de notificações em tempo real (Telegram ou WhatsApp).

## 🔴 Documentação e Portfólio
Finalização para apresentação profissional e deploy.

- [ ] **Geração de PDF:**
    - [ ] Refatorar o layout dos relatórios para um design mais profissional e corporativo.
- [x] **GitHub:**
    - [x] Atualizar Tags e descrição do repositório.
    - [x] Criar `README.md` com prints, fluxo de funcionamento e tecnologias utilizadas.
    - [x] Organizar repositório.

---
**Legenda:**
- 🟢 Baixa Complexidade / UI
- 🟡 Regra de Negócio / Backend
- 🟠 Experiência do Usuário (UX)
- 🔵 Integrações / Automação
- 🔴 Documentação