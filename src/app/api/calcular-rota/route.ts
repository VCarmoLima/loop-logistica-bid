import { NextResponse } from 'next/server'

const calcularSla = (km: number) => {
    if (km <= 100) return 2
    if (km <= 200) return 3
    if (km <= 300) return 4
    if (km <= 400) return 5
    if (km <= 600) return 6
    if (km <= 800) return 8
    if (km <= 1000) return 10
    return 15
}

const limparEndereco = (endereco: string) => {
    if (!endereco) return ''
    return endereco
        .replace(/[-/]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

export async function POST(request: Request) {
    try {
        const { origem, destino } = await request.json()
        const apiKey = process.env.API_KEY_LOCATION_IQ

        if (!apiKey) throw new Error("Chave da API do LocationIQ não configurada.")
        if (!origem || !destino) return NextResponse.json({ error: "Origem e Destino obrigatórios." }, { status: 400 })

        const origemLimpa = limparEndereco(origem)
        const destinoLimpo = limparEndereco(destino)

        const resOrigem = await fetch(`https://us1.locationiq.com/v1/search?key=${apiKey}&q=${encodeURIComponent(origemLimpa)}&format=json&limit=1`)
        const dataOrigem = await resOrigem.json()

        if (dataOrigem.error || !dataOrigem.length) {
            return NextResponse.json({ error: `O LocationIQ não conseguiu localizar a ORIGEM: "${origemLimpa}". Tente simplificar o endereço.` }, { status: 400 })
        }

        const lat1 = dataOrigem[0].lat
        const lon1 = dataOrigem[0].lon

        const resDestino = await fetch(`https://us1.locationiq.com/v1/search?key=${apiKey}&q=${encodeURIComponent(destinoLimpo)}&format=json&limit=1`)
        const dataDestino = await resDestino.json()

        if (dataDestino.error || !dataDestino.length) {
            return NextResponse.json({ error: `O LocationIQ não conseguiu localizar o DESTINO: "${destinoLimpo}". Tente simplificar o endereço.` }, { status: 400 })
        }

        const lat2 = dataDestino[0].lat
        const lon2 = dataDestino[0].lon

        const resRoute = await fetch(`https://us1.locationiq.com/v1/directions/driving/${lon1},${lat1};${lon2},${lat2}?key=${apiKey}&overview=simplified`)
        const dataRoute = await resRoute.json()

        if (dataRoute.error || !dataRoute.routes || dataRoute.routes.length === 0) {
            return NextResponse.json({ error: "Não foi possível traçar uma rota rodoviária entre os pontos localizados." }, { status: 400 })
        }

        const distanceKm = Math.round(dataRoute.routes[0].distance / 1000)

        const sla = calcularSla(distanceKm)
        const mapUrl = `https://maps.locationiq.com/v3/staticmap?key=${apiKey}&size=600x300&zoom=5&markers=icon:large-green-cutout|${lat1},${lon1}&markers=icon:large-red-cutout|${lat2},${lon2}`

        return NextResponse.json({
            distancia_km: distanceKm,
            sla_dias: sla,
            mapa_url: mapUrl
        })

    } catch (error: any) {
        console.error("Erro interno do servidor:", error)
        return NextResponse.json({ error: "Ocorreu um erro no servidor ao tentar calcular a rota." }, { status: 500 })
    }
}