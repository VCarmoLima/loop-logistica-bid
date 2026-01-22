-- ESTRUTURA DO BANCO DE DADOS

-- ADMINISTRADORES
CREATE TABLE public.admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    usuario TEXT NOT NULL UNIQUE,
    email TEXT,                   
    senha TEXT NOT NULL,
    role TEXT DEFAULT 'standard', 
    created_at TIMESTAMPTZ DEFAULT now()
);

-- TRANSPORTADORAS
CREATE TABLE public.transportadoras (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    usuario TEXT NOT NULL UNIQUE,
    email TEXT,                   
    senha TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- BIDS
CREATE TABLE public.bids (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Identificação Única
    codigo_unico TEXT,             

    -- Dados do Veículo/Lote
    titulo TEXT NOT NULL,          
    placa TEXT,
    categoria_veiculo TEXT,        
    quantidade_veiculos INTEGER DEFAULT 1, 
    tipo_transporte TEXT,
    possui_chave BOOLEAN DEFAULT FALSE,
    funciona BOOLEAN DEFAULT FALSE,
    imagem_url TEXT,

    -- Dados da Rota
    origem TEXT,
    endereco_retirada TEXT,
    destino TEXT,
    endereco_entrega TEXT,

    -- Prazos e Status
    status TEXT DEFAULT 'ABERTO',  
    prazo_limite TIMESTAMPTZ,
    data_entrega_limite DATE,

    -- Homologação
    lance_vencedor_id UUID,        

    -- Logs de Auditoria e Compliance
    log_criacao TEXT,              
    log_encerramento TEXT,         
    log_selecao TEXT,              
    log_aprovacao TEXT,            

    created_at TIMESTAMPTZ DEFAULT now()
);

-- LANCES
CREATE TABLE public.lances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Relacionamento
    bid_id UUID REFERENCES public.bids(id) ON DELETE CASCADE,

    -- Dados do Lance
    transportadora_nome TEXT NOT NULL,
    valor NUMERIC(10, 2) NOT NULL,
    prazo_dias INTEGER NOT NULL,

    -- Controle
    notificado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RELACIONAMENTOS FINAIS
ALTER TABLE public.bids
    ADD CONSTRAINT fk_lance_vencedor
    FOREIGN KEY (lance_vencedor_id) REFERENCES public.lances(id);

CREATE INDEX idx_bids_status ON public.bids(status);
CREATE INDEX idx_lances_bid_id ON public.lances(bid_id);