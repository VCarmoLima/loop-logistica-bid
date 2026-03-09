import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import nodemailer from 'nodemailer'
import { gerarEmailHtml } from '@/lib/email-template'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { winnerLanceId, bidTitle, valorFinal } = body

        console.log("1. Iniciando envio de Vencedor...")
        console.log("2. Dados:", { winnerLanceId, bidTitle, valorFinal })

        const { data: lanceData, error: lanceError } = await supabase
            .from('lances')
            .select('auth_id, transportadora_nome')
            .eq('id', winnerLanceId)
            .single()

        if (lanceError || !lanceData) {
            console.error("Erro ao buscar lance:", lanceError)
            return NextResponse.json({ message: 'Lance não encontrado' }, { status: 404 })
        }

        if (!lanceData.auth_id) {
            console.log("⚠️ Lance antigo detectado (sem auth_id). O e-mail não será enviado, mas o fluxo segue.")
            return NextResponse.json({ message: 'Lance antigo sem vínculo de usuário. E-mail ignorado.' })
        }

        console.log("3. Lance válido. Buscando email do ID:", lanceData.auth_id)

        const { data: userData, error: userError } = await supabase
            .from('transportadoras')
            .select('email, nome')
            .eq('auth_id', lanceData.auth_id)
            .single()

        if (userError || !userData) {
            console.error("Erro ao buscar Transportadora:", userError)
            return NextResponse.json({ message: 'Transportadora não encontrada' }, { status: 404 })
        }

        console.log("4. Destinatário encontrado:", userData.email)

        const conteudo = `
        <p>Parabéns, <strong>${userData.nome}</strong>!</p>
        <p>Sua proposta foi a escolhida e <strong>HOMOLOGADA</strong> pelo nosso time.</p>
        <div style="background-color: #f0fdf4; border: 1px solid #dcfce7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #166534; font-size: 11px; font-weight: bold; text-transform: uppercase;">Veículo</p>
            <p style="margin: 2px 0 10px 0; font-size: 16px; font-weight: bold; color: #111;">${bidTitle}</p>
            <p style="margin: 0; color: #166534; font-size: 11px; font-weight: bold; text-transform: uppercase;">Valor Fechado</p>
            <p style="margin: 2px 0 0 0; font-size: 20px; font-weight: 800; color: #15803d;">${valorFinal}</p>
        </div>
        <p style="font-size: 13px;">Aguarde contato operacional.</p>
    `

        const htmlFinal = gerarEmailHtml('🏆 PARABÉNS: Você Venceu!', conteudo, `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
            'ACESSAR PAINEL')

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS }
        })

        await transporter.sendMail({
            from: `"Sistema BID Logística" <${process.env.GMAIL_USER}>`,
            to: userData.email,
            cc: process.env.LOOP_USER,
            subject: `🏆 BID Vencido: ${bidTitle}`,
            html: htmlFinal
        })

        console.log("✅ E-mail enviado com sucesso!")
        return NextResponse.json({ message: 'Vencedor notificado com sucesso!' })

    } catch (error: any) {
        console.error('FATAL API ERROR:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}