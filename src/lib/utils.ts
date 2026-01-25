import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Função para combinar classes Tailwind condicionalmente
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formatador de Moeda (BRL)
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

// Formatador de Data (DD/MM/YYYY HH:mm)
export const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Data indefinida'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}