import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import { gerarEmailHtml } from '@/lib/email-template'

export async function POST(request: Request) {
  try {
    const { winnerLanceId, bidTitle, valorFinal } = await request.json()

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: lanceData, error } = await supabaseAdmin
        .from('lances')
        .select('auth_id, transportadora_nome')
        .eq('id', winnerLanceId)
        .single()

    if (!lanceData) return NextResponse.json({ message: 'Lance não encontrado' }, { status: 404 })

    const { data: userData } = await supabaseAdmin
        .from('transportadoras')
        .select('email, nome')
        .eq('auth_id', lanceData.auth_id)
        .single()

    if (!userData) return NextResponse.json({ message: 'Email não encontrado' }, { status: 404 })

    const conteudo = `
        <p>Parabéns, <strong>${userData.nome}</strong>!</p>
        <p>Sua proposta foi a escolhida pelo nosso time logístico.</p>

        <div style="background-color: #f0fdf4; border: 1px solid #dcfce7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #166534; font-size: 12px; font-weight: bold; text-transform: uppercase;">Processo Vencido</p>
            <p style="margin: 5px 0 10px 0; font-size: 16px; font-weight: bold; color: #111;">${bidTitle}</p>
            
            <p style="margin: 0; color: #166534; font-size: 12px; font-weight: bold; text-transform: uppercase;">Valor Fechado</p>
            <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: 800; color: #15803d;">${valorFinal}</p>
        </div>

        <p>Aguarde o contato do time de logística para prosseguimento do transporte.</p>
    `

    const htmlFinal = gerarEmailHtml(
        '🏆 PARABÉNS: Você Venceu o BID!',
        conteudo,
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://logistica-bid.vercel.app'}/dashboard`,
        'VER DETALHES'
    )

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS }
    })

    await transporter.sendMail({
        from: `"Sistema BID Logístico" <${process.env.GMAIL_USER}>`,
        to: userData.email,
        cc: process.env.LOOP_USER,
        subject: `🏆 BID Vencido: ${bidTitle}`,
        html: htmlFinal
    })

    return NextResponse.json({ message: 'Vencedor notificado.' })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}