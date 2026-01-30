import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency, formatDate } from '@/lib/utils'

const getDataUrl = (url: string): Promise<string | null> => {
    return new Promise((resolve) => {
        if (!url) { resolve(null); return; }
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = url;
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/jpeg"));
        };
        img.onerror = () => resolve(null);
    });
};

export const downloadCSV = (bid: any, lances: any[]) => {
    const headers = ['Data/Hora', 'Transportadora', 'Valor (R$)', 'Prazo (Dias)'];
    const rows = lances.map(l => [
        new Date(l.created_at).toLocaleString(),
        l.transportadora_nome,
        l.valor,
        l.prazo_dias
    ]);

    const csvContent = [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `AUDIT_${bid.codigo_unico}.csv`;
    link.click();
}

export const downloadPDF = async (bid: any, lances: any[], vencedor: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(127, 29, 29);
    doc.rect(0, 0, pageWidth, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("RELATÓRIO DE AUDITORIA & COMPLIANCE", 14, 16);

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, pageWidth - 14, 16, { align: 'right' });

    let y = 35;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DADOS DO PROCESSO", 14, y);
    y += 6;

    doc.setDrawColor(200);
    doc.line(14, y, pageWidth - 14, y);
    y += 8;

    const infoData = [
        ["ID Processo:", bid.codigo_unico],
        ["Veículo:", `${bid.titulo} (${bid.placa || 'S/ Placa'})`],
        ["Categoria:", bid.categoria_veiculo],
        ["Tipo Operação:", bid.tipo_transporte],
        ["Origem:", bid.origem],
        ["Destino:", bid.destino],
        ["Status Final:", bid.status],
    ];

    doc.setFontSize(10);
    infoData.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold");
        doc.text(String(label), 14, y);
        doc.setFont("helvetica", "normal");
        doc.text(String(value), 50, y);
        y += 6;
    });

    if (bid.imagem_url) {
        try {
            const imgData = await getDataUrl(bid.imagem_url);
            if (imgData) {
                const imgW = 70;
                const imgH = 50;
                const imgX = pageWidth - 14 - imgW;
                const imgY = 42;

                doc.setDrawColor(220);
                doc.rect(imgX, imgY, imgW, imgH);
                doc.addImage(imgData, 'JPEG', imgX + 1, imgY + 1, imgW - 2, imgH - 2);

                doc.setFontSize(8);
                doc.setTextColor(100);
                doc.text("Registro Fotográfico do Lote", imgX + (imgW / 2), imgY + imgH + 4, { align: 'center' });
            }
        } catch (e) {
            console.error("Erro ao carregar imagem para PDF", e);
        }
    }

    y = Math.max(y, 105);

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("TIMELINE DE RASTREABILIDADE", 14, y);
    y += 6;
    doc.setDrawColor(200);
    doc.line(14, y, pageWidth - 14, y);
    y += 10;

    const events = [
        { label: "Criação do BID", val: bid.log_criacao },
        { label: "Encerramento do Leilão", val: bid.log_encerramento || 'Automático' },
        { label: "Seleção do Vencedor", val: bid.log_selecao || 'Não selecionado' },
        { label: "Aprovação Final (Master)", val: bid.log_aprovacao || 'Pendente' }
    ];

    events.forEach((evt) => {
        doc.setDrawColor(150);
        doc.setFillColor(240, 240, 240);
        doc.circle(16, y - 1, 1.5, 'F');
        doc.setDrawColor(200);
        doc.line(16, y, 16, y + 8);

        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(evt.label, 22, y);

        doc.setFont("helvetica", "normal");
        doc.text(evt.val || '-', 80, y);
        y += 8;
    });

    y += 10;

    if (vencedor) {
        doc.setFillColor(240, 253, 244);
        doc.rect(14, y, pageWidth - 28, 28, 'F');
        doc.setDrawColor(22, 163, 74);
        doc.rect(14, y, pageWidth - 28, 28, 'S');

        doc.setTextColor(21, 128, 61);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("VENCEDOR HOMOLOGADO", 20, y + 8);

        doc.setTextColor(0);
        doc.setFontSize(10);
        doc.text(`Transportadora: ${vencedor.transportadora_nome}`, 20, y + 18);
        doc.text(`Valor Final: ${formatCurrency(vencedor.valor)}`, 100, y + 18);
        doc.text(`Prazo: ${vencedor.prazo_dias} dias`, 150, y + 18);

        y += 35;

        if (bid.justificativa_selecao) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.text("Justificativa Técnica da Escolha:", 14, y);
            y += 5;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            const splitJustif = doc.splitTextToSize(bid.justificativa_selecao, pageWidth - 28);
            doc.text(splitJustif, 14, y);
            y += (splitJustif.length * 5) + 10;
        }
    } else {
        doc.setFillColor(254, 242, 242);
        doc.rect(14, y, pageWidth - 28, 15, 'F');
        doc.setTextColor(153, 27, 27);
        doc.setFont("helvetica", "bold");
        doc.text("LEILÃO ENCERRADO COMO DESERTO (SEM VENCEDOR)", 20, y + 10);
        y += 25;
    }

    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("LIVRO DE OFERTAS (REGISTRO COMPLETO)", 14, y);
    y += 4;

    const tableRows = lances
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map(l => [
            new Date(l.created_at).toLocaleString(),
            l.transportadora_nome,
            formatCurrency(l.valor),
            l.prazo_dias + ' dias'
        ]);

    autoTable(doc, {
        startY: y,
        head: [['Carimbo de Data/Hora', 'Transportadora', 'Valor Ofertado', 'Prazo']],
        body: tableRows,
        theme: 'grid',
        headStyles: {
            fillColor: [64, 64, 64],
            textColor: 255,
            fontStyle: 'bold'
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245]
        },
        styles: {
            fontSize: 9,
            cellPadding: 3
        },
        columnStyles: {
            2: { fontStyle: 'bold', halign: 'right' },
            3: { halign: 'center' }
        }
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Audit ID: ${bid.codigo_unico} - Página ${i} de ${pageCount}`, 14, 290);
        doc.text("Sistema BID Logístico - Documento Oficial de Auditoria", pageWidth - 14, 290, { align: 'right' });
    }

    doc.save(`AUDIT_${bid.codigo_unico}.pdf`);
}