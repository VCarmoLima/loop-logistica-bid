import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: Request) {
  try {
    const { to, subject, html, bcc } = await request.json()

    const user = process.env.GMAIL_USER
    const pass = process.env.GMAIL_PASS

    if (!user || !pass) {
        return NextResponse.json({ error: 'Credenciais de e-mail não configuradas no servidor.' }, { status: 500 })
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass }
    })

    await transporter.sendMail({
      from: `"Sistema BID Logístico" <${user}>`,
      to: to,      
      bcc: bcc,   
      subject: subject,
      html: html,
    })

    return NextResponse.json({ message: 'E-mail enviado com sucesso!' })
  } catch (error: any) {
    console.error('Erro no envio:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}