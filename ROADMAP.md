# Roadmap do Produto

Este documento lista as melhorias planejadas e o progresso atual do Sistema de BIDs.

## Visão Admin
- [x] Acrescentar fluxo de aprovação do gestor.
- [x] Gerar código único do BID para fins de auditoria.
- [x] Quantidade de veículos (frotas).
- [x] Aba histórico de BIDs detalhados.
- [x] Acrescentar menu de gestão do banco de dados (gerir acessos, dados transportadores, etc.).
- [x] Aprimorar acessos dos administradores (hierarquia de permissões).
- [x] Arrumar lógica de horário UTC.
- [x] Na gestão de acessos do Admin, é necessário cadastrar o e-mail do fornecedor, gerar novas senhas e mudar senhas. Sempre que um novo fornecedor for cadastrado, será necessário enviar a ele um e-mail com seu novo login e senha.
- [x] Criar uma confirmação de criação do BID, pois as vezes o admin pode escrever o prazo e preço errados, antes de prosseguir precisa ter uma notificação de confirmação.

## Visão Transportador
- [x] Acrescentar histórico de BIDs no menu.
- [x] Gestão de perfil (alteração de senha e e-mail).
- [x] Criar uma confirmação do lance, pois as vezes o transportador pode escrever o prazo e preço errados, antes de prosseguir precisa ter uma notificação de confirmação.

## PDF & Auditoria
- [x] Acrescentar Placa e Código Único no PDF.
- [x] Renomear o PDF com todas as informações importantes.
- [x] Além do PDF, gerar um log completo em outros formatos auditáveis, com mais informações detalhadas.
- [x] Detalhamento de aprovações de BID por usuário.
- [x] Melhorar visual dos Rankings no relatório.
- [x] Adicionar Dashboard de Score.

## Database
- [x] Adicionar tabela de e-mails (transportadores, admin e gestores).

## Backend
- [x] Gerador de senhas aleatórias enviado para o e-mail do admin e transportadores.

## Notificações
- [x] Fluxo de envio de e-mails aos transportadores quando um novo BID for lançado, a todos os admins quando um BID for aprovado, a todos os admins com anexo o doc de auditoria com informações detalhadas daquele BID, ao prestador quando ele vencer um BID, solicitando a remoção ou 
- [x] Ajustar lógica de envio dos e-mails.
- [ ] Criar um Bot do Telegram para acompanhamento em tempo real de atualizações dos BIDs.

"---"

# Próximos passos:
- Refatoração técnica (HTML/CSS para JavaScript/TypeScript).
