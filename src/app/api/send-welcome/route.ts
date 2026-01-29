import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { gerarEmailHtml } from '@/lib/email-template'

export async function POST(request: Request) {
  try {
    const { email, nome, senhaTemporaria, tipo } = await request.json()

    const titulo = tipo === 'admin' ? 'Bem-vindo ao Time!' : 'Bem-vindo Parceiro!'
    
    const conteudo = `
        <p>Olá <strong>${nome}</strong>,</p>
        <p>Seu cadastro no <strong>Sistema de BIDs Logísticos</strong> foi criado com sucesso.</p>
        <p>Abaixo estão suas credenciais de acesso provisórias:</p>

        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <p style="margin: 5px 0;"><strong>Login:</strong> ${email}</p>
            <p style="margin: 5px 0;"><strong>Senha Provisória:</strong> ${senhaTemporaria}</p>
        </div>

        <p style="font-size: 13px; color: #6b7280;">Recomendamos que você altere sua senha no primeiro acesso.</p>
    `

    const htmlFinal = gerarEmailHtml(
        titulo,
        conteudo,
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://logistica-bid.vercel.app'}/`,
        'ACESSAR MINHA CONTA'
    )

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS }
    })

    await transporter.sendMail({
        from: `"Sistema BID Logístico" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: `Suas credenciais de acesso`,
        html: htmlFinal
    })

    return NextResponse.json({ message: 'Boas-vindas enviada.' })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}