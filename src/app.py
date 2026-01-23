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
import random
import string

st.set_page_config(page_title="BIDs", layout="wide")
load_dotenv()


def get_secret(key):
    if key in st.secrets:
        return st.secrets[key]
    return os.getenv(key)


url = get_secret("SUPABASE_URL")
key = get_secret("SUPABASE_KEY")
EMAIL_USER = get_secret("EMAIL_USER")
EMAIL_PASS = get_secret("EMAIL_PASS")

if not url or not key:
    st.error("Erro de configuração: Credenciais (Secrets/.env) não encontradas.")
    st.stop()


@st.cache_resource
def init_connection():
    return create_client(url, key)


supabase = init_connection()


def gerar_codigo_bid():
    prefixo = datetime.now().strftime("%Y%m")
    sufixo = "".join(random.choices(string.ascii_uppercase + string.digits, k=8))
    return f"BID-{prefixo}-{sufixo}"


def gerar_senha_forte(tamanho=10):
    if tamanho < 8:
        tamanho = 8

    senha = [
        random.choice(string.ascii_uppercase),
        random.choice(string.ascii_lowercase),
        random.choice(string.digits),
        random.choice("@$!%*?&"),
    ]

    todos_caracteres = string.ascii_letters + string.digits + "@$!%*?&"
    senha += random.choices(todos_caracteres, k=tamanho - 4)
    random.shuffle(senha)
    return "".join(senha)


def validar_senha_input(senha):
    if len(senha) < 8:
        return False, "Mínimo 8 caracteres."
    if not re.search(r"[A-Z]", senha):
        return False, "Precisa ter letra maiúscula."
    if not re.search(r"[0-9]", senha):
        return False, "Precisa ter número."
    if not re.search(r"[@$!%*?&]", senha):
        return False, "Precisa ter caractere especial (@$!%*?&)."
    return True, "Senha válida."


def get_audit_stamp(usuario_nome):
    agora = datetime.now(timezone(timedelta(hours=-3))).strftime("%d/%m/%Y %H:%M:%S")
    return f"{usuario_nome} em {agora}"


def enviar_credenciais(nome, email, usuario, senha, tipo="Novo Acesso"):
    assunto = f"Logística BIDs - Credenciais de Acesso ({tipo})"
    corpo = f"""
    Olá, {nome}.
    
    Seu acesso ao sistema de BIDs foi configurado/atualizado.
    
    Link: https://bidlogistico.streamlit.app/
    Usuário: {usuario}
    Senha Provisória: {senha}
    
    Recomendamos trocar sua senha no primeiro acesso.
    
    Atenciosamente,
    Equipe Logística
    """
    return enviar_email_final(email, assunto, corpo)


FUSO_BR = timezone(timedelta(hours=-3))


def formatar_data_br(data_iso):
    if not data_iso:
        return "Data Indefinida"
    try:
        dt_utc = datetime.fromisoformat(data_iso.replace("Z", "+00:00"))
        dt_br = dt_utc.astimezone(FUSO_BR)
        return dt_br.strftime("%d/%m/%Y às %H:%M")
    except:
        return "Erro Data"


