from fpdf import FPDF
import os
import requests
import pandas as pd
import csv
import json
from datetime import datetime

DIRETORIO_LOGS = "Compliance_Audit_Logs"
if not os.path.exists(DIRETORIO_LOGS):
    os.makedirs(DIRETORIO_LOGS)


class PDF(FPDF):
    def header(self):
        self.set_fill_color(220, 53, 69)
        self.rect(0, 0, 210, 5, "F")

        self.set_y(10)
        self.set_font("Arial", "B", 14)
        self.cell(0, 10, "OFFICIAL AUDIT REPORT & COMPLIANCE", 0, 1, "C")
        self.set_font("Arial", "I", 8)
        self.set_text_color(100, 100, 100)
        self.cell(
            0,
            5,
            "System Generated Document - Bidding Platform",
            0,
            1,
            "C",
        )
        self.ln(10)
        self.set_text_color(0, 0, 0)

    def footer(self):
        self.set_y(-15)
        self.set_font("Arial", "I", 8)
        self.set_text_color(128, 128, 128)
        self.cell(
            0, 10, f"Page {self.page_no()} | Audit ID: {self.audit_id}", 0, 0, "C"
        )

    def chapter_title(self, title):
        self.set_font("Arial", "B", 12)
        self.set_fill_color(240, 240, 240)
        self.set_text_color(0, 0, 0)
        self.cell(0, 8, f"  {title}", 0, 1, "L", fill=True)
        self.ln(4)

    def zebra_table(self, header, data, col_widths):
        self.set_font("Arial", "B", 9)
        self.set_fill_color(52, 58, 64)
        self.set_text_color(255, 255, 255)
        for i, h in enumerate(header):
            self.cell(col_widths[i], 7, h, 1, 0, "C", fill=True)
        self.ln()

        self.set_font("Arial", "", 9)
        self.set_text_color(0, 0, 0)
        fill = False
        for row in data:
            self.set_fill_color(245, 245, 245)
            for i, d in enumerate(row):
                align = "L" if i == 0 else "C"
                self.cell(col_widths[i], 7, str(d), 1, 0, align, fill=fill)
            self.ln()
            fill = not fill
        self.ln(5)


def baixar_imagem(url):
    try:
        if not url:
            return None
        ext = url.split(".")[-1].split("?")[0]
        if len(ext) > 4:
            ext = "jpg"
        caminho_img = f"temp_audit_img.{ext}"
        response = requests.get(url)
        if response.status_code == 200:
            with open(caminho_img, "wb") as f:
                f.write(response.content)
            return caminho_img
    except:
        return None
    return None


