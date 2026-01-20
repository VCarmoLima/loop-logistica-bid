import streamlit as st
import pandas as pd
from supabase import create_client, Client
import os
from dotenv import load_dotenv
from time import sleep
from datetime import datetime, timedelta, timezone
from utils_pdf import gerar_pdf_auditoria_completo
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import threading

# --- CONFIGURAÇÃO INICIAL ---
st.set_page_config(page_title="BIDs", layout="wide")
load_dotenv()

# --- CONEXÃO SUPABASE ---
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")

if not url or not key:
    st.error("Erro de configuração (.env)")
    st.stop()

@st.cache_resource
def init_connection():
    return create_client(url, key)

supabase = init_connection()

@st.cache_resource
def iniciar_robo_monitoramento():
    def job():
        print("[SaaS] Worker Iniciado em Background...")
        while True:
            try:
                # Usa as credenciais globais para criar uma conexão isolada para o robô
                # Isso evita conflito com a navegação do usuário
                client_worker = create_client(url, key)

                # Lógica original do worker.py
                resp = client_worker.table("bids").select("*").eq("status", "ABERTO").execute()
                agora_utc = datetime.now(timezone.utc)

                for bid in resp.data:
                    prazo_str = bid.get('prazo_limite')
                    if prazo_str:
                        # Tratamento de data e fuso
                        clean_str = prazo_str.replace('Z', '+00:00')
                        prazo_dt = datetime.fromisoformat(clean_str)

                        if agora_utc > prazo_dt:
                            print(f"[Auto] Encerrando: {bid['titulo']}")
                            client_worker.table("bids").update({"status": "EM_ANALISE"}).eq("id", bid['id']).execute()

                sleep(10) # Verifica a cada 10 segundos
            except Exception as e:
                print(f"Erro no Worker: {e}")
                sleep(10)

    # Inicia a thread em modo 'daemon' (não trava o site)
    t = threading.Thread(target=job, daemon=True)
    t.start()

# Liga o robô
iniciar_robo_monitoramento()

# --- SESSÃO ---
if 'logged_in' not in st.session_state: st.session_state.logged_in = False
if 'user_type' not in st.session_state: st.session_state.user_type = None
if 'user_data' not in st.session_state: st.session_state.user_data = {}
if 'login_view' not in st.session_state: st.session_state.login_view = 'provider'

def logout():
    st.session_state.logged_in = False
    st.session_state.user_type = None
    st.session_state.user_data = {}
    st.rerun()

# --- FUNÇÕES AUXILIARES ---
def enviar_email_final(destinatario, assunto, corpo, anexo_path=None):
    try:
        msg = MIMEMultipart()
        msg['From'] = EMAIL_USER
        msg['To'] = destinatario
        msg['Subject'] = assunto
        msg.attach(MIMEText(corpo, 'plain'))
        if anexo_path:
            from email.mime.application import MIMEApplication
            with open(anexo_path, "rb") as f:
                part = MIMEApplication(f.read(), Name=os.path.basename(anexo_path))
            part['Content-Disposition'] = f'attachment; filename="{os.path.basename(anexo_path)}"'
            msg.attach(part)
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASS)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Erro email: {e}")
        return False

