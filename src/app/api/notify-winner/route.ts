import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import { gerarEmailHtml } from '@/lib/email-template'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { winnerLanceId, bidTitle, valorFinal } = body

    // --- LOGS DE DEBUG (APARECEM NO PAINEL DA VERCEL) ---
    console.log("1. Iniciando envio de Vencedor...")
    console.log("2. Dados recebidos:", { winnerLanceId, bidTitle, valorFinal })
    console.log("3. Verificando Chaves:", {
        url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY, // Tem que ser TRUE
        gmailUser: !!process.env.GMAIL_USER
    })

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error("FATAL: SUPABASE_SERVICE_ROLE_KEY não carregada. Faça Redeploy na Vercel.")
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Busca Lance
    const { data: lanceData, error: lanceError } = await supabaseAdmin
        .from('lances')
        .select('auth_id, transportadora_nome')
        .eq('id', winnerLanceId)
        .single()

    if (lanceError || !lanceData) {
        console.error("4. Erro ao buscar Lance:", lanceError)
        return NextResponse.json({ message: 'Lance não encontrado no Banco', detalhe: lanceError }, { status: 404 })
    }
    console.log("4. Lance encontrado:", lanceData.transportadora_nome)

    // Busca Usuário
    const { data: userData, error: userError } = await supabaseAdmin
        .from('transportadoras')
        .select('email, nome')
        .eq('auth_id', lanceData.auth_id)
        .single()

    if (userError || !userData) {
        console.error("5. Erro ao buscar Transportadora:", userError)
        return NextResponse.json({ message: 'Transportadora não encontrada', detalhe: userError }, { status: 404 })
    }
    console.log("5. Email encontrado:", userData.email)

    // Envio de Email
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

    const htmlFinal = gerarEmailHtml('🏆 PARABÉNS: Você Venceu!', conteudo, `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`, 'ACESSAR PAINEL')

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

    console.log("6. Sucesso total!")
    return NextResponse.json({ message: 'Vencedor notificado com sucesso!' })

  } catch (error: any) {
    console.error('FATAL API ERROR:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}