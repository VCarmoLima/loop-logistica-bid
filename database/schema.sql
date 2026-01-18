-- =============================================================================
-- ESTRUTURA DO BANCO DE DADOS (SUPABASE / POSTGRESQL)
-- =============================================================================

-- 1. TABELA DE ADMINISTRADORES
CREATE TABLE public.admins (
                               id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                               nome TEXT NOT NULL,
                               usuario TEXT NOT NULL UNIQUE, -- Login único
                               senha TEXT NOT NULL,          -- Em produção, usar hash (ex: bcrypt)
                               created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TABELA DE TRANSPORTADORAS (PARCEIROS)
CREATE TABLE public.transportadoras (
                                        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                                        nome TEXT NOT NULL,
                                        usuario TEXT NOT NULL UNIQUE,
                                        senha TEXT NOT NULL,
                                        created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABELA DE BIDS (LEILÕES)
CREATE TABLE public.bids (
                             id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Dados do Veículo
                             titulo TEXT NOT NULL,       -- Modelo/Versão
                             placa TEXT,                 -- Placa (Adicionado na v2)
                             tipo_transporte TEXT,       -- Ex: Remoção Santander, Pátio a Pátio
                             possui_chave BOOLEAN DEFAULT FALSE,
                             funciona BOOLEAN DEFAULT FALSE,
                             imagem_url TEXT,

    -- Dados da Rota
                             origem TEXT,
                             endereco_retirada TEXT,
                             destino TEXT,
                             endereco_entrega TEXT,

    -- Prazos e Status
                             status TEXT DEFAULT 'ABERTO', -- Opções: 'ABERTO', 'EM_ANALISE', 'FINALIZADO'
                             prazo_limite TIMESTAMPTZ,     -- Data e Hora do fim do leilão
                             data_entrega_limite DATE,     -- Data limite para o transporte ocorrer

    -- Homologação
                             lance_vencedor_id UUID,       -- Preenchido quando o Admin escolhe o vencedor

                             created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TABELA DE LANCES
CREATE TABLE public.lances (
                               id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Relacionamento
                               bid_id UUID REFERENCES public.bids(id) ON DELETE CASCADE,

    -- Dados do Lance
                               transportadora_nome TEXT NOT NULL,
                               valor NUMERIC(10, 2) NOT NULL, -- Valor financeiro
                               prazo_dias INTEGER NOT NULL,   -- Prazo em dias corridos

    -- Controle
                               notificado BOOLEAN DEFAULT FALSE, -- Para envio de e-mails automáticos
                               created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. RELACIONAMENTO DE VENCEDOR (ALTER TABLE APÓS CRIAÇÃO)
-- Garante integridade referencial do vencedor escolhido
ALTER TABLE public.bids
    ADD CONSTRAINT fk_lance_vencedor
        FOREIGN KEY (lance_vencedor_id) REFERENCES public.lances(id);

-- =============================================================================
-- STORAGE (BUCKETS)
-- =============================================================================
-- É necessário criar um bucket público chamado 'veiculos' no painel do Supabase.
-- Policy: Permitir leitura pública (Public Access).
-- Policy: Permitir upload/delete apenas autenticado (ou via API Key).