# --- CSS PREMIUM ---
st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
    .stApp { background-color: #F0F2F6; }
    /* 2. HEADER E ESTRUTURA (CORREÇÃO MENU) */
    /* Traz de volta o cabeçalho original, mas transparente */
    header[data-testid="stHeader"] {
        background-color: transparent !important;
        visibility: visible !important; /* Garante visibilidade */
        z-index: 99999; /* Garante que fique clicável acima de tudo */
    }
    
    /* Remove apenas a linha colorida decorativa padrão do Streamlit */
    [data-testid="stDecoration"] {
        display: none;
    }

    .main .block-container { 
        padding-top: 1rem !important; 
        max-width: 100% !important; 
    }
    
    /* Barra Superior Ajustada */
    .top-bar {
        background-color: #FFFFFF; 
        padding: 15px 30px; 
        padding-left: 70px; /* <--- ESPAÇO EXTRA PARA O BOTÃO DO MENU NÃO COBRIR O TEXTO */
        margin: -3rem -5rem 30px -5rem; /* Puxa para cima para ocupar o espaço do header transparente */
        border-bottom: 4px solid #FF3B3B; 
        box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        display: flex; align-items: center; justify-content: space-between; 
        position: sticky; top: 0; z-index: 999;
    }
    
    /* --- ESTILO DO MENU LATERAL (Sidebar Navigation) --- */
    
    /* Esconde a "bolinha" do radio button para parecer um menu clicável */
    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] > label > div:first-child {
        display: none;
    }
    
    /* Estila o texto do menu */
    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] > label {
        background-color: transparent;
        padding: 10px 15px;
        border-radius: 6px;
        margin-bottom: 5px;
        border: 1px solid transparent;
        transition: all 0.2s;
        font-weight: 500;
        color: #4B5563;
    }
    
    /* Efeito ao passar o mouse */
    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] > label:hover {
        background-color: #F3F4F6;
        color: #FF3B3B; /* Vermelho */
    }
    
    /* Item Selecionado */
    section[data-testid="stSidebar"] .stRadio div[role="radiogroup"] > label[data-checked="true"] {
        background-color: #FEF2F2; /* Fundo vermelho bem claro */
        color: #DC2626; /* Texto vermelho escuro */
        border: 1px solid #FECACA;
        font-weight: 700;
    }
    
    .top-title { color: #1F2937; font-size: 1.4rem; font-weight: 800; font-family: 'Roboto', sans-serif; text-transform: uppercase; }
    
    [data-testid="stVerticalBlockBorderWrapper"] { background-color: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
    [data-testid="stForm"] { border: none !important; padding: 0 !important; }
    
    button[kind="primary"] { background: linear-gradient(180deg, #FF3B3B 0%, #E02E2E 100%) !important; color: white !important; border: none !important; font-weight: 700 !important; transition: all 0.2s ease !important; }
    button[kind="primary"]:hover { transform: translateY(-1px); box-shadow: 0 6px 12px rgba(220, 38, 38, 0.3) !important; }
    
    .address-box {
        background-color: #F8FAFC; border-left: 4px solid #FF3B3B; padding: 10px; margin-bottom: 10px; border-radius: 4px;
    }
    .address-title { font-size: 0.8rem; font-weight: 700; color: #64748B; text-transform: uppercase; }
    .address-text { font-size: 0.95rem; font-weight: 500; color: #1E293B; }
    </style>
    """, unsafe_allow_html=True)

# --- LOGIN ---
if not st.session_state.logged_in:
    col_vazia_esq, col_centro, col_vazia_dir = st.columns([1.2, 1, 1.2])
    with col_centro:
        st.markdown("<br><br>", unsafe_allow_html=True)
        with st.container(border=True):
            col_l1, col_logo, col_l2 = st.columns([1, 2, 1])
            with col_logo:
                # -----------------------------------------------------------
                # SUBSTITUIÇÃO: Lógica do Logo Genérico
                # -----------------------------------------------------------
                if os.path.exists("image/logo.webp"):
                    st.image("image/logo.webp", use_container_width=True)
                else:
                    # Renderiza um quadrado cinza escrito LOGO se não tiver imagem
                    st.markdown("""
                        <div style="
                            background-color: #E5E7EB; 
                            width: 100%; 
                            height: 100px; 
                            display: flex; 
                            align-items: center; 
                            justify-content: center; 
                            border-radius: 8px; 
                            margin-bottom: 20px;
                            border: 2px dashed #9CA3AF;">
                            <span style="color: #6B7280; font-weight: 800; font-size: 1.5rem; letter-spacing: 2px;">LOGO</span>
                        </div>
                    """, unsafe_allow_html=True)

            if st.session_state.login_view == 'provider':
                st.markdown("<h3 style='text-align: center;'>Acesso Parceiro</h3>", unsafe_allow_html=True)
                with st.form("login_provider"):
                    user = st.text_input("Usuário")
                    pw = st.text_input("Senha", type="password")
                    if st.form_submit_button("ENTRAR", type="primary"):
                        res = supabase.table("transportadoras").select("*").eq("usuario", user).eq("senha", pw).execute()
                        if res.data:
                            st.session_state.logged_in = True; st.session_state.user_type = 'provider'; st.session_state.user_data = res.data[0]; st.rerun()
                        else: st.error("Erro no login.")
                if st.button("Sou Administrador", use_container_width=True): st.session_state.login_view = 'admin'; st.rerun()
            else:
                st.markdown("<h3 style='text-align: center;'>Acesso Administrativo</h3>", unsafe_allow_html=True)
                with st.form("login_admin"):
                    user = st.text_input("Usuário")
                    pw = st.text_input("Senha", type="password")
                    if st.form_submit_button("ENTRAR", type="primary"):
                        res = supabase.table("admins").select("*").eq("usuario", user).eq("senha", pw).execute()
                        if res.data:
                            st.session_state.logged_in = True; st.session_state.user_type = 'admin'; st.session_state.user_data = res.data[0]; st.rerun()
                        else: st.error("Erro no login.")
                if st.button("Voltar", use_container_width=True): st.session_state.login_view = 'provider'; st.rerun()

        # --- AVISO DE COPYRIGHT REINSERIDO ---
        st.markdown("<div style='text-align: center; color: #9CA3AF; font-size: 0.75rem; margin-top: 40px;'>© 2026 - VCarmoLima<br><br><br><br>Precisa de ajuda?<br>viniciuscarmo.contato@gmail.com</div>", unsafe_allow_html=True)

    st.stop()

# --- HEADER SUPERIOR (MANTIDO) ---
st.markdown("""<div class="top-bar"><div class="top-title">BID Logístico</div></div>""", unsafe_allow_html=True)

# --- BARRA LATERAL (SIDEBAR ATUALIZADA) ---
with st.sidebar:
    # 1. LOGO
    # -----------------------------------------------------------
    # SUBSTITUIÇÃO: Lógica do Logo Genérico
    # -----------------------------------------------------------
    if os.path.exists("image/logo.webp"):
        st.image("image/logo.webp", use_container_width=True)
    else:
        # Renderiza um quadrado cinza escrito LOGO se não tiver imagem
        st.markdown("""
            <div style="
                background-color: #E5E7EB; 
                width: 100%; 
                height: 100px; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                border-radius: 8px; 
                margin-bottom: 20px;
                border: 2px dashed #9CA3AF;">
                <span style="color: #6B7280; font-weight: 800; font-size: 1.5rem; letter-spacing: 2px;">LOGO</span>
            </div>
        """, unsafe_allow_html=True)

    # 2. BOAS-VINDAS (PERSONALIZADO: PRETO, NEGRITO, MAIOR)
    st.markdown(f"""
        <div style="margin-top: 20px; margin-bottom: 10px;">
            <div style="font-size: 0.9rem; color: #6B7280; font-weight: 500;">Seja bem-vindo,</div>
            <div style="font-size: 1.4rem; color: #000000; font-weight: 800; line-height: 1.2;">
                {st.session_state.user_data['nome']}
            </div>
        </div>
    """, unsafe_allow_html=True)

    # 3. MENU DE NAVEGAÇÃO
    if st.session_state.user_type == 'admin':
        st.markdown("---") # Linha separadora para Admin
        menu_admin = st.radio(
            "Navegação",
            ["Novo BID", "Monitoramento", "Análise"],
            label_visibility="collapsed"
        )
    else:
        # Para Transportador: Sem menu escrito, sem títulos extras.
        menu_admin = None

        # 4. BOTÃO DE LOGOUT (NO FINAL)
    # Adiciona um espaço flexível antes do logout para separar bem
    st.markdown("", unsafe_allow_html=True)
    st.markdown("---")
    if st.button("Sair / Logout", type="secondary", use_container_width=True):
        logout()

# ==============================================================================
# LÓGICA DE PÁGINAS (INTEGRAÇÃO COM O MENU ACIMA)
# ==============================================================================

# ==============================================================================
# ÁREA ADMIN
# ==============================================================================
if st.session_state.user_type == 'admin':

    # 1. TELA: CRIAR BID
    if menu_admin == "Novo BID":
        st.markdown("### Cadastro de Nova Demanda")
        st.markdown("Preencha os dados abaixo para iniciar um novo processo de cotação.")

        with st.container(border=True):
            with st.form("cadastro_completo", clear_on_submit=True):
                st.markdown("#### Detalhes do Lote")

                # --- NOVO CAMPO: TIPO DE TRANSPORTE ---
                lista_tipos = [
                    "Remoção Santander", "Remoção Frotas", "Remoção Outros Comitentes",
                    "Frete Vendido", "Pátio a Pátio",
                    "Restituição Santander", "Restituição Outros Comitente"
                ]
                tipo_transporte = st.selectbox("Tipo de Transporte", lista_tipos)

                # --- NOVO CAMPO: PLACA (ANTES DO MODELO) ---
                col_placa, col_modelo = st.columns([1, 3])
                placa = col_placa.text_input("Placa do Veículo")
                titulo = col_modelo.text_input("Modelo / Versão", placeholder="Ex: SCANIA R450 A 6X2")

                st.markdown("#### Rota Logística")
                c1, c2 = st.columns(2)
                origem = c1.text_input("Cidade Origem")
                end_ret = c1.text_area("Endereço Coleta", height=80)
                destino = c2.text_input("Cidade Destino")
                end_ent = c2.text_area("Endereço Entrega", height=80)

                st.markdown("#### Encerramento")
                c3, c4 = st.columns(2)
                data_limite = c3.date_input("Data de Encerramento")
                hora_limite = c4.time_input("Horário Limite")

                st.markdown("#### Status")
                c5, c6 = st.columns(2)
                chave = c5.checkbox("Possui Chave")
                funciona = c6.checkbox("Veículo Funciona")

                imagem = st.file_uploader("Foto do Lote", type=['png', 'jpg', 'jpeg', 'webp'])

                st.markdown("---")
                btn_criar = st.form_submit_button("LANÇAR BID NO MERCADO", type="primary")

                if btn_criar and titulo:
                    # Combinar Data e Hora
                    data_completa = datetime.combine(data_limite, hora_limite)
                    fuso_br = timezone(timedelta(hours=-3))
                    data_com_tz = data_completa.replace(tzinfo=fuso_br)

                    url_img = None
                    if imagem:
                        try:
                            safe_filename = imagem.name.replace(" ", "_")
                            nome_arq = f"{int(datetime.now().timestamp())}_{safe_filename}"
                            supabase.storage.from_("veiculos").upload(
                                nome_arq, imagem.getvalue(), {"content-type": imagem.type}
                            )
                            url_img = supabase.storage.from_("veiculos").get_public_url(nome_arq)
                        except Exception as e:
                            st.warning(f"Erro imagem: {e}")

                    dados = {
                        "titulo": titulo,
                        "placa": placa,  # Salva a placa
                        "tipo_transporte": tipo_transporte, # Salva o tipo
                        "origem": origem, "endereco_retirada": end_ret,
                        "destino": destino, "endereco_entrega": end_ent,
                        "possui_chave": chave, "funciona": funciona,
                        "prazo_limite": data_com_tz.isoformat(),
                        "imagem_url": url_img,
                        "status": "ABERTO"
                    }
                    supabase.table("bids").insert(dados).execute()
                    st.success(f"BID Lançado! Encerramento: {data_com_tz.strftime('%d/%m/%Y às %H:%M')}")

    # 2. TELA: MONITORAMENTO
    elif menu_admin == "Monitoramento":
        c_head1, c_head2 = st.columns([3, 1])
        c_head1.markdown("### Painel de Controle")
        if c_head2.button("Atualizar Dados", use_container_width=True): st.rerun()

        bids_ativos = supabase.table("bids").select("*").eq("status", "ABERTO").execute().data

        if not bids_ativos: st.info("Nenhum leilão ativo no momento.")

        for bid in bids_ativos:
            with st.container(border=True):
                cols = st.columns([4, 2, 2])
                cols[0].markdown(f"### {bid['titulo']}")

                try:
                    prazo_dt = datetime.fromisoformat(bid['prazo_limite'].replace('Z', '+00:00'))
                    prazo_str = prazo_dt.strftime('%d/%m/%Y às %H:%M')
                except: prazo_str = "Data Inválida"

                cols[1].markdown(f"**Encerramento:**<br>{prazo_str}", unsafe_allow_html=True)

                if cols[2].button("ENCERRAR AGORA", key=f"close_{bid['id']}", type="primary"):
                    ontem = datetime.now(timezone.utc) - timedelta(days=1)
                    supabase.table("bids").update({"prazo_limite": ontem.isoformat()}).eq("id", bid['id']).execute()
                    st.toast("Encerrando..."); sleep(2); st.rerun()

                st.divider()

                lances = supabase.table("lances").select("*").eq("bid_id", bid['id']).order("valor", desc=False).execute().data
                if lances:
                    df = pd.DataFrame(lances)[['transportadora_nome', 'valor', 'prazo_dias', 'created_at']]
                    df.columns = ['Transportadora', 'Valor (R$)', 'Prazo', 'Data/Hora']
                    df['Valor (R$)'] = df['Valor (R$)'].apply(lambda x: f"R$ {x:,.2f}")
                    df['Data/Hora'] = pd.to_datetime(df['Data/Hora']).dt.tz_convert('America/Sao_Paulo').dt.strftime('%d/%m %H:%M')
                    st.dataframe(df, use_container_width=True, hide_index=True)
                    st.success(f"Líder: **{lances[0]['transportadora_nome']}** - R$ {lances[0]['valor']:,.2f}")
                else:
                    st.warning("Aguardando lances...")

    # 3. TELA: ANÁLISE
    elif menu_admin == "Análise":
        st.markdown("### Homologação de BIDs")

        bids_analise = supabase.table("bids").select("*").eq("status", "EM_ANALISE").execute().data
        if not bids_analise: st.info("Nenhum BID aguardando análise.")

        for bid in bids_analise:
            with st.container(border=True):
                st.markdown(f"## {bid['titulo']}")

                lances = supabase.table("lances").select("*").eq("bid_id", bid['id']).execute().data
                if not lances:
                    st.warning("Sem lances registrados.")
                    if st.button("Finalizar como Deserto", key=f"deserto_{bid['id']}"):
                        supabase.table("bids").update({"status": "FINALIZADO"}).eq("id", bid['id']).execute()
                        st.rerun()
                else:
                    df = pd.DataFrame(lances)

                    # Rankings
                    rank_preco = df.sort_values(by="valor", ascending=True).to_dict('records')
                    rank_prazo = df.sort_values(by="prazo_dias", ascending=True).to_dict('records')
                    min_p = df['valor'].min(); min_d = df['prazo_dias'].min()
                    df['score'] = (min_p / df['valor']) * 70 + (min_d / df['prazo_dias']) * 30
                    rank_score = df.sort_values(by="score", ascending=False).to_dict('records')

                    c1, c2, c3 = st.columns(3)
                    with c1:
                        st.markdown("**Melhor Preço**")
                        st.dataframe(df.sort_values("valor")[['transportadora_nome', 'valor']], hide_index=True)
                    with c2:
                        st.markdown("**Melhor Prazo**")
                        st.dataframe(df.sort_values("prazo_dias")[['transportadora_nome', 'prazo_dias']], hide_index=True)
                    with c3:
                        st.markdown("**Custo-Benefício**")
                        st.dataframe(df.sort_values("score", ascending=False)[['transportadora_nome', 'score']], hide_index=True)

                    st.divider()
                    st.markdown("#### Seleção do Vencedor")

                    opcoes = {f"{l['transportadora_nome']} - R$ {l['valor']}": l['id'] for l in lances}
                    escolha = st.selectbox("Quem deve vencer?", list(opcoes.keys()), key=f"sel_{bid['id']}")
                    vencedor_id = opcoes[escolha]

                    if st.button("CONFIRMAR VENCEDOR", key=f"win_{bid['id']}", type="primary"):
                        supabase.table("bids").update({
                            "status": "FINALIZADO",
                            "lance_vencedor_id": vencedor_id
                        }).eq("id", bid['id']).execute()

                        vencedor_obj = next(l for l in lances if l['id'] == vencedor_id)
                        rankings_dict = {'preco': rank_preco, 'prazo': rank_prazo, 'score': rank_score}
                        path_pdf = gerar_pdf_auditoria_completo(bid, lances, vencedor_obj, rankings_dict)
                        enviar_email_final(EMAIL_USER, f"BID Finalizado: {bid['titulo']}", "Segue auditoria em anexo.", path_pdf)

                        st.success("Processo Finalizado!")
                        sleep(2)
                        st.rerun()

# ==============================================================================
# ÁREA PRESTADOR
# ==============================================================================
else:
    st.sidebar.header("Painel de Cargas")

    # --- BOTÃO DE ATUALIZAÇÃO (Sem Logoff) ---
    col_refresh, _ = st.columns([1, 4])
    if col_refresh.button("🔄 Atualizar Lista de BIDs", type="secondary"):
        st.rerun()

    # BIDs Abertos
    bids = supabase.table("bids").select("*").eq("status", "ABERTO").execute().data

    if not bids: st.info("Sem cargas disponíveis no momento.")

    for bid in bids:
        with st.container(border=True):
            col_img, col_info, col_lance = st.columns([2, 3, 2])

            # --- COLUNA 1: IMAGEM ---
            with col_img:
                if bid.get('imagem_url'):
                    st.image(bid['imagem_url'], use_container_width=True)
                else:
                    st.markdown("<div style='background:#eee;height:150px;display:flex;align-items:center;justify-content:center;color:#999'>Sem Foto</div>", unsafe_allow_html=True)

            # --- COLUNA 2: INFO E MELHOR LANCE ---
            with col_info:
                st.markdown(f"## {bid['titulo']}")

                # Exibe o TIPO DE TRANSPORTE em destaque
                tipo_transp = bid.get('tipo_transporte', 'Transporte Padrão')
                st.markdown(f"**Tipo de Serviço:** <span style='color:#FF3B3B; font-weight:bold'>{tipo_transp}</span>", unsafe_allow_html=True)
                st.markdown("<br>", unsafe_allow_html=True)

                # Endereços
                origem_txt = bid['origem'] if bid['origem'] else "Não informado"
                retirada_txt = bid['endereco_retirada'] if bid['endereco_retirada'] else ""
                destino_txt = bid['destino'] if bid['destino'] else "Não informado"
                entrega_txt = bid['endereco_entrega'] if bid['endereco_entrega'] else ""

                st.markdown(f"""
                <div class="address-box">
                    <div class="address-title">ORIGEM</div>
                    <div class="address-text">{origem_txt}</div>
                    <div style="font-size:0.8rem; color:#555; margin-top:4px;">{retirada_txt}</div>
                </div>
                <div class="address-box">
                    <div class="address-title">DESTINO</div>
                    <div class="address-text">{destino_txt}</div>
                    <div style="font-size:0.8rem; color:#555; margin-top:4px;">{entrega_txt}</div>
                </div>
                """, unsafe_allow_html=True)

                st.markdown("---")

                # BUSCA O LÍDER ATUAL (MENOR PREÇO)
                lances = supabase.table("lances").select("valor, prazo_dias").eq("bid_id", bid['id']).order("valor", desc=False).execute().data

                melhor_valor = None
                melhor_prazo = None

                if lances:
                    # O primeiro da lista é o mais barato
                    melhor_valor = lances[0]['valor']
                    melhor_prazo = lances[0]['prazo_dias']

                    c1, c2 = st.columns(2)
                    c1.metric("Melhor Preço", f"R$ {melhor_valor:,.2f}")
                    c2.metric("Prazo a Bater", f"{melhor_prazo} dias")
                else:
                    st.info("Seja o primeiro a ofertar!")

            # --- COLUNA 3: DAR LANCE ---
            with col_lance:
                st.markdown("#### Enviar Proposta")

                val = st.number_input(f"Valor (R$)", min_value=0.0, step=50.0, key=f"v_{bid['id']}")
                prazo = st.number_input(f"Prazo (Dias)", min_value=1, step=1, key=f"p_{bid['id']}")

                if bid.get('data_entrega_limite'):
                    try:
                        data_limite_fmt = datetime.strptime(bid['data_entrega_limite'], '%Y-%m-%d').strftime('%d/%m/%Y')
                        st.caption(f"Data Limite Cliente: {data_limite_fmt}")
                    except: pass

                if st.button("ENVIAR LANCE", key=f"btn_{bid['id']}", type="primary"):

                    # --- VALIDAÇÃO ---
                    lance_valido = True
                    msg_erro = ""

                    if melhor_valor is not None:
                        # Regra: Preço maior ou igual exige prazo menor
                        if val > melhor_valor and prazo >= melhor_prazo:
                            lance_valido = False
                            msg_erro = f"Seu valor é maior. O prazo deve ser menor que {melhor_prazo} dias."
                        elif val == melhor_valor and prazo >= melhor_prazo:
                            lance_valido = False
                            msg_erro = "Preço empatado. Melhore o prazo para assumir a liderança."

                    if not lance_valido:
                        st.error(f"⚠️ {msg_erro}")
                    else:
                        supabase.table("lances").insert({
                            "bid_id": bid['id'],
                            "transportadora_nome": st.session_state.user_data['nome'],
                            "valor": val,
                            "prazo_dias": prazo
                        }).execute()

                        st.success("Lance Aceito!")
                        sleep(1.5)
                        st.rerun()

        # --- ORIENTAÇÕES AO TRANSPORTADOR ---
        with st.expander("ℹ️ Regras do Leilão e Critérios de Aprovação"):
            st.markdown("""
            **Como funciona o Ranking?**
            1. **Critério Principal:** O sistema prioriza sempre o **Menor Preço**.
            2. **Critério de Desempate:** Em caso de preços similares, vence quem oferecer o **Menor Prazo**.
            
            **Regras para Novos Lances:**
            * Você não pode dar um lance com valor maior que o atual, a menos que seu prazo de entrega seja melhor (menor).
            * Lances empatados em preço e prazo não tomam a liderança.
            
            **Avaliação Final (Score):**
            Ao final do tempo, o administrador analisa um Score que combina 70% Preço e 30% Prazo para decidir o vencedor final.
            """)