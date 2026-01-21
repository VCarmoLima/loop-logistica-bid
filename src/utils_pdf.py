from fpdf import FPDF
import os
import requests
from datetime import datetime

DIRETORIO_LOCAL = "Auditoria_BIDs"
if not os.path.exists(DIRETORIO_LOCAL):
    os.makedirs(DIRETORIO_LOCAL)


class PDF(FPDF):
    def header(self):
        self.set_font("Arial", "B", 14)
        self.cell(0, 10, "RELATÓRIO DE AUDITORIA E HOMOLOGAÇÃO - LOOP BIDs", 0, 1, "C")
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font("Arial", "I", 8)
        self.cell(
            0,
            10,
            f"Página {self.page_no()} - Documento Gerado Automaticamente",
            0,
            0,
            "C",
        )


def baixar_imagem(url):
    try:
        if not url:
            return None
        # Nome temporário seguro
        ext = url.split(".")[-1].split("?")[0]
        if len(ext) > 4:
            ext = "jpg"
        caminho_img = f"temp_img.{ext}"

        response = requests.get(url)
        if response.status_code == 200:
            with open(caminho_img, "wb") as f:
                f.write(response.content)
            return caminho_img
    except:
        return None
    return None


def gerar_pdf_auditoria_completo(bid, lances, vencedor_escolhido, rankings):
    pdf = PDF()
    pdf.add_page()

    # --- 1. CAPA E DADOS DO LOTE ---
    pdf.set_fill_color(230, 230, 230)
    pdf.set_font("Arial", "B", 12)
    pdf.cell(0, 8, "1. DADOS DO VEÍCULO E ROTA", 1, 1, "L", fill=True)
    pdf.ln(2)

    # Imagem do Veículo
    caminho_img = baixar_imagem(bid.get("imagem_url"))
    if caminho_img:
        # Posiciona imagem à direita
        pdf.image(caminho_img, x=140, y=35, w=60)

    pdf.set_font("Arial", "B", 10)
    codigo = bid.get("codigo_unico", "N/A")
    pdf.cell(0, 8, f"ID do BID: {codigo}", 0, 1, "L")
    pdf.ln(2)

    pdf.set_font("Arial", "B", 10)
    pdf.cell(25, 6, "Modelo:", 0, 0)
    pdf.set_font("Arial", "", 10)
    pdf.cell(0, 6, f"{bid['titulo']}", 0, 1)

    # Nova linha para Placa e Categoria
    pdf.set_font("Arial", "B", 10)
    pdf.cell(25, 6, "Placa:", 0, 0)
    pdf.set_font("Arial", "", 10)
    pdf.cell(40, 6, f"{bid.get('placa', '---')}", 0, 0)  # Placa

    pdf.set_font("Arial", "B", 10)
    pdf.cell(25, 6, "Categoria:", 0, 0)
    pdf.set_font("Arial", "", 10)
    pdf.cell(0, 6, f"{bid.get('categoria_veiculo', '---')}", 0, 1)  # Categoria

    pdf.set_font("Arial", "B", 10)
    pdf.cell(25, 6, "Quantidade:", 0, 0)
    pdf.set_font("Arial", "", 10)
    pdf.cell(0, 6, f"{bid.get('quantidade_veiculos', 1)} unidade(s)", 0, 1)

    pdf.ln(4)

    pdf.set_font("Arial", "", 9)
    pdf.cell(120, 6, f"Origem: {bid['origem']}", 0, 1)
    pdf.multi_cell(120, 5, f"Endereço: {bid['endereco_retirada']}")
    pdf.ln(2)

    pdf.cell(120, 6, f"Destino: {bid['destino']}", 0, 1)
    pdf.multi_cell(120, 5, f"Endereço: {bid['endereco_entrega']}")
    pdf.ln(5)

    # Remove imagem temporária
    if caminho_img and os.path.exists(caminho_img):
        os.remove(caminho_img)

    # --- 2. VENCEDOR HOMOLOGADO (ESCOLHA DO ADMIN) ---
    pdf.ln(10)
    pdf.set_font("Arial", "B", 12)
    pdf.set_fill_color(220, 255, 220)  # Verde Claro
    pdf.cell(0, 8, "2. HOMOLOGAÇÃO (VENCEDOR SELECIONADO)", 1, 1, "L", fill=True)

    if vencedor_escolhido:
        pdf.set_font("Arial", "B", 10)
        pdf.ln(2)
        pdf.cell(
            0, 6, f"Transportadora: {vencedor_escolhido['transportadora_nome']}", 0, 1
        )
        pdf.set_font("Arial", "", 10)
        pdf.cell(0, 6, f"Valor Fechado: R$ {vencedor_escolhido['valor']:,.2f}", 0, 1)
        pdf.cell(
            0, 6, f"Prazo de Entrega: {vencedor_escolhido['prazo_dias']} dias", 0, 1
        )
        pdf.cell(
            0, 6, f"Homologado em: {datetime.now().strftime('%d/%m/%Y %H:%M')}", 0, 1
        )
    else:
        pdf.cell(
            0, 6, "Nenhum vencedor selecionado (Leilão Deserto ou Cancelado).", 0, 1
        )

    pdf.ln(5)

    # --- 3. ANÁLISE COMPARATIVA (RANKINGS) ---
    pdf.set_font("Arial", "B", 12)
    pdf.set_fill_color(230, 230, 230)
    pdf.cell(0, 8, "3. ANÁLISE COMPETITIVA (Rankings)", 1, 1, "L", fill=True)
    pdf.ln(3)

    col_w = 63

    # Cabeçalhos
    y_start = pdf.get_y()
    pdf.set_font("Arial", "B", 9)
    pdf.cell(col_w, 6, "Melhor PREÇO", 1, 0, "C")
    pdf.cell(col_w, 6, "Melhor PRAZO", 1, 0, "C")
    pdf.cell(col_w, 6, "Melhor CUSTO-BENEFÍCIO", 1, 1, "C")

    # Conteúdo dos Rankings
    # Rankings vem como lista de dicts: [{'nome':..., 'val':...}, ...]

    max_rows = max(
        len(rankings["preco"]), len(rankings["prazo"]), len(rankings["score"])
    )
    pdf.set_font("Arial", "", 8)

    for i in range(max_rows):
        # Coluna Preço
        if i < len(rankings["preco"]):
            d = rankings["preco"][i]
            txt = f"{i+1}. {d['transportadora_nome']}\nR$ {d['valor']:.2f}"
        else:
            txt = ""
        x_atual = pdf.get_x()
        y_atual = pdf.get_y()
        pdf.multi_cell(col_w, 5, txt, 1, "C")
        pdf.set_xy(x_atual + col_w, y_atual)

        # Coluna Prazo
        if i < len(rankings["prazo"]):
            d = rankings["prazo"][i]
            txt = f"{i+1}. {d['transportadora_nome']}\n{d['prazo_dias']} dias"
        else:
            txt = ""
        x_atual = pdf.get_x()
        y_atual = pdf.get_y()
        pdf.multi_cell(col_w, 5, txt, 1, "C")
        pdf.set_xy(x_atual + col_w, y_atual)

        # Coluna Score
        if i < len(rankings["score"]):
            d = rankings["score"][i]
            txt = f"{i+1}. {d['transportadora_nome']}\nNota: {d['score']:.1f}"
        else:
            txt = ""
        x_atual = pdf.get_x()
        y_atual = pdf.get_y()
        pdf.multi_cell(col_w, 5, txt, 1, "C")
        pdf.set_xy(
            x_atual + col_w, y_atual
        )  # Volta pro início da próxima linha? Não, vai pro fim.

        pdf.ln(10)  # Avança linha (ajuste manual de altura pois multicell é chato)

    # --- 4. HISTÓRICO COMPLETO ---
    pdf.add_page()
    pdf.set_font("Arial", "B", 12)
    pdf.cell(0, 8, "4. HISTÓRICO COMPLETO DE LANCES", 1, 1, "L", fill=True)
    pdf.ln(2)

    pdf.set_font("Arial", "B", 8)
    pdf.cell(60, 6, "Transportadora", 1)
    pdf.cell(30, 6, "Valor", 1)
    pdf.cell(20, 6, "Prazo", 1)
    pdf.cell(50, 6, "Data/Hora", 1)
    pdf.ln()

    pdf.set_font("Arial", "", 8)
    for l in lances:
        pdf.cell(60, 6, l["transportadora_nome"], 1)
        pdf.cell(30, 6, f"R$ {l['valor']:.2f}", 1)
        pdf.cell(20, 6, f"{l['prazo_dias']} dias", 1)
        pdf.cell(50, 6, str(l["created_at"])[:16].replace("T", " "), 1)
        pdf.ln()

    nome_arquivo = f"Auditoria_{bid['titulo'].replace(' ', '_')}_{bid['id'][:6]}.pdf"
    path = os.path.join(DIRETORIO_LOCAL, nome_arquivo)
    pdf.output(path)
    return path
