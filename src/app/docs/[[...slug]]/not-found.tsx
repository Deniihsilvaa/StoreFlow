import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>Documentação não encontrada</h1>
      <p>O documento que você está procurando não foi encontrado.</p>
      <Link href="/docs" style={{ color: "#3b82f6", textDecoration: "underline" }}>
        Voltar para a documentação
      </Link>
    </div>
  );
}

