'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { 
    Upload, Save, Truck, MapPin, Calendar, FileText, Building2, 
    Sliders, AlertTriangle, X, CheckCircle, Percent, 
    Clock
} from 'lucide-react'

// Inicializa Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
)

// Tipo para o Pátio
type Patio = {
    id: string
    nome: string
    endereco: string
}

const gerarCodigoBid = () => {
    const data = new Date()
    const prefixo = `${data.getFullYear()}${(data.getMonth() + 1).toString().padStart(2, '0')}`
    const random = Math.random().toString(36).substring(2, 10).toUpperCase()
    return `BID-${prefixo}-${random}`
}

export default function NovoBidPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [imagemFile, setImagemFile] = useState<File | null>(null)
  
  // Listas de Pátios vindos do banco
  const [listaPatios, setListaPatios] = useState<Patio[]>([])
  
  // Controles visuais
  const [isOrigemPatio, setIsOrigemPatio] = useState(false)
  const [isDestinoPatio, setIsDestinoPatio] = useState(false)
  
  // Controle do Sufixo do ID
  const [usarSufixo, setUsarSufixo] = useState(false)
  const [sufixoId, setSufixoId] = useState('')

  // MODAL DE CONFIRMAÇÃO
  const [showConfirm, setShowConfirm] = useState(false)

  // ESTRATÉGIA (PESOS)
  const [pesoPreco, setPesoPreco] = useState(70)
  // pesoPrazo é derivado (100 - pesoPreco)

  // Estilos
  const inputStyle = "w-full p-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all disabled:bg-gray-100 disabled:text-gray-500"
  const checkboxStyle = "rounded border-gray-300 text-red-600 focus:ring-red-500 accent-red-600 w-4 h-4 cursor-pointer"

  const [formData, setFormData] = useState({
    codigo_base: '', 
    titulo: '',
    placa: '',
    categoria_veiculo: 'Pesado',
    quantidade_veiculos: 1, 
    tipo_transporte: 'Remoção Santander',
    origem: '',
    endereco_retirada: '',
    destino: '',
    endereco_entrega: '',
    prazo_data: '',
    prazo_hora: '',
    possui_chave: false,
    funciona: false,
  })

  // 1. Carregar Pátios e Gerar Código Base
  useEffect(() => {
    const codigo = gerarCodigoBid()
    setFormData(prev => ({ ...prev, codigo_base: codigo }))
    fetchPatios()
  }, [])

  // 2. Lógica de Frotas (Placa)
  useEffect(() => {
    if (Number(formData.quantidade_veiculos) > 1) {
        setFormData(prev => ({ ...prev, placa: 'LOTE / DIVERSAS' }))
    } else {
        if (formData.placa === 'LOTE / DIVERSAS') {
            setFormData(prev => ({ ...prev, placa: '' }))
        }
    }
  }, [formData.quantidade_veiculos])

  // 3. Lógica "Pátio a Pátio"
  useEffect(() => {
    if (formData.tipo_transporte === 'Pátio a Pátio') {
        setIsOrigemPatio(true)
        setIsDestinoPatio(true)
    }
  }, [formData.tipo_transporte])

  const fetchPatios = async () => {
      const { data } = await supabase.from('patios').select('*').eq('ativo', true).order('nome')
      if (data) setListaPatios(data)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCheckbox = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }))
  }

  const handleTogglePatio = (tipo: 'origem' | 'destino', isChecked: boolean) => {
      if (tipo === 'origem') {
          setIsOrigemPatio(isChecked)
          if (!isChecked) {
              setFormData(prev => ({ ...prev, origem: '', endereco_retirada: '' }))
          }
      } else {
          setIsDestinoPatio(isChecked)
          if (!isChecked) {
              setFormData(prev => ({ ...prev, destino: '', endereco_entrega: '' }))
          }
      }
  }

  const handlePatioSelect = (tipo: 'origem' | 'destino', patioId: string) => {
      const patioSelecionado = listaPatios.find(p => p.id === patioId)
      if (!patioSelecionado) return

      if (tipo === 'origem') {
          setFormData(prev => ({
              ...prev,
              origem: patioSelecionado.nome,
              endereco_retirada: patioSelecionado.endereco
          }))
      } else {
           setFormData(prev => ({
              ...prev,
              destino: patioSelecionado.nome,
              endereco_entrega: patioSelecionado.endereco
          }))
      }
  }

  const checkCodigoExiste = async (codigo: string) => {
      const { data } = await supabase
          .from('bids')
          .select('id')
          .eq('codigo_unico', codigo)
          .maybeSingle()
      return !!data 
  }

  // ETAPA 1: Abrir Modal de Confirmação (Double Check)
  const handlePreSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      
      // Validações básicas antes de abrir o modal
      if (!formData.titulo || !formData.origem || !formData.destino || !formData.prazo_data || !formData.prazo_hora) {
          alert('Por favor, preencha todos os campos obrigatórios.')
          return
      }
      
      setShowConfirm(true)
  }

  // ETAPA 2: Envio Real
  const handleFinalSubmit = async () => {
    setLoading(true)

    try {
        let imagem_url = null
        if (imagemFile) {
            const fileExt = imagemFile.name.split('.').pop()
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
            const { error: uploadError } = await supabase.storage.from('veiculos').upload(fileName, imagemFile)
            if (uploadError) throw uploadError
            const { data: publicUrlData } = supabase.storage.from('veiculos').getPublicUrl(fileName)
            imagem_url = publicUrlData.publicUrl
        }

        const prazo_limite = new Date(`${formData.prazo_data}T${formData.prazo_hora}:00`).toISOString()

        let codigoFinal = usarSufixo && sufixoId.trim() 
            ? `${formData.codigo_base}-${sufixoId.trim().toUpperCase()}`
            : formData.codigo_base
        
        let existe = await checkCodigoExiste(codigoFinal)
        let tentativas = 0

        while (existe && tentativas < 5) {
            console.log(`Colisão detectada para ${codigoFinal}. Gerando novo...`)
            const novaBase = gerarCodigoBid()
            codigoFinal = usarSufixo && sufixoId.trim() 
                ? `${novaBase}-${sufixoId.trim().toUpperCase()}`
                : novaBase
            existe = await checkCodigoExiste(codigoFinal)
            tentativas++
        }

        if (existe) {
            alert('Erro de Sistema: Não foi possível gerar um ID único.')
            setLoading(false)
            setShowConfirm(false)
            return
        }

        const { error: insertError } = await supabase.from('bids').insert({
            codigo_unico: codigoFinal,
            titulo: formData.titulo,
            placa: formData.placa,
            categoria_veiculo: formData.categoria_veiculo,
            quantidade_veiculos: Number(formData.quantidade_veiculos),
            tipo_transporte: formData.tipo_transporte,
            origem: formData.origem,
            endereco_retirada: formData.endereco_retirada,
            destino: formData.destino,
            endereco_entrega: formData.endereco_entrega,
            possui_chave: formData.possui_chave,
            funciona: formData.funciona,
            prazo_limite: prazo_limite,
            status: 'ABERTO',
            imagem_url: imagem_url,
            // NOVOS CAMPOS DE ESTRATÉGIA
            peso_preco: pesoPreco,
            peso_prazo: 100 - pesoPreco,
            log_criacao: `Sistema Web em ${new Date().toLocaleString()}`
        })

        if (insertError) throw insertError

        alert(`BID Criado com Sucesso! Código: ${codigoFinal}`)
        setShowConfirm(false)
        router.push('/dashboard') 

    } catch (error: any) {
        console.error(error)
        alert('Erro ao criar BID: ' + error.message)
    } finally {
        setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-red-100 text-red-600 rounded-lg">
            <FileText size={24} />
        </div>
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Cadastro de Novo BID</h1>
            <p className="text-gray-500 text-sm">Preencha os dados para abrir a cotação.</p>
        </div>
      </div>

      <form onSubmit={handlePreSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Seção 1: Dados do Veículo */}
        <div className="p-6 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                <Truck size={16} /> Dados
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* ID Inteligente */}
                <div className="md:col-span-4">
                    <div className="flex justify-between mb-1">
                        <label className="block text-sm font-medium text-gray-700">Código do BID</label>
                        <label className="flex items-center gap-1 cursor-pointer select-none">
                            <input 
                                type="checkbox" 
                                checked={usarSufixo}
                                onChange={(e) => setUsarSufixo(e.target.checked)}
                                className={checkboxStyle} 
                            />
                            <span className="text-[10px] font-bold text-red-600 flex items-center gap-1 uppercase">
                                Personalizar ID?
                            </span>
                        </label>
                    </div>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            disabled 
                            value={formData.codigo_base} 
                            className={`${inputStyle} bg-gray-100 text-gray-500 cursor-not-allowed font-mono text-center`} 
                        />
                        {usarSufixo && (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                                <span className="text-gray-400 font-bold">-</span>
                                <input 
                                    type="text" 
                                    placeholder="CLIENTE" 
                                    value={sufixoId}
                                    onChange={(e) => setSufixoId(e.target.value)}
                                    className={`${inputStyle} uppercase font-bold text-red-700 w-28`} 
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Quantidade */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Qtd. Veículos</label>
                    <input 
                        type="number" 
                        name="quantidade_veiculos"
                        min="1"
                        value={formData.quantidade_veiculos} 
                        onChange={handleChange} 
                        className={inputStyle} 
                    />
                </div>

                {/* Placa Inteligente */}
                <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Placa</label>
                    <input 
                        type="text" 
                        name="placa" 
                        value={formData.placa} 
                        onChange={handleChange} 
                        disabled={Number(formData.quantidade_veiculos) > 1} 
                        placeholder="ABC-1D23" 
                        className={`${inputStyle} uppercase ${Number(formData.quantidade_veiculos) > 1 ? 'bg-gray-100 text-gray-500 font-bold' : ''}`} 
                    />
                </div>

                {/* Categoria */}
                <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                    <select name="categoria_veiculo" value={formData.categoria_veiculo} onChange={handleChange} className={inputStyle}>
                        <option>Moto</option>
                        <option>Leve</option>
                        <option>Caminhonete</option>
                        <option>Van</option>
                        <option>Pesado</option>
                        <option>Máquina</option>
                        <option>Reboque</option>
                    </select>
                </div>
                
                {/* Linha 2 */}
                <div className="md:col-span-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Modelo / Versão</label>
                    <input type="text" name="titulo" required value={formData.titulo} onChange={handleChange} placeholder="Ex: SCANIA R450 A 6X2" className={inputStyle} />
                </div>
                
                <div className="md:col-span-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Operação</label>
                    <select name="tipo_transporte" value={formData.tipo_transporte} onChange={handleChange} className={inputStyle}>
                        <option>Remoção Santander</option>
                        <option>Remoção Frotas</option>
                        <option>Remoção Outros Comitentes</option>
                        <option>Frete Vendido</option>
                        <option>Pátio a Pátio</option>
                        <option>Restituição Santander</option>
                        <option>Restituição Outros Comitente</option>
                    </select>
                </div>

            </div>

            <div className="mt-6 flex gap-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none font-medium">
                    <input 
                        type="checkbox" 
                        checked={formData.possui_chave} 
                        onChange={(e) => handleCheckbox('possui_chave', e.target.checked)} 
                        className={checkboxStyle}
                    />
                    Possui Chave
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none font-medium">
                    <input 
                        type="checkbox" 
                        checked={formData.funciona} 
                        onChange={(e) => handleCheckbox('funciona', e.target.checked)} 
                        className={checkboxStyle}
                    />
                    Veículo Funciona
                </label>
            </div>
        </div>

        {/* Seção 2: Rota Logística */}
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                <MapPin size={16} /> Rota Logística
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* COLUNA ORIGEM */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="block text-sm font-medium text-gray-700">Origem (Coleta)</label>
                        <label className="flex items-center gap-1.5 cursor-pointer select-none bg-white px-2 py-1 rounded border border-gray-200 shadow-sm hover:border-red-200 transition-colors">
                             <input 
                                type="checkbox" 
                                checked={isOrigemPatio}
                                disabled={formData.tipo_transporte === 'Pátio a Pátio'} 
                                onChange={(e) => handleTogglePatio('origem', e.target.checked)}
                                className={checkboxStyle} 
                             />
                             <span className="text-xs font-bold text-gray-600 flex items-center gap-1">
                                <Building2 size={12} className="text-red-500"/> É Pátio?
                             </span>
                        </label>
                    </div>

                    {isOrigemPatio ? (
                        <select 
                            className={inputStyle}
                            onChange={(e) => handlePatioSelect('origem', e.target.value)}
                            defaultValue=""
                        >
                            <option value="" disabled>Selecione o Pátio de Origem...</option>
                            {listaPatios.map(p => (
                                <option key={p.id} value={p.id}>{p.nome}</option>
                            ))}
                        </select>
                    ) : (
                        <input 
                            type="text" 
                            name="origem" 
                            required 
                            value={formData.origem} 
                            onChange={handleChange} 
                            placeholder="Cidade - UF"
                            className={inputStyle} 
                        />
                    )}

                    <textarea 
                        name="endereco_retirada" 
                        value={formData.endereco_retirada} 
                        onChange={handleChange} 
                        readOnly={isOrigemPatio}
                        placeholder={isOrigemPatio ? "Endereço será preenchido automaticamente..." : "Endereço completo de retirada..."} 
                        className={`${inputStyle} h-24 mt-1 resize-none ${isOrigemPatio ? 'bg-gray-100 text-gray-600' : ''}`} 
                    />
                </div>

                {/* COLUNA DESTINO */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="block text-sm font-medium text-gray-700">Destino (Entrega)</label>
                        <label className="flex items-center gap-1.5 cursor-pointer select-none bg-white px-2 py-1 rounded border border-gray-200 shadow-sm hover:border-red-200 transition-colors">
                             <input 
                                type="checkbox" 
                                checked={isDestinoPatio}
                                disabled={formData.tipo_transporte === 'Pátio a Pátio'} 
                                onChange={(e) => handleTogglePatio('destino', e.target.checked)}
                                className={checkboxStyle} 
                             />
                             <span className="text-xs font-bold text-gray-600 flex items-center gap-1">
                                <Building2 size={12} className="text-red-500"/> É Pátio?
                             </span>
                        </label>
                    </div>

                    {isDestinoPatio ? (
                        <select 
                            className={inputStyle}
                            onChange={(e) => handlePatioSelect('destino', e.target.value)}
                            defaultValue=""
                        >
                            <option value="" disabled>Selecione o Pátio de Destino...</option>
                            {listaPatios.map(p => (
                                <option key={p.id} value={p.id}>{p.nome}</option>
                            ))}
                        </select>
                    ) : (
                        <input 
                            type="text" 
                            name="destino" 
                            required 
                            value={formData.destino} 
                            onChange={handleChange} 
                            placeholder="Cidade - UF"
                            className={inputStyle} 
                        />
                    )}

                    <textarea 
                        name="endereco_entrega" 
                        value={formData.endereco_entrega} 
                        onChange={handleChange} 
                        readOnly={isDestinoPatio}
                        placeholder={isDestinoPatio ? "Endereço será preenchido automaticamente..." : "Endereço completo de entrega..."} 
                        className={`${inputStyle} h-24 mt-1 resize-none ${isDestinoPatio ? 'bg-gray-100 text-gray-600' : ''}`} 
                    />
                </div>

            </div>
        </div>

        {/* Seção 3: Estratégia do Leilão (NOVA) */}
        <div className="p-6 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                <Sliders size={16} /> Estratégia de Homologação
            </h2>
            
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <div className="flex justify-between items-end mb-4">
                    <div className="text-center w-1/3">
                        <span className="block text-xs font-bold text-green-700 uppercase mb-1">Peso do Preço</span>
                        <span className="text-3xl font-extrabold text-gray-900">{pesoPreco}%</span>
                    </div>
                    
                    <div className="w-1/3 px-4 pb-2">
                         <input 
                            type="range" 
                            min="10" 
                            max="90" 
                            step="5"
                            value={pesoPreco} 
                            onChange={(e) => setPesoPreco(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
                        />
                         <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-bold">
                            <span>Priorizar Prazo</span>
                            <span>Equilibrado</span>
                            <span>Priorizar Preço</span>
                         </div>
                    </div>

                    <div className="text-center w-1/3">
                        <span className="block text-xs font-bold text-blue-700 uppercase mb-1">Peso do Prazo</span>
                        <span className="text-3xl font-extrabold text-gray-900">{100 - pesoPreco}%</span>
                    </div>
                </div>
                
                <p className="text-xs text-center text-gray-500 bg-white p-2 rounded border border-gray-200">
                    {pesoPreco >= 70 
                        ? "Estratégia Focada em Custo: O sistema dará preferência total para lances mais baratos." 
                        : pesoPreco <= 40 
                        ? "Estratégia Focada em Urgência: O sistema dará preferência total para quem entrega mais rápido."
                        : "Estratégia Equilibrada: O sistema busca o melhor balanço entre preço e prazo."
                    }
                </p>
            </div>
        </div>

        {/* Seção 4: Prazos e Foto */}
        <div className="p-6">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                <Calendar size={16} /> Encerramento & Mídia
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Limite</label>
                    <input 
                        type="date" 
                        name="prazo_data" 
                        required 
                        value={formData.prazo_data} 
                        onChange={handleChange} 
                        className={inputStyle} 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora Limite</label>
                    <input 
                        type="time" 
                        name="prazo_hora" 
                        required 
                        value={formData.prazo_hora} 
                        onChange={handleChange} 
                        className={inputStyle} 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Foto do Veículo</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors relative cursor-pointer group bg-white hover:border-red-300">
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => setImagemFile(e.target.files?.[0] || null)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Upload className="mx-auto text-gray-400 group-hover:text-red-500 mb-1 transition-colors" size={20} />
                        <p className="text-xs text-gray-500 group-hover:text-gray-700 font-medium">
                            {imagemFile ? imagemFile.name : 'Clique para enviar'}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* Footer com Botões */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
            <button 
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
                Cancelar
            </button>
            <button 
                type="submit" // Agora dispara o handlePreSubmit
                disabled={loading}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 hover:-translate-y-0.5"
            >
                {loading ? 'Processando...' : <><Save size={16} /> Conferir e Publicar</>}
            </button>
        </div>

      </form>

      {/* --- MODAL DE DOUBLE CHECK --- */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <AlertTriangle size={18} className="text-yellow-500"/> Confirmar Publicação
                    </h3>
                    <button onClick={() => setShowConfirm(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-xs text-yellow-800 mb-4">
                        Por favor, revise os dados abaixo. Após publicado, o BID estará visível para todas as transportadoras.
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="block text-[10px] font-bold text-gray-400 uppercase">Código</span>
                            <span className="block text-sm font-bold text-gray-900">
                                {usarSufixo && sufixoId ? `${formData.codigo_base}-${sufixoId.toUpperCase()}` : formData.codigo_base}
                            </span>
                        </div>
                        <div>
                            <span className="block text-[10px] font-bold text-gray-400 uppercase">Qtd. / Categoria</span>
                            <span className="block text-sm font-medium text-gray-900">{formData.quantidade_veiculos}x {formData.categoria_veiculo}</span>
                        </div>
                        <div className="col-span-2">
                            <span className="block text-[10px] font-bold text-gray-400 uppercase">Veículo</span>
                            <span className="block text-sm font-bold text-gray-900">{formData.titulo}</span>
                        </div>
                        <div className="col-span-2">
                             <div className="flex items-center gap-2 text-xs bg-gray-50 p-2 rounded">
                                <span className="font-bold text-gray-500">Origem:</span> {formData.origem}
                                <span className="text-gray-300">➝</span>
                                <span className="font-bold text-gray-500">Destino:</span> {formData.destino}
                             </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                         <span className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Estratégia Definida</span>
                         <div className="flex gap-4">
                             <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded border border-green-100">
                                 <Percent size={12} className="text-green-700"/>
                                 <span className="text-xs font-bold text-green-800">Preço: {pesoPreco}%</span>
                             </div>
                             <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded border border-blue-100">
                                 <Clock size={12} className="text-blue-700"/>
                                 <span className="text-xs font-bold text-blue-800">Prazo: {100 - pesoPreco}%</span>
                             </div>
                         </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 border-t flex gap-3 justify-end">
                    <button 
                        onClick={() => setShowConfirm(false)}
                        className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-lg"
                    >
                        Voltar e Editar
                    </button>
                    <button 
                        onClick={handleFinalSubmit}
                        disabled={loading}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg shadow-sm flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? 'Publicando...' : <><CheckCircle size={16} /> CONFIRMAR E PUBLICAR</>}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}