def get_html_template(
    titulo, corpo_html, call_to_action_url=None, call_to_action_text="ACESSAR SISTEMA"
):
    btn_html = ""
    if call_to_action_url:
        btn_html = f"""
        <div style="text-align: center; margin: 30px 0;">
            <a href="{call_to_action_url}" style="background-color: #FF3B3B; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">{call_to_action_text}</a>
        </div>
        """

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Helvetica', 'Arial', sans-serif; background-color: #f3f4f6; margin: 0; padding: 0; }}
            .container {{ max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
            .header {{ background-color: #FF3B3B; padding: 20px; text-align: center; }}
            .header h1 {{ color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 2px; text-transform: uppercase; }}
            .content {{ padding: 30px; color: #333333; line-height: 1.6; font-size: 16px; }}
            .footer {{ background-color: #1F2937; padding: 20px; text-align: center; color: #9CA3AF; font-size: 12px; }}
            .highlight {{ color: #FF3B3B; font-weight: bold; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>BIDs</h1>
            </div>
            <div class="content">
                <h2 style="color: #111; margin-top: 0;">{titulo}</h2>
                {corpo_html}
                {btn_html}
            </div>
            <div class="footer">
                <p>Este é um e-mail automático. Por favor, não responda.</p>
                <p>© 2026 VCarmoLima - Todos os direitos reservados.</p>
            </div>
        </div>
    </body>
    </html>
    """


def enviar_email_background(
    destinatarios, assunto, html_content, lista_anexos=None, cc_list=None
):
    try:
        if isinstance(destinatarios, str):
            destinatarios = [destinatarios]
        if cc_list and isinstance(cc_list, str):
            cc_list = [cc_list]

        msg = MIMEMultipart()
        msg["From"] = EMAIL_USER
        msg["Subject"] = assunto

        if len(destinatarios) > 1:
            msg["To"] = EMAIL_USER
            msg["Bcc"] = ", ".join(destinatarios)
            if cc_list:
                msg["Cc"] = ", ".join(cc_list)

        else:
            msg["To"] = destinatarios[0]
            if cc_list:
                msg["Cc"] = ", ".join(cc_list)

        msg.attach(MIMEText(html_content, "html"))

        if lista_anexos:
            if isinstance(lista_anexos, str):
                lista_anexos = [lista_anexos]

            from email.mime.application import MIMEApplication

            for anexo_path in lista_anexos:
                if os.path.exists(anexo_path):
                    with open(anexo_path, "rb") as f:
                        part = MIMEApplication(
                            f.read(), Name=os.path.basename(anexo_path)
                        )
                    part["Content-Disposition"] = (
                        f'attachment; filename="{os.path.basename(anexo_path)}"'
                    )
                    msg.attach(part)

        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASS)
        server.send_message(msg)
        server.quit()
        print(f"Email enviado para {destinatarios} (CC: {cc_list})")

        if lista_anexos:
            if isinstance(lista_anexos, str):
                lista_anexos = [lista_anexos]
            for f in lista_anexos:
                if os.path.exists(f):
                    try:
                        os.remove(f)
                    except:
                        pass

    except Exception as e:
        print(f"Erro envio email: {e}")


def notificar_usuarios(tipo, dados_bid=None, anexos=None, vencedor_dados=None):
    try:
        admins = [
            u["email"]
            for u in supabase.table("admins")
            .select("email")
            .neq("email", None)
            .execute()
            .data
            if u.get("email")
        ]
        transp = [
            u["email"]
            for u in supabase.table("transportadoras")
            .select("email")
            .neq("email", None)
            .execute()
            .data
            if u.get("email")
        ]
    except:
        admins = []
        transp = []

    link_sistema = "https://bidlogistico.streamlit.app"
    if tipo == "NOVO_BID":
        assunto = f"Nova Oportunidade: {dados_bid['titulo']}"
        html = get_html_template(
            f"Novo BID Disponível: {dados_bid['codigo_unico']}",
            f"""
            <p>Um novo processo de cotação foi aberto na plataforma.</p>
            <ul>
                <li><b>Veículo:</b> {dados_bid['titulo']}</li>
                <li><b>Origem:</b> {dados_bid['origem']}</li>
                <li><b>Destino:</b> {dados_bid['destino']}</li>
                <li><b>Categoria:</b> {dados_bid['categoria_veiculo']}</li>
                <li><b>Qtd:</b> {dados_bid['quantidade_veiculos']}</li>
            </ul>
            <p>Acesse a plataforma agora para enviar sua proposta.</p>
            """,
            link_sistema,
            "ACESSAR PAINEL",
        )
        todos = list(set(admins + transp))
        if todos:
            threading.Thread(
                target=enviar_email_background, args=(todos, assunto, html)
            ).start()

    elif tipo == "APROVACAO_FINAL":
        if vencedor_dados and vencedor_dados.get("email"):
            assunto_win = f"Você Venceu! BID {dados_bid['codigo_unico']}"
            html_win = get_html_template(
                "Parabéns! Sua proposta foi aceita.",
                f"""
                <p>Informamos que sua transportadora <b>{vencedor_dados['nome']}</b> foi a vencedora do processo.</p>
                <p><b>BID:</b> {dados_bid['titulo']} ({dados_bid['codigo_unico']})</p>
                <p>Nossa equipe entrará em contato em breve para os trâmites operacionais.</p>
                """,
                link_sistema,
                "VER DETALHES",
            )

            threading.Thread(
                target=enviar_email_background,
                args=([vencedor_dados["email"]], assunto_win, html_win, None, admins),
            ).start()

        if admins:
            assunto_adm = f"BID Auditado: {dados_bid['codigo_unico']}"
            html_adm = get_html_template(
                "Auditoria de Processo Finalizado",
                f"""
                <p>O BID foi finalizado e o vencedor notificado (vocês receberam cópia).</p>
                <p>Seguem em anexo os <b>logs técnicos e auditoria</b> para arquivamento.</p>
                """,
                link_sistema,
                "ACESSAR DASHBOARD",
            )
            threading.Thread(
                target=enviar_email_background,
                args=(admins, assunto_adm, html_adm, anexos),
            ).start()

    elif tipo == "REPROVACAO":
        if admins:
            assunto = f"BID Reprovado/Retornado: {dados_bid['codigo_unico']}"
            html = get_html_template(
                "Processo Devolvido para Análise",
                f"""
                <p>O BID <b>{dados_bid['titulo']}</b> foi reprovado na etapa de validação Master.</p>
                <p>Ele retornou para o status <b>EM ANÁLISE</b> para reavaliação ou cancelamento.</p>
                """,
                link_sistema,
            )
            threading.Thread(
                target=enviar_email_background, args=(admins, assunto, html)
            ).start()


def enviar_credenciais(nome, email, usuario, senha, tipo="Novo Acesso"):
    html = get_html_template(
        f"Credenciais de Acesso: {tipo}",
        f"""
        <p>Olá, <b>{nome}</b>.</p>
        <p>Seu acesso ao sistema de BIDs foi configurado.</p>
        <div style="background:#eee; padding:15px; border-radius:5px; margin:15px 0;">
            <b>Usuário:</b> {usuario}<br>
            <b>Senha Provisória:</b> {senha}
        </div>
        <p>Recomendamos trocar sua senha no primeiro acesso.</p>
        """,
        "https://bidlogistico.streamlit.app",
        "FAZER LOGIN",
    )
    threading.Thread(
        target=enviar_email_background,
        args=([email], "Acesso ao sistema de BIDs", html),
    ).start()


@st.cache_resource
def iniciar_robo_monitoramento():
    def job():
        print("[SaaS] Worker Iniciado em Background...")
        while True:
            try:
                client_worker = create_client(url, key)

                resp = (
                    client_worker.table("bids")
                    .select("*")
                    .eq("status", "ABERTO")
                    .execute()
                )
                agora_utc = datetime.now(timezone.utc)

                for bid in resp.data:
                    prazo_str = bid.get("prazo_limite")
                    if prazo_str:
                        clean_str = prazo_str.replace("Z", "+00:00")
                        prazo_dt = datetime.fromisoformat(clean_str)

                        if agora_utc > prazo_dt:
                            print(f"[Auto] Encerrando: {bid['titulo']}")
                            client_worker.table("bids").update(
                                {"status": "EM_ANALISE"}
                            ).eq("id", bid["id"]).execute()

                sleep(10)
            except Exception as e:
                print(f"Erro no Worker: {e}")
                sleep(10)

    t = threading.Thread(target=job, daemon=True)
    t.start()


iniciar_robo_monitoramento()

if "logged_in" not in st.session_state:
    st.session_state.logged_in = False
if "user_type" not in st.session_state:
    st.session_state.user_type = None
if "user_data" not in st.session_state:
    st.session_state.user_data = {}
if "login_view" not in st.session_state:
    st.session_state.login_view = "provider"


def logout():
    st.session_state.logged_in = False
    st.session_state.user_type = None
    st.session_state.user_data = {}
    st.rerun()


def enviar_email_final(destinatario, assunto, corpo, anexo_path=None):
    try:
        msg = MIMEMultipart()
        msg["From"] = EMAIL_USER
        msg["To"] = destinatario
        msg["Subject"] = assunto
        msg.attach(MIMEText(corpo, "plain"))
        if anexo_path:
            from email.mime.application import MIMEApplication

            with open(anexo_path, "rb") as f:
                part = MIMEApplication(f.read(), Name=os.path.basename(anexo_path))
            part["Content-Disposition"] = (
                f'attachment; filename="{os.path.basename(anexo_path)}"'
            )
            msg.attach(part)
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASS)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Erro email: {e}")
        return False


st.markdown(
    """
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
    """,
    unsafe_allow_html=True,
)

if not st.session_state.logged_in:
    col_vazia_esq, col_centro, col_vazia_dir = st.columns([1.2, 1, 1.2])
    with col_centro:
        st.markdown("<br><br>", unsafe_allow_html=True)
        with st.container(border=True):
            col_l1, col_logo, col_l2 = st.columns([1, 2, 1])
            with col_logo:
                if os.path.exists("image/logo.webp"):
                    st.image("image/logo.webp", use_container_width=True)
                else:
                    st.markdown(
                        """
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
                    """,
                        unsafe_allow_html=True,
                    )

            if st.session_state.login_view == "provider":
                st.markdown(
                    "<h3 style='text-align: center;'>Acesso Parceiro</h3>",
                    unsafe_allow_html=True,
                )
                with st.form("login_provider"):
                    user = st.text_input("Usuário")
                    pw = st.text_input("Senha", type="password")
                    if st.form_submit_button("ENTRAR", type="primary"):
                        res = (
                            supabase.table("transportadoras")
                            .select("*")
                            .eq("usuario", user)
                            .eq("senha", pw)
                            .execute()
                        )
                        if res.data:
                            st.session_state.logged_in = True
                            st.session_state.user_type = "provider"
                            st.session_state.user_data = res.data[0]
                            st.rerun()
                        else:
                            st.error("Erro no login.")
                if st.button("Sou Administrador", use_container_width=True):
                    st.session_state.login_view = "admin"
                    st.rerun()
            else:
                st.markdown(
                    "<h3 style='text-align: center;'>Acesso Administrativo</h3>",
                    unsafe_allow_html=True,
                )
                with st.form("login_admin"):
                    user = st.text_input("Usuário")
                    pw = st.text_input("Senha", type="password")
                    if st.form_submit_button("ENTRAR", type="primary"):
                        res = (
                            supabase.table("admins")
                            .select("*")
                            .eq("usuario", user)
                            .eq("senha", pw)
                            .execute()
                        )
                        if res.data:
                            usuario_encontrado = res.data[0]
                            st.session_state.logged_in = True
                            st.session_state.user_type = "admin"
                            st.session_state.user_data = usuario_encontrado
                            st.session_state.user_role = usuario_encontrado.get(
                                "role", "standard"
                            )
                            st.rerun()
                        else:
                            st.error("Erro no login.")
                if st.button("Voltar", use_container_width=True):
                    st.session_state.login_view = "provider"
                    st.rerun()

        st.markdown(
            "<div style='text-align: center; color: #9CA3AF; font-size: 0.75rem; margin-top: 40px;'>© 2026 VCarmoLima - Todos os direitos reservados.<br><br><br><br>Precisa de ajuda?<br>viniciuscarmo.contato@gmail.com</div>",
            unsafe_allow_html=True,
        )

    st.stop()

st.markdown(
    """<div class="top-bar"><div class="top-title">BID Logístico</div></div>""",
    unsafe_allow_html=True,
)
with st.sidebar:
    if os.path.exists("image/logo.webp"):
        st.image("image/logo.webp", use_container_width=True)
    else:
        st.markdown(
            """
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
        """,
            unsafe_allow_html=True,
        )

    st.markdown(
        f"""
        <div style="margin-top: 20px; margin-bottom: 10px;">
            <div style="font-size: 0.9rem; color: #6B7280; font-weight: 500;">Seja bem-vindo,</div>
            <div style="font-size: 1.4rem; color: #000000; font-weight: 800; line-height: 1.2;">
                {st.session_state.user_data['nome']}
            </div>
        </div>
    """,
        unsafe_allow_html=True,
    )

    if st.session_state.user_type == "admin":
        st.markdown("---")

        opcoes = [
            "Novo BID",
            "Monitoramento",
            "Análise",
            "Histórico",
            "Gestão de Acessos",
        ]
        if st.session_state.get("user_role") == "master":
            opcoes.append("Aprovação")  # <--- NOVO
        menu_admin = st.radio("Navegação", opcoes, label_visibility="collapsed")
    else:
        st.markdown("---")

        menu_provider = st.radio(
            "Menu",
            ["Painel de BIDs", "Histórico", "Minha Conta"],
            label_visibility="collapsed",
        )

    st.markdown("", unsafe_allow_html=True)
    st.markdown("---")
    if st.button("Sair / Logout", type="secondary", use_container_width=True):
        logout()


# ÁREA ADMIN
if st.session_state.user_type == "admin":

    if menu_admin == "Novo BID":
        st.markdown("### Cadastro de Nova Demanda")
        st.markdown("Preencha os dados abaixo e revise antes de lançar.")

        if "dados_confirmacao_bid" not in st.session_state:
            st.session_state.dados_confirmacao_bid = None

        if "form_key_bid" not in st.session_state:
            st.session_state.form_key_bid = 0

        if not st.session_state.dados_confirmacao_bid:
            with st.container(border=True):
                with st.form(
                    key=f"form_bid_{st.session_state.form_key_bid}",
                    clear_on_submit=False,
                ):
                    st.markdown("#### Detalhes do Lote")

                    st.markdown("#### 1. Dados do Veículo")
                    c_cat, c_qtd, c_tipo = st.columns([1, 1, 2])
                    cat = c_cat.selectbox(
                        "Categoria", ["Moto", "Leve", "Utilitário", "Pesado"]
                    )
                    qtd = c_qtd.number_input(
                        "Qtd. Veículos", min_value=1, value=1, step=1
                    )

                    lista_tipos = [
                        "Remoção Santander",
                        "Remoção Frotas",
                        "Remoção Outros Comitentes",
                        "Frete Vendido",
                        "Pátio a Pátio",
                        "Restituição Santander",
                        "Restituição Outros Comitente",
                    ]
                    tipo_transporte = c_tipo.selectbox("Tipo de Operação", lista_tipos)

                    col_placa, col_modelo = st.columns([1, 3])
                    placa = col_placa.text_input("Placa do Veículo")
                    titulo = col_modelo.text_input(
                        "Modelo / Versão", placeholder="Ex: SCANIA R450 A 6X2"
                    )

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

                    imagem = st.file_uploader(
                        "Foto do Lote", type=["png", "jpg", "jpeg", "webp"]
                    )

                    st.markdown("---")
                    btn_revisar = st.form_submit_button("REVISAR DADOS", type="primary")

                    if btn_revisar:
                        if not titulo:
                            st.error("⚠️ O campo 'Modelo / Versão' é obrigatório.")
                        else:
                            data_completa = datetime.combine(data_limite, hora_limite)
                            fuso_br = timezone(timedelta(hours=-3))
                            data_com_tz = data_completa.replace(tzinfo=fuso_br)

                            cod_unico = gerar_codigo_bid()

                            url_img = None
                            if imagem:
                                try:
                                    safe_filename = imagem.name.replace(" ", "_")
                                    nome_arq = f"{int(datetime.now().timestamp())}_{safe_filename}"
                                    supabase.storage.from_("veiculos").upload(
                                        nome_arq,
                                        imagem.getvalue(),
                                        {"content-type": imagem.type},
                                    )
                                    url_img = supabase.storage.from_(
                                        "veiculos"
                                    ).get_public_url(nome_arq)
                                except Exception as e:
                                    st.warning(f"Erro imagem: {e}")

                            st.session_state.dados_confirmacao_bid = {
                                "codigo_unico": cod_unico,
                                "categoria_veiculo": cat,
                                "quantidade_veiculos": qtd,
                                "titulo": titulo,
                                "placa": placa,
                                "tipo_transporte": tipo_transporte,
                                "origem": origem,
                                "endereco_retirada": end_ret,
                                "destino": destino,
                                "endereco_entrega": end_ent,
                                "possui_chave": chave,
                                "funciona": funciona,
                                "prazo_limite": data_com_tz.isoformat(),
                                "imagem_url": url_img,
                                "status": "ABERTO",
                                "display_prazo": data_com_tz.strftime(
                                    "%d/%m/%Y às %H:%M"
                                ),
                            }
                            st.rerun()

        else:
            dados = st.session_state.dados_confirmacao_bid

            st.warning("⚠️ **ATENÇÃO:** Revise os dados abaixo antes de lançar o BID.")

            with st.container(border=True):
                c1, c2 = st.columns([1, 3])
                if dados["imagem_url"]:
                    c1.image(dados["imagem_url"], use_container_width=True)
                else:
                    c1.info("Sem foto")

                with c2:
                    st.markdown(f"### {dados['titulo']}")
                    st.markdown(f"**Operação:** {dados['tipo_transporte']}")
                    st.markdown(
                        f"**Placa:** {dados['placa']} | **Qtd:** {dados['quantidade_veiculos']}"
                    )
                    st.divider()
                    st.markdown(f"**Origem:** {dados['origem']}")
                    st.markdown(f"**Destino:** {dados['destino']}")
                    st.divider()
                    st.markdown(
                        f"**Encerramento:** <span style='color:red; font-weight:bold'>{dados['display_prazo']}</span>",
                        unsafe_allow_html=True,
                    )

            col_conf_1, col_conf_2 = st.columns(2)

            if col_conf_1.button(
                "CONFIRMAR E LANÇAR", type="primary", use_container_width=True
            ):
                dados_save = dados.copy()
                del dados_save["display_prazo"]

                dados_save["log_criacao"] = get_audit_stamp(
                    st.session_state.user_data["nome"]
                )

                supabase.table("bids").insert(dados_save).execute()
                st.success(f"{dados['codigo_unico']} Criado com Sucesso!")

                notificar_usuarios("NOVO_BID", dados_bid=dados_save)

                st.session_state.dados_confirmacao_bid = None
                st.session_state.form_key_bid += 1
                sleep(2)
                st.rerun()

            if col_conf_2.button("VOLTAR E CORRIGIR", use_container_width=True):
                st.session_state.dados_confirmacao_bid = None
                st.rerun()

    elif menu_admin == "Monitoramento":
        c_head1, c_head2 = st.columns([3, 1])
        c_head1.markdown("### Painel de Controle")
        if c_head2.button("Atualizar Dados", use_container_width=True):
            st.rerun()

        bids_ativos = (
            supabase.table("bids").select("*").eq("status", "ABERTO").execute().data
        )

        if not bids_ativos:
            st.info("Nenhum leilão ativo no momento.")

        for bid in bids_ativos:
            with st.container(border=True):
                cols = st.columns([4, 2, 2])
                cols[0].markdown(f"### {bid['titulo']}")

                prazo_str = formatar_data_br(bid.get("prazo_limite"))

                cols[1].markdown(
                    f"**Encerramento:**<br>{prazo_str}", unsafe_allow_html=True
                )

                if cols[2].button(
                    "ENCERRAR AGORA", key=f"close_{bid['id']}", type="primary"
                ):
                    ontem = datetime.now(timezone.utc) - timedelta(days=1)
                    supabase.table("bids").update(
                        {
                            "prazo_limite": ontem.isoformat(),
                            "log_encerramento": get_audit_stamp(
                                st.session_state.user_data["nome"]
                            ),
                        }
                    ).eq("id", bid["id"]).execute()
                    st.toast("Encerrando...")
                    sleep(2)
                    st.rerun()

                st.divider()

                lances = (
                    supabase.table("lances")
                    .select("*")
                    .eq("bid_id", bid["id"])
                    .order("valor", desc=False)
                    .execute()
                    .data
                )
                if lances:
                    df = pd.DataFrame(lances)[
                        ["transportadora_nome", "valor", "prazo_dias", "created_at"]
                    ]
                    df.columns = ["Transportadora", "Valor (R$)", "Prazo", "Data/Hora"]
                    df["Valor (R$)"] = df["Valor (R$)"].apply(lambda x: f"R$ {x:,.2f}")
                    df["Data/Hora"] = (
                        pd.to_datetime(df["Data/Hora"])
                        .dt.tz_convert("America/Sao_Paulo")
                        .dt.strftime("%d/%m %H:%M")
                    )
                    st.dataframe(df, use_container_width=True, hide_index=True)
                    st.success(
                        f"Líder: **{lances[0]['transportadora_nome']}** - R$ {lances[0]['valor']:,.2f}"
                    )
                else:
                    st.warning("Aguardando lances...")

    elif menu_admin == "Análise":
        st.markdown("### Homologação de BIDs")

        bids_analise = (
            supabase.table("bids").select("*").eq("status", "EM_ANALISE").execute().data
        )
        if not bids_analise:
            st.info("Nenhum BID aguardando análise.")

        for bid in bids_analise:
            with st.container(border=True):
                st.markdown(f"## {bid['titulo']}")

                lances = (
                    supabase.table("lances")
                    .select("*")
                    .eq("bid_id", bid["id"])
                    .execute()
                    .data
                )
                if not lances:
                    st.warning("Sem lances registrados.")
                    if st.button("Finalizar como Deserto", key=f"deserto_{bid['id']}"):
                        supabase.table("bids").update({"status": "FINALIZADO"}).eq(
                            "id", bid["id"]
                        ).execute()
                        st.rerun()
                else:
                    df = pd.DataFrame(lances)

                    rank_preco = df.sort_values(by="valor", ascending=True).to_dict(
                        "records"
                    )
                    rank_prazo = df.sort_values(
                        by="prazo_dias", ascending=True
                    ).to_dict("records")
                    min_p = df["valor"].min()
                    min_d = df["prazo_dias"].min()
                    df["score"] = (min_p / df["valor"]) * 70 + (
                        min_d / df["prazo_dias"]
                    ) * 30
                    rank_score = df.sort_values(by="score", ascending=False).to_dict(
                        "records"
                    )

                    c1, c2, c3 = st.columns(3)
                    with c1:
                        st.markdown("**Melhor Preço**")
                        st.dataframe(
                            df.sort_values("valor")[["transportadora_nome", "valor"]],
                            hide_index=True,
                        )
                    with c2:
                        st.markdown("**Melhor Prazo**")
                        st.dataframe(
                            df.sort_values("prazo_dias")[
                                ["transportadora_nome", "prazo_dias"]
                            ],
                            hide_index=True,
                        )
                    with c3:
                        st.markdown("**Custo-Benefício**")
                        st.dataframe(
                            df.sort_values("score", ascending=False)[
                                ["transportadora_nome", "score"]
                            ],
                            hide_index=True,
                        )

                    st.divider()
                    st.markdown("#### Seleção do Vencedor")

                    opcoes = {
                        f"{l['transportadora_nome']} - R$ {l['valor']}": l["id"]
                        for l in lances
                    }
                    escolha = st.selectbox(
                        "Quem deve vencer?", list(opcoes.keys()), key=f"sel_{bid['id']}"
                    )
                    vencedor_id = opcoes[escolha]

                    if st.button(
                        "SELECIONAR VENCEDOR", key=f"win_{bid['id']}", type="primary"
                    ):
                        stamp = get_audit_stamp(st.session_state.user_data["nome"])
                        supabase.table("bids").update(
                            {
                                "status": "AGUARDANDO_APROVACAO",
                                "lance_vencedor_id": vencedor_id,
                                "log_selecao": stamp,
                            }
                        ).eq("id", bid["id"]).execute()

                        st.success(
                            "Vencedor selecionado! O processo foi enviado para APROVAÇÃO do Master."
                        )
                        sleep(2)
                        st.rerun()

    elif menu_admin == "Histórico":
        st.markdown("### Histórico de BIDs Finalizados")

        bids_hist = (
            supabase.table("bids")
            .select("*")
            .eq("status", "FINALIZADO")
            .order("created_at", desc=True)
            .execute()
            .data
        )

        if not bids_hist:
            st.info("Nenhum histórico disponível.")

        for bid in bids_hist:
            vencedor_txt = "Sem Vencedor"
            if bid.get("lance_vencedor_id"):
                v_res = (
                    supabase.table("lances")
                    .select("transportadora_nome, valor")
                    .eq("id", bid["lance_vencedor_id"])
                    .execute()
                    .data
                )
                if v_res:
                    vencedor_txt = f"{v_res[0]['transportadora_nome']} (R$ {v_res[0]['valor']:,.2f})"

            with st.expander(
                f"{bid.get('codigo_unico','---')} | {bid['titulo']} | {vencedor_txt}"
            ):
                c1, c2 = st.columns([1, 2])
                c1.markdown(f"**Placa:** {bid.get('placa','---')}")
                c1.markdown(f"**Origem:** {bid['origem']}")
                c1.markdown(f"**Destino:** {bid['destino']}")

                lances_hist = (
                    supabase.table("lances")
                    .select("*")
                    .eq("bid_id", bid["id"])
                    .execute()
                    .data
                )

                if lances_hist:
                    df = pd.DataFrame(lances_hist)
                    min_p = df["valor"].min()
                    min_d = df["prazo_dias"].min()
                    df["score"] = (min_p / df["valor"]) * 70 + (
                        min_d / df["prazo_dias"]
                    ) * 30

                    df_show = df[
                        ["transportadora_nome", "valor", "prazo_dias", "score"]
                    ].sort_values(by="score", ascending=False)
                    df_show.columns = ["Transportadora", "Valor (R$)", "Prazo", "Score"]
                    df_show["Valor (R$)"] = df_show["Valor (R$)"].apply(
                        lambda x: f"R$ {x:,.2f}"
                    )
                    df_show["Score"] = df_show["Score"].apply(lambda x: f"{x:.1f}")

                    c2.dataframe(df_show, use_container_width=True, hide_index=True)
                else:
                    c2.warning("BID finalizado sem lances (Deserto).")

    elif menu_admin == "Gestão de Acessos":
        st.markdown("### Gestão de Usuários e Acessos")

        user_role = st.session_state.user_data.get("role", "standard")
        is_master = user_role == "master"

        if is_master:
            tab_admins, tab_transp = st.tabs(["Administradores", "Transportadoras"])
        else:
            (tab_transp,) = st.tabs(["Transportadoras"])
            tab_admins = None

        if is_master and tab_admins:
            with tab_admins:
                st.info("Cadastro de equipe interna.")
                with st.expander("Novo Administrador", expanded=False):
                    with st.form("novo_admin_form"):
                        c1, c2 = st.columns(2)
                        n_nome = c1.text_input("Nome")
                        n_email = c2.text_input("Email")
                        c3, c4 = st.columns(2)
                        n_user = c3.text_input("Login")
                        n_role = c4.selectbox("Nível", ["standard", "master"])

                        if st.form_submit_button("CRIAR"):
                            if n_nome and n_user:
                                s_temp = gerar_senha_forte()
                                try:
                                    supabase.table("admins").insert(
                                        {
                                            "nome": n_nome,
                                            "usuario": n_user,
                                            "email": n_email,
                                            "senha": s_temp,
                                            "role": n_role,
                                        }
                                    ).execute()
                                    enviar_credenciais(n_nome, n_email, n_user, s_temp)
                                    st.success("Criado!")
                                    sleep(1)
                                    st.rerun()
                                except Exception as e:
                                    st.error(f"Erro: {e}")

                st.markdown("#### Equipe Ativa")
                try:
                    adms = (
                        supabase.table("admins")
                        .select("*")
                        .order("nome")
                        .execute()
                        .data
                    )
                except:
                    adms = []

                if not adms:
                    st.warning("Nenhum administrador encontrado.")
                else:
                    for a in adms:
                        with st.container(border=True):
                            c1, c2, c3 = st.columns([3, 2, 2])
                            c1.markdown(
                                f"**{a['nome']}**<br><span style='font-size:0.8rem'>{a.get('email','Sem Email')}</span>",
                                unsafe_allow_html=True,
                            )
                            role_txt = a.get("role", "standard").upper()
                            c2.caption(f"Role: {role_txt}")
                            if a["usuario"] != st.session_state.user_data["usuario"]:
                                if c3.button("🗑️ Remover", key=f"da_{a['id']}"):
                                    supabase.table("admins").delete().eq(
                                        "id", a["id"]
                                    ).execute()
                                    st.rerun()

        with tab_transp:
            st.info("Gestão de parceiros.")

            with st.expander("Nova Transportadora", expanded=False):
                with st.form("nova_transp_form"):
                    t_nome = st.text_input("Razão Social")
                    t_email = st.text_input("Email")
                    t_user = st.text_input("Login")

                    if st.form_submit_button("CRIAR"):
                        if t_nome and t_user:
                            s_temp = gerar_senha_forte()
                            try:
                                supabase.table("transportadoras").insert(
                                    {
                                        "nome": t_nome,
                                        "usuario": t_user,
                                        "email": t_email,
                                        "senha": s_temp,
                                    }
                                ).execute()
                                enviar_credenciais(t_nome, t_email, t_user, s_temp)
                                st.success("Criado!")
                                sleep(1)
                                st.rerun()
                            except Exception as e:
                                st.error(f"Erro: {e}")

            st.markdown("#### Parceiros")

            try:
                trs = (
                    supabase.table("transportadoras")
                    .select("*")
                    .order("nome")
                    .execute()
                    .data
                )
            except:
                trs = []

            if not trs:
                st.info(
                    "Nenhuma transportadora cadastrada. Use o botão acima para adicionar."
                )
            else:
                for t in trs:
                    with st.container(border=True):
                        c1, c2 = st.columns([4, 1])
                        c1.write(f"**{t['nome']}** ({t.get('email','---')})")
                        if c2.button("🗑️", key=f"dt_{t['id']}"):
                            supabase.table("transportadoras").delete().eq(
                                "id", t["id"]
                            ).execute()
                            st.rerun()

    elif menu_admin == "Aprovação":
        if st.session_state.get("user_role") != "master":
            st.error("Acesso restrito a Master Admins.")
            st.stop()

        st.markdown("### Aprovação Final (Master)")
        bids_aprov = (
            supabase.table("bids")
            .select("*")
            .eq("status", "AGUARDANDO_APROVACAO")
            .execute()
            .data
        )

        if not bids_aprov:
            st.info("Nenhum BID aguardando aprovação.")

        for bid in bids_aprov:
            with st.container(border=True):
                st.markdown(f"### {bid['titulo']} ({bid['codigo_unico']})")
                st.caption(f"Selecionado por: {bid.get('log_selecao', '---')}")

                vence_id = bid.get("lance_vencedor_id")
                l_vence = None
                if vence_id:
                    l_vence = (
                        supabase.table("lances")
                        .select("*")
                        .eq("id", vence_id)
                        .execute()
                        .data[0]
                    )
                    st.info(
                        f"Vencedor Indicado: **{l_vence['transportadora_nome']}** - R$ {l_vence['valor']:,.2f} ({l_vence['prazo_dias']} dias)"
                    )

                st.divider()

                st.markdown("#### Panorama da Disputa")

                lances = (
                    supabase.table("lances")
                    .select("*")
                    .eq("bid_id", bid["id"])
                    .execute()
                    .data
                )

                if lances:
                    df = pd.DataFrame(lances)

                    min_p = df["valor"].min()
                    min_d = df["prazo_dias"].min()
                    df["score"] = (min_p / df["valor"]) * 70 + (
                        min_d / df["prazo_dias"]
                    ) * 30

                    df_display = df.copy()
                    df_display["valor_fmt"] = df_display["valor"].apply(
                        lambda x: f"R$ {x:,.2f}"
                    )
                    df_display["score_fmt"] = df_display["score"].apply(
                        lambda x: f"{x:.1f}"
                    )

                    c1, c2, c3 = st.columns(3)

                    with c1:
                        st.markdown("**Por Preço**")
                        st.dataframe(
                            df_display.sort_values("valor")[
                                ["transportadora_nome", "valor_fmt"]
                            ],
                            hide_index=True,
                            use_container_width=True,
                        )

                    with c2:
                        st.markdown("**Por Prazo**")
                        st.dataframe(
                            df_display.sort_values("prazo_dias")[
                                ["transportadora_nome", "prazo_dias"]
                            ],
                            hide_index=True,
                            use_container_width=True,
                        )

                    with c3:
                        st.markdown("**Por Score (Custo-Benefício)**")
                        st.dataframe(
                            df_display.sort_values("score", ascending=False)[
                                ["transportadora_nome", "score_fmt"]
                            ],
                            hide_index=True,
                            use_container_width=True,
                        )
                else:
                    st.warning("Não há lances registrados para gerar comparativos.")

                st.divider()

                col_btn_1, col_btn_2 = st.columns(2)

                if col_btn_1.button(
                    "APROVAR E FINALIZAR", key=f"ok_{bid['id']}", type="primary"
                ):
                    stamp = get_audit_stamp(st.session_state.user_data["nome"])

                    supabase.table("bids").update(
                        {"status": "FINALIZADO", "log_aprovacao": stamp}
                    ).eq("id", bid["id"]).execute()

                    bid["log_aprovacao"] = stamp

                    arquivos_audit = gerar_pdf_auditoria_completo(
                        bid, lances, l_vence, {}
                    )

                    dados_vencedor_email = None
                    if l_vence:
                        resp_tr = (
                            supabase.table("transportadoras")
                            .select("email, nome")
                            .eq("nome", l_vence["transportadora_nome"])
                            .execute()
                        )
                        if resp_tr.data:
                            dados_vencedor_email = resp_tr.data[0]

                    notificar_usuarios(
                        "APROVACAO_FINAL",
                        dados_bid=bid,
                        anexos=arquivos_audit,
                        vencedor_dados=dados_vencedor_email,
                    )

                    st.success(
                        "BID Aprovado! E-mails de notificação e auditoria disparados."
                    )
                    sleep(2)
                    st.rerun()

                if col_btn_2.button(
                    "REPROVAR (Voltar p/ Análise)", key=f"no_{bid['id']}"
                ):
                    supabase.table("bids").update(
                        {
                            "status": "EM_ANALISE",
                            "lance_vencedor_id": None,
                            "log_selecao": None,
                        }
                    ).eq("id", bid["id"]).execute()

                    notificar_usuarios("REPROVACAO", dados_bid=bid)

                    st.warning("BID devolvido. Admins notificados.")
                    sleep(2)
                    st.rerun()

# ÁREA PRESTADOR
else:
    if menu_provider == "Minha Conta":
        st.markdown("### Meus Dados de Acesso")
        st.info(
            "Mantenha seu e-mail atualizado para receber notificações e recuperar senha."
        )

        user_id = st.session_state.user_data["id"]

        try:
            meus_dados = (
                supabase.table("transportadoras")
                .select("*")
                .eq("id", user_id)
                .execute()
                .data[0]
            )

            with st.container(border=True):
                with st.form("update_dados_provider"):
                    novo_email = st.text_input(
                        "E-mail", value=meus_dados.get("email", "")
                    )
                    st.markdown("---")
                    st.markdown("**Alterar Senha (Opcional)**")
                    nova_senha = st.text_input(
                        "Nova Senha",
                        type="password",
                        placeholder="Deixe em branco para manter a atual",
                    )
                    c_senha = st.text_input("Confirme a Nova Senha", type="password")

                    if st.form_submit_button("SALVAR ALTERAÇÕES", type="primary"):
                        payload = {"email": novo_email}
                        msg_extra = ""

                        if nova_senha:
                            if nova_senha != c_senha:
                                st.error("As senhas não conferem!")
                                st.stop()

                            is_valid, msg = validar_senha_input(nova_senha)
                            if not is_valid:
                                st.error(f"Senha fraca: {msg}")
                                st.stop()

                            payload["senha"] = nova_senha
                            msg_extra = " e Senha"

                        supabase.table("transportadoras").update(payload).eq(
                            "id", user_id
                        ).execute()

                        st.session_state.user_data["email"] = novo_email
                        st.success(f"Dados{msg_extra} atualizados com sucesso!")
                        sleep(1)
                        st.rerun()
        except Exception as e:
            st.error(f"Erro ao carregar dados: {e}")

    elif menu_provider == "Histórico":
        st.markdown("### Meu Histórico de Participações")
        meu_nome = st.session_state.user_data["nome"]

        meus_lances = (
            supabase.table("lances")
            .select("bid_id")
            .eq("transportadora_nome", meu_nome)
            .execute()
            .data
        )
        ids_participados = list(set([l["bid_id"] for l in meus_lances]))

        if not ids_participados:
            st.info("Você ainda não participou de BIDs finalizados.")
        else:
            bids_meus = (
                supabase.table("bids")
                .select("*")
                .in_("id", ids_participados)
                .eq("status", "FINALIZADO")
                .order("created_at", desc=True)
                .execute()
                .data
            )

            if not bids_meus:
                st.info("Seus lances ainda estão em BIDs abertos ou em análise.")

            for bid in bids_meus:
                with st.container(border=True):
                    resultado = "PERDEU"
                    cor_status = "red"
                    win_lance = None

                    if bid.get("lance_vencedor_id"):
                        raw_win = (
                            supabase.table("lances")
                            .select("*")
                            .eq("id", bid["lance_vencedor_id"])
                            .execute()
                            .data
                        )
                        if raw_win:
                            win_lance = raw_win[0]
                            if win_lance["transportadora_nome"] == meu_nome:
                                resultado = "GANHOU"
                                cor_status = "green"

                    col_st, col_tit = st.columns([1, 4])
                    col_st.markdown(
                        f"<span style='color:{cor_status}; font-weight:bold; font-size:1.2rem'>{resultado}</span>",
                        unsafe_allow_html=True,
                    )
                    col_tit.markdown(
                        f"**{bid['titulo']}** ({bid.get('codigo_unico', '')})"
                    )

                    st.divider()

                    meu_melhor = (
                        supabase.table("lances")
                        .select("*")
                        .eq("bid_id", bid["id"])
                        .eq("transportadora_nome", meu_nome)
                        .order("valor", desc=False)
                        .limit(1)
                        .execute()
                        .data[0]
                    )

                    c1, c2 = st.columns(2)
                    c1.metric(
                        "Sua Oferta",
                        f"R$ {meu_melhor['valor']:,.2f}",
                        f"{meu_melhor['prazo_dias']} dias",
                    )

                    if resultado == "GANHOU":
                        c2.success(
                            "Parabéns! Sua oferta foi a escolhida pela melhor combinação de Preço e Prazo."
                        )
                    elif win_lance:
                        delta_val = win_lance["valor"] - meu_melhor["valor"]
                        c2.metric(
                            "Oferta Vencedora (Anônimo)",
                            f"R$ {win_lance['valor']:,.2f}",
                            f"{win_lance['prazo_dias']} dias",
                            delta_color="inverse",
                        )

                        motivo = []
                        if win_lance["valor"] < meu_melhor["valor"]:
                            motivo.append("Preço menor")
                        if win_lance["prazo_dias"] < meu_melhor["prazo_dias"]:
                            motivo.append("Prazo menor")
                        if not motivo:
                            motivo.append("Melhor Score Geral (Combinação)")

                        st.caption(f"Motivo da perda: {', '.join(motivo)}.")
                    else:
                        c2.info("Este BID foi cancelado ou finalizado sem vencedor.")

    elif menu_provider == "Painel de BIDs":
        col_refresh, _ = st.columns([1, 4])
        if col_refresh.button("🔄 Atualizar Lista de BIDs", type="secondary"):
            st.rerun()

        bids = supabase.table("bids").select("*").eq("status", "ABERTO").execute().data

        if not bids:
            st.info("Sem BIDs disponíveis no momento.")

        for bid in bids:
            with st.container(border=True):
                col_img, col_info, col_lance = st.columns([2, 3, 2])

                with col_img:
                    if bid.get("imagem_url"):
                        st.image(bid["imagem_url"], use_container_width=True)
                    else:
                        st.markdown(
                            "<div style='background:#eee;height:150px;display:flex;align-items:center;justify-content:center;color:#999'>Sem Foto</div>",
                            unsafe_allow_html=True,
                        )

                with col_info:
                    cod = bid.get("codigo_unico", "---")
                    cat = bid.get("categoria_veiculo", "Geral").upper()
                    qtd = bid.get("quantidade_veiculos", 1)

                    st.markdown(
                        f"""
                    <div style="display:flex; gap:8px; margin-bottom:8px; align-items:center;">
                        <span style="background:#E5E7EB; color:#374151; padding:2px 8px; border-radius:4px; font-size:0.75rem; font-weight:bold;">{cod}</span>
                        <span style="background:#DBEAFE; color:#1E40AF; padding:2px 8px; border-radius:4px; font-size:0.75rem; font-weight:bold;">{cat}</span>
                        <span style="background:#FEF3C7; color:#92400E; padding:2px 8px; border-radius:4px; font-size:0.75rem; font-weight:bold;">{qtd} VEÍCULO(S)</span>
                    </div>
                    """,
                        unsafe_allow_html=True,
                    )

                    st.markdown(f"## {bid['titulo']}")

                    tipo_transp = bid.get("tipo_transporte", "Padrão")
                    st.markdown(
                        f"**Operação:** <span style='color:#FF3B3B; font-weight:bold'>{tipo_transp}</span>",
                        unsafe_allow_html=True,
                    )

                    encerramento_br = formatar_data_br(bid.get("prazo_limite"))
                    st.caption(f"Encerra em: {encerramento_br}")

                    origem_txt = bid["origem"] if bid["origem"] else "---"
                    destino_txt = bid["destino"] if bid["destino"] else "---"
                    r_c = (
                        bid.get("endereco_retirada", "")[:60] + "..."
                        if bid.get("endereco_retirada")
                        else ""
                    )
                    e_c = (
                        bid.get("endereco_entrega", "")[:60] + "..."
                        if bid.get("endereco_entrega")
                        else ""
                    )

                    st.markdown(
                        f"""
                    <div class="address-box">
                        <div class="address-title">ORIGEM</div>
                        <div class="address-text">{origem_txt}</div>
                        <div style="font-size:0.75rem; color:#6B7280; margin-top:2px;">{r_c}</div>
                    </div>
                    
                    <div class="address-box" style="border-left-color: #6B7280;"> 
                        <div class="address-title" style="color: #6B7280;">DESTINO</div>
                        <div class="address-text">{destino_txt}</div>
                        <div style="font-size:0.75rem; color:#6B7280; margin-top:2px;">{e_c}</div>
                    </div>
                    """,
                        unsafe_allow_html=True,
                    )

                    lances = (
                        supabase.table("lances")
                        .select("valor, prazo_dias")
                        .eq("bid_id", bid["id"])
                        .order("valor", desc=False)
                        .execute()
                        .data
                    )

                    melhor_valor = None
                    melhor_prazo = None

                    if lances:
                        melhor_valor = lances[0]["valor"]
                        melhor_prazo = lances[0]["prazo_dias"]
                        c1, c2 = st.columns(2)
                        c1.metric("Melhor Preço", f"R$ {melhor_valor:,.2f}")
                        c2.metric("Prazo a Bater", f"{melhor_prazo} dias")
                    else:
                        st.info("Seja o primeiro a ofertar!")

            with col_lance:
                st.markdown("#### Enviar Proposta")

                key_confirm = f"confirm_lance_{bid['id']}"
                if key_confirm not in st.session_state:
                    st.session_state[key_confirm] = False

                if not st.session_state[key_confirm]:
                    val = st.number_input(
                        f"Valor (R$)", min_value=0.0, step=50.0, key=f"v_{bid['id']}"
                    )
                    prazo = st.number_input(
                        f"Prazo (Dias)", min_value=1, step=1, key=f"p_{bid['id']}"
                    )

                    if bid.get("data_entrega_limite"):
                        try:
                            dl_fmt = datetime.strptime(
                                bid["data_entrega_limite"], "%Y-%m-%d"
                            ).strftime("%d/%m/%Y")
                            st.caption(f"Data Limite Cliente: {dl_fmt}")
                        except:
                            pass

                    if st.button(
                        "ENVIAR LANCE", key=f"btn_pre_{bid['id']}", type="primary"
                    ):
                        erro_validacao = ""
                        if melhor_valor is not None:
                            if val > melhor_valor and prazo >= melhor_prazo:
                                erro_validacao = f"Seu valor é maior. O prazo deve ser menor que {melhor_prazo} dias."
                            elif val == melhor_valor and prazo >= melhor_prazo:
                                erro_validacao = "Preço empatado. Melhore o prazo."

                        if val <= 0:
                            erro_validacao = "O valor deve ser maior que zero."

                        if erro_validacao:
                            st.error(f"⚠️ {erro_validacao}")
                        else:
                            st.session_state[key_confirm] = True
                            st.session_state[f"temp_val_{bid['id']}"] = val
                            st.session_state[f"temp_prazo_{bid['id']}"] = prazo
                            st.rerun()

                else:
                    val_temp = st.session_state.get(f"temp_val_{bid['id']}")
                    prazo_temp = st.session_state.get(f"temp_prazo_{bid['id']}")

                    st.warning("⚠️ **Confirma a oferta?**")
                    st.markdown(f"Valor: **R$ {val_temp:,.2f}**")
                    st.markdown(f"Prazo: **{prazo_temp} dias**")

                    c_sim, c_nao = st.columns(2)

                    if c_sim.button("SIM", key=f"btn_yes_{bid['id']}", type="primary"):
                        supabase.table("lances").insert(
                            {
                                "bid_id": bid["id"],
                                "transportadora_nome": st.session_state.user_data[
                                    "nome"
                                ],
                                "valor": val_temp,
                                "prazo_dias": prazo_temp,
                            }
                        ).execute()

                        st.success("Lance Aceito!")
                        st.session_state[key_confirm] = False
                        sleep(1.5)
                        st.rerun()

                    if c_nao.button("NÃO", key=f"btn_no_{bid['id']}"):
                        st.session_state[key_confirm] = False
                        st.rerun()

        with st.expander("ℹ️ Regras do Leilão e Critérios de Aprovação"):
            st.markdown(
                """
            **Como funciona o Ranking?**
            1. **Critério Principal:** O sistema prioriza sempre o **Menor Preço**.
            2. **Critério de Desempate:** Em caso de preços similares, vence quem oferecer o **Menor Prazo**.
            
            **Avaliação Final (Score):**
            Ao final do tempo, o administrador analisa um Score que combina 70% Preço e 30% Prazo para decidir o vencedor final.
            """
            )
