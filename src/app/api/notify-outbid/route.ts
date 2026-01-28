import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import { gerarEmailHtml } from '@/lib/email-template'

export async function POST(request: Request) {
  try {
    const { oldWinnerAuthId, bidTitle, newPrice, bidId } = await request.json()

    // 1. Supabase Admin (para buscar o e-mail do concorrente via ID oculto)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // Necessário adicionar no .env.local
    )

    // 2. Busca dados da transportadora superada
    const { data: userData, error } = await supabaseAdmin
        .from('transportadoras')
        .select('email, nome')
        .eq('auth_id', oldWinnerAuthId)
        .single()

    if (error || !userData) return NextResponse.json({ message: 'Transportadora não encontrada.' }, { status: 404 })

    // 3. Monta o Conteúdo Visual
    const conteudo = `
        <p>Olá, <strong>${userData.nome}</strong>.</p>
        <p>Outra transportadora acabou de enviar uma oferta mais competitiva para a carga abaixo:</p>
        
        <div style="background-color: #fef2f2; border: 1px solid #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b; font-size: 12px; font-weight: bold; text-transform: uppercase;">Veículo / Carga</p>
            <p style="margin: 5px 0 15px 0; font-size: 16px; font-weight: bold; color: #111;">${bidTitle}</p>
            
            <p style="margin: 0; color: #991b1b; font-size: 12px; font-weight: bold; text-transform: uppercase;">Novo Melhor Preço</p>
            <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: 800; color: #dc2626;">${newPrice}</p>
        </div>

        <p>Se você não cobrir este lance, perderá esta oportunidade.</p>
    `

    // 4. Gera HTML Final
    const htmlFinal = gerarEmailHtml(
        '⚠️ Atenção: Você foi superado!', 
        conteudo,
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://logistica-bid.vercel.app'}/dashboard`,
        'COBRIR OFERTA AGORA'
    )

    // 5. Configura Envio
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS }
    })

    // 6. Envia
    await transporter.sendMail({
      from: `"Sistema BID Logística" <${process.env.GMAIL_USER}>`,
      to: userData.email,
      subject: `⚠️ Lance Superado: ${bidTitle}`,
      html: htmlFinal
    })

    return NextResponse.json({ message: 'Alerta enviado.' })

  } catch (error: any) {
    console.error('Erro notify-outbid:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}