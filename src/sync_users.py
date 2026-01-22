import json
from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

if not url or not key:
    print("Erro: Arquivo .env não encontrado.")
    exit()

supabase: Client = create_client(url, key)


def sincronizar_banco():
    print("Lendo arquivo credentials.json...")

    try:
        with open("../credentials.json", "r", encoding="utf-8") as f:
            dados = json.load(f)
    except FileNotFoundError:
        print("Erro: Arquivo credentials.json não encontrado.")
        return
    except json.JSONDecodeError:
        print("Erro: Seu JSON está com formato inválido (verifique vírgulas e aspas).")
        return

    print(f"Processando {len(dados.get('admins', []))} Administradores...")
    for admin in dados.get("admins", []):
        try:
            res = (
                supabase.table("admins")
                .select("*")
                .eq("usuario", admin["usuario"])
                .execute()
            )

            if res.data:
                supabase.table("admins").update(
                    {"nome": admin["nome"], "senha": admin["senha"]}
                ).eq("usuario", admin["usuario"]).execute()
                print(f"   [Atualizado] {admin['usuario']}")
            else:
                supabase.table("admins").insert(admin).execute()
                print(f"   [Criado] {admin['usuario']}")
        except Exception as e:
            print(f"   Erro ao processar {admin['usuario']}: {e}")

    print(f"Processando {len(dados.get('transportadoras', []))} Transportadoras...")
    for transp in dados.get("transportadoras", []):
        try:
            res = (
                supabase.table("transportadoras")
                .select("*")
                .eq("usuario", transp["usuario"])
                .execute()
            )

            if res.data:
                supabase.table("transportadoras").update(
                    {"nome": transp["nome"], "senha": transp["senha"]}
                ).eq("usuario", transp["usuario"]).execute()
                print(f"   [Atualizado] {transp['usuario']}")
            else:
                supabase.table("transportadoras").insert(transp).execute()
                print(f"   [Criado] {transp['usuario']}")
        except Exception as e:
            print(f"   Erro ao processar {transp['usuario']}: {e}")

    print("Sincronização concluída! O Banco de Dados está atualizado.")


if __name__ == "__main__":
    sincronizar_banco()
