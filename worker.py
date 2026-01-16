import time
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from datetime import datetime, timezone

load_dotenv()
supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

def processar_bids():
    print("🤖 Worker Rodando... Monitorando Prazos.")
    while True:
        try:
            # Busca BIDs Abertos
            resp = supabase.table("bids").select("*").eq("status", "ABERTO").execute()
            agora_utc = datetime.now(timezone.utc)

            for bid in resp.data:
                prazo_str = bid.get('prazo_limite')
                if prazo_str:
                    # Converte para data com fuso
                    prazo_dt = datetime.fromisoformat(prazo_str.replace('Z', '+00:00'))

                    if agora_utc > prazo_dt:
                        print(f"⏰ Prazo encerrado para: {bid['titulo']}. Movendo para Análise.")
                        # Move para o status onde o Admin vai escolher o vencedor
                        supabase.table("bids").update({"status": "EM_ANALISE"}).eq("id", bid['id']).execute()

            time.sleep(10)
        except Exception as e:
            print(f"Erro Worker: {e}")
            time.sleep(10)

if __name__ == "__main__":
    processar_bids()