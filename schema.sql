-- ============================================================================
-- BANCO DE DADOS SUPABASE - SIMPLO SUPLEMENTOS
-- Copie e cole este código no SQL Editor do Supabase para criar as tabelas!
-- ============================================================================

-- 1. TABELA DE PRODUTOS
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    price NUMERIC NOT NULL,
    old_price NUMERIC,
    stock INT DEFAULT 0,
    category TEXT DEFAULT 'hipertrofia',
    description TEXT,
    img_src TEXT,
    sales INT DEFAULT 0,
    is_paused BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. TABELA DE PEDIDOS
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    client TEXT NOT NULL,
    phone TEXT,
    formatted_phone TEXT,
    address TEXT,
    payment TEXT,
    items TEXT,
    total TEXT,
    status TEXT DEFAULT '🟡 Em Andamento',
    approval_state TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. TABELA DE EXTRATO DE MOVIMENTAÇÃO DE ESTOQUE
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id TEXT PRIMARY KEY,
    time TEXT,
    type TEXT,
    product TEXT,
    qty INT,
    detail TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 4. TABELA DE CUPONS DE DESCONTO
CREATE TABLE IF NOT EXISTS public.coupons (
    code TEXT PRIMARY KEY,
    discount TEXT NOT NULL,
    uses TEXT DEFAULT '0 vezes',
    status TEXT DEFAULT 'Ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 5. TABELA DE CONFIGURAÇÕES DA LOJA (CHAVE PIX, WHATSAPP, BANNER)
CREATE TABLE IF NOT EXISTS public.store_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- PERMISSÕES DE LEITURA E ESCRITA PÚBLICA (POLICIES RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso público total produtos" ON public.products;
DROP POLICY IF EXISTS "Acesso público total pedidos" ON public.orders;
DROP POLICY IF EXISTS "Acesso público total movimentacoes" ON public.stock_movements;
DROP POLICY IF EXISTS "Acesso público total cupons" ON public.coupons;
DROP POLICY IF EXISTS "Acesso público total configuracoes" ON public.store_settings;

CREATE POLICY "Acesso público total produtos" ON public.products FOR ALL USING (true);
CREATE POLICY "Acesso público total pedidos" ON public.orders FOR ALL USING (true);
CREATE POLICY "Acesso público total movimentacoes" ON public.stock_movements FOR ALL USING (true);
CREATE POLICY "Acesso público total cupons" ON public.coupons FOR ALL USING (true);
CREATE POLICY "Acesso público total configuracoes" ON public.store_settings FOR ALL USING (true);

-- REGISTROS INICIAIS DE TESTE (OPCIONAL)
INSERT INTO public.coupons (code, discount, uses, status) VALUES
('SIMPLO10', '10% OFF em todo o site', '0 vezes', 'Ativo'),
('ENTREGAHOJE', 'R$ 15,00 OFF de Frete Grátis', '0 vezes', 'Ativo'),
('CREATINA20', 'R$ 20,00 OFF em Creatina', '0 vezes', 'Ativo')
ON CONFLICT (code) DO NOTHING;