def gerar_logs_csv_json(bid, lances, filename_base):
    # CSV
    csv_path = os.path.join(DIRETORIO_LOGS, f"{filename_base}.csv")
    with open(csv_path, mode="w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f, delimiter=";")
        writer.writerow(
            ["DATA_HORA", "TRANSPORTADORA", "VALOR_LANCE", "PRAZO_DIAS", "STATUS"]
        )
        for l in lances:
            writer.writerow(
                [
                    l.get("created_at"),
                    l.get("transportadora_nome"),
                    str(l.get("valor")).replace(".", ","),
                    l.get("prazo_dias"),
                    "VALIDO",
                ]
            )

    # JSON
    json_path = os.path.join(DIRETORIO_LOGS, f"{filename_base}.json")
    dados_export = {
        "bid_header": bid,
        "bid_history": lances,
        "exported_at": datetime.now().isoformat(),
    }
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(dados_export, f, indent=4, default=str)


def gerar_pdf_auditoria_completo(bid, lances, vencedor_escolhido, rankings_brutos):
    audit_id = f"{bid.get('codigo_unico', 'UNK')}-{datetime.now().strftime('%H%M%S')}"
    placa_clean = bid.get("placa", "NOPLATE").replace(" ", "")
    data_clean = datetime.now().strftime("%Y%m%d")
    filename_base = f"AUDIT_{bid.get('codigo_unico', 'BID')}_{placa_clean}_{data_clean}"

    lista_arquivos = gerar_logs_csv_json(bid, lances, filename_base)

    df_unique = pd.DataFrame()
    if lances:
        df = pd.DataFrame(lances)
        df = df.sort_values(
            by=["transportadora_nome", "valor", "prazo_dias"],
            ascending=[True, True, True],
        )
        df_unique = df.drop_duplicates(subset="transportadora_nome", keep="first")

        min_p = df_unique["valor"].min()
        min_d = df_unique["prazo_dias"].min()

        def calc_score(row):
            s_price = (min_p / row["valor"]) * 70
            s_deadline = (min_d / row["prazo_dias"]) * 30
            return round(s_price + s_deadline, 2)

        df_unique["score"] = df_unique.apply(calc_score, axis=1)

    pdf = PDF()
    pdf.audit_id = audit_id
    pdf.add_page()
    pdf.chapter_title("1. ASSET & OPERATION DETAILS")

    caminho_img = baixar_imagem(bid.get("imagem_url"))
    if caminho_img:
        pdf.image(caminho_img, x=150, y=35, w=50)

    pdf.set_font("Arial", "", 10)
    pdf.cell(40, 6, "Audit Reference:", 0, 0, "B")
    pdf.cell(0, 6, bid.get("codigo_unico", "N/A"), 0, 1)
    pdf.cell(40, 6, "Vehicle Model:", 0, 0, "B")
    pdf.cell(0, 6, bid["titulo"], 0, 1)
    pdf.cell(40, 6, "License Plate:", 0, 0, "B")
    pdf.cell(0, 6, bid.get("placa", "---"), 0, 1)
    pdf.cell(40, 6, "Category:", 0, 0, "B")
    pdf.cell(0, 6, bid.get("categoria_veiculo", "---").upper(), 0, 1)
    pdf.cell(40, 6, "Quantity:", 0, 0, "B")
    pdf.cell(0, 6, str(bid.get("quantidade_veiculos", 1)), 0, 1)
    pdf.ln(5)

    pdf.set_font("Arial", "B", 10)
    pdf.cell(0, 6, "LOGISTICS ROUTE:", 0, 1)
    pdf.set_font("Arial", "", 9)
    pdf.multi_cell(130, 5, f"FROM: {bid['origem']}\nTO:      {bid['destino']}")
    pdf.ln(8)

    if caminho_img and os.path.exists(caminho_img):
        os.remove(caminho_img)

    pdf.chapter_title("2. WINNER SCORECARD & PERFORMANCE")

    if vencedor_escolhido and not df_unique.empty:
        v_nome = vencedor_escolhido["transportadora_nome"]
        v_valor = vencedor_escolhido["valor"]
        v_prazo = vencedor_escolhido["prazo_dias"]

        try:
            score_row = df_unique[df_unique["transportadora_nome"] == v_nome].iloc[0]
            final_score = score_row["score"]
        except:
            final_score = 0.0

        pdf.set_font("Arial", "B", 14)
        pdf.cell(0, 10, f"WINNER: {v_nome}", 0, 1, "L")
        pdf.ln(2)

        col_w = 63
        h_box = 20

        y_start = pdf.get_y()
        pdf.set_fill_color(248, 249, 250)
        pdf.set_font("Arial", "B", 9)
        pdf.cell(col_w, 8, "FINAL PRICE", 1, 0, "C", fill=True)
        pdf.cell(5, 8, "", 0, 0)
        pdf.cell(col_w, 8, "SLA / DEADLINE", 1, 0, "C", fill=True)
        pdf.cell(5, 8, "", 0, 0)
        pdf.cell(col_w, 8, "EFFICIENCY SCORE", 1, 1, "C", fill=True)

        pdf.set_font("Arial", "B", 14)
        pdf.set_text_color(220, 53, 69)
        pdf.cell(col_w, 15, f"R$ {v_valor:,.2f}", 1, 0, "C")
        pdf.set_text_color(40, 167, 69)
        pdf.cell(5, 15, "", 0, 0)
        pdf.cell(col_w, 15, f"{v_prazo} Days", 1, 0, "C")
        pdf.set_text_color(0, 123, 255)
        pdf.cell(5, 15, "", 0, 0)
        pdf.cell(col_w, 15, f"{final_score} / 100", 1, 1, "C")

        pdf.set_text_color(0)
        pdf.ln(10)

    pdf.ln(5)
    pdf.chapter_title("2.1. APPROVAL WORKFLOW TIMELINE")

    timeline_data = [
        ["STEP", "RESPONSIBLE & TIMESTAMP"],
        ["1. Creation", bid.get("log_criacao", "---")],
        ["2. Auction End", bid.get("log_encerramento", "Auto/Manual")],
        ["3. Winner Selection", bid.get("log_selecao", "---")],
        ["4. Final Approval (Master)", bid.get("log_aprovacao", "---")],
    ]

    pdf.set_font("Arial", "", 9)
    col_w = [60, 130]

    for row in timeline_data:
        is_header = row[0] == "STEP"
        pdf.set_font("Arial", "B" if is_header else "", 9)
        (
            pdf.set_fill_color(230, 230, 230)
            if is_header
            else pdf.set_fill_color(255, 255, 255)
        )

        pdf.cell(col_w[0], 7, row[0], 1, 0, "L", fill=is_header)
        pdf.cell(col_w[1], 7, row[1], 1, 1, "L", fill=is_header)

    pdf.ln(10)

    if not df_unique.empty:
        pdf.chapter_title("3.1. BEST PRICE RANKING (Lowest to Highest)")
        df_price = df_unique.sort_values(by="valor", ascending=True)
        data_price = []
        for _, row in df_price.iterrows():
            data_price.append(
                [
                    row["transportadora_nome"],
                    f"R$ {row['valor']:,.2f}",
                    f"{row['prazo_dias']} days",
                ]
            )

        pdf.zebra_table(
            ["Provider", "Best Offer", "Deadline"], data_price, [90, 50, 50]
        )

        pdf.chapter_title("3.2. BEST DEADLINE RANKING (Fastest to Slowest)")
        df_deadline = df_unique.sort_values(by="prazo_dias", ascending=True)
        data_deadline = []
        for _, row in df_deadline.iterrows():
            data_deadline.append(
                [
                    row["transportadora_nome"],
                    f"{row['prazo_dias']} days",
                    f"R$ {row['valor']:,.2f}",
                ]
            )

        pdf.zebra_table(
            ["Provider", "Deadline", "Price Info"], data_deadline, [90, 50, 50]
        )

    pdf.add_page()
    pdf.chapter_title("4. FULL AUDIT TRAIL (ALL BIDS HISTORY)")

    header_hist = ["Timestamp", "Provider", "Bid Value", "Deadline"]
    hist_data = []
    for l in sorted(lances, key=lambda x: x["created_at"]):
        try:
            dt = datetime.fromisoformat(l["created_at"].replace("Z", ""))
            fmt_date = dt.strftime("%d/%m/%Y %H:%M:%S")
        except:
            fmt_date = l["created_at"]

        hist_data.append(
            [
                fmt_date,
                l["transportadora_nome"],
                f"R$ {l['valor']:,.2f}",
                str(l["prazo_dias"]),
            ]
        )

    pdf.zebra_table(header_hist, hist_data, [45, 75, 40, 30])

    path_pdf = os.path.join(DIRETORIO_LOGS, f"{filename_base}.pdf")
    pdf.output(path_pdf)

    lista_arquivos.append(path_pdf)

    return lista_arquivos
