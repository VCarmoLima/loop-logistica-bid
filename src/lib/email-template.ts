// src/lib/email-template.ts

export const gerarEmailHtml = (titulo: string, mensagemHtml: string, botaoLink?: string, botaoTexto?: string) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f3f4f6; }
  </style>
</head>
<body style="background-color: #f3f4f6; margin: 0; padding: 40px 0;">
  
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); overflow: hidden;">
    
    <tr>
      <td style="background: linear-gradient(90deg, #dc2626 0%, #991b1b 100%); height: 6px;"></td>
    </tr>

    <tr>
      <td align="center" style="padding: 40px 40px 10px 40px; background-color: #ffffff;">
        <img 
          src="https://logistica-bid.vercel.app/images/icon.png" 
          alt="BID Logístico" 
          width="70" 
          style="display: block; border: 0; background-color: #ffffff; padding: 10px; border-radius: 4px;" 
        />
        
        <p style="color: #9ca3af; font-size: 10px; text-transform: uppercase; letter-spacing: 3px; margin-top: 0px; margin-bottom: 0; font-weight: bold;">
          Sistema de BIDs
        </p>
      </td>
    </tr>

    <tr>
      <td align="center" style="padding: 0 40px 40px 40px;">
        <h1 style="color: #111827; font-size: 20px; font-weight: 700; margin-bottom: 10px; margin-top: 0;">${titulo}</h1>
        
        <div style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 25px; text-align: left;">
          ${mensagemHtml}
        </div>

        ${botaoLink ? `
        <a href="${botaoLink}" style="background-color: #dc2626; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 2px 4px rgba(220, 38, 38, 0.3);">
          ${botaoTexto || 'ACESSAR SISTEMA'}
        </a>
        ` : ''}
        
      </td>
    </tr>

    <tr>
      <td align="center" style="background-color: #f9fafb; padding: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #9ca3af; font-size: 11px; margin: 0;">
          © 2026 VCarmoLima — Sistema de BIDs Logísticos<br>
          Enviado automaticamente. Não responda.
        </p>
      </td>
    </tr>

  </table>
  
  <div style="height: 40px;"></div>

</body>
</html>
  `;
}