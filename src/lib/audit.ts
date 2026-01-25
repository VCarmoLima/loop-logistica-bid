import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency, formatDate } from '@/lib/utils'

// Função para baixar CSV
export const downloadCSV = (bid: any, lances: any[]) => {
    const headers = ['Data/Hora', 'Transportadora', 'Valor (R$)', 'Prazo (Dias)'];
    const rows = lances.map(l => [
        new Date(l.created_at).toLocaleString(),
        l.transportadora_nome,
        l.valor,
        l.prazo_dias
    ]);

    const csvContent = [
        headers.join(';'),
        ...rows.map(e => e.join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `AUDIT_${bid.codigo_unico}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Função para baixar PDF (Auditoria Completa)
export const downloadPDF = (bid: any, lances: any[], vencedor: any) => {
    const doc = new jsPDF();

    // Cabeçalho
    doc.setFillColor(153, 27, 27); // Vermelho Vinho
    doc.rect(0, 0, 210, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("RELATÓRIO DE AUDITORIA & COMPLIANCE", 105, 12, { align: "center" });
    
    // Info do BID
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`ID PROCESSO: ${bid.codigo_unico}`, 14, 30);
    doc.text(`VEÍCULO: ${bid.titulo} (${bid.placa || 'S/ Placa'})`, 14, 36);
    doc.text(`ORIGEM: ${bid.origem}`, 14, 42);
    doc.text(`DESTINO: ${bid.destino}`, 14, 48);
    doc.text(`ENCERRAMENTO: ${new Date(bid.prazo_limite).toLocaleString()}`, 14, 54);

    // Vencedor
    doc.setFillColor(240, 240, 240);
    doc.rect(14, 60, 182, 25, 'F');
    doc.setFontSize(12);
    doc.setTextColor(153, 27, 27);
    doc.text("VENCEDOR HOMOLOGADO", 20, 68);
    
    if (vencedor) {
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.text(`TRANSPORTADORA: ${vencedor.transportadora_nome}`, 20, 75);
        doc.text(`VALOR FINAL: ${formatCurrency(vencedor.valor)}`, 110, 75);
        doc.text(`PRAZO: ${vencedor.prazo_dias} dias`, 160, 75);
    } else {
        doc.text("LEILÃO DESERTO / SEM VENCEDOR", 20, 75);
    }

    // Timeline de Aprovação
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("TIMELINE DE APROVAÇÃO:", 14, 95);
    const timeline = [
        ['Criação', bid.log_criacao || '-'],
        ['Encerramento', bid.log_encerramento || 'Automático'],
        ['Seleção (Analista)', bid.log_selecao || '-'],
        ['Aprovação (Master)', bid.log_aprovacao || '-'],
    ];
    
    autoTable(doc, {
        startY: 100,
        head: [['Evento', 'Responsável / Data']],
        body: timeline,
        theme: 'grid',
        headStyles: { fillColor: [100, 100, 100] },
        styles: { fontSize: 8 }
    });

    // Histórico de Lances
    doc.text("TRILHA DE LANCES (LIVRO DE OFERTAS):", 14, (doc as any).lastAutoTable.finalY + 10);
    
    const rowsLances = lances
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map(l => [
            new Date(l.created_at).toLocaleString(),
            l.transportadora_nome,
            formatCurrency(l.valor),
            l.prazo_dias + ' dias'
        ]);

    autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 15,
        head: [['Data/Hora', 'Transportadora', 'Valor', 'Prazo']],
        body: rowsLances,
        theme: 'striped',
        headStyles: { fillColor: [153, 27, 27] }, // Vinho
        styles: { fontSize: 8 }
    });

    // Rodapé
    const pageCount = (doc as any).internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Gerado via Sistema BID Log em ${new Date().toLocaleString()}`, 105, 290, { align: "center" });
    }

    doc.save(`AUDIT_${bid.codigo_unico}.pdf`);
}