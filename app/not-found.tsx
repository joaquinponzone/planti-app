import Link from "next/link"

// Reemplaza la 404 de Next, que está en inglés. Es también lo que ve quien
// abre una planta ajena: `notFound()` no distingue "no existe" de "no es tuya".
export default function NotFound() {
  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="max-w-md mx-auto border-4 border-black bg-white dark:bg-neutral-800 p-6 md:p-8 neo-brutalist-shadow">
        <h1 className="text-3xl font-bold border-b-4 border-black pb-2 mb-4">No encontramos esa página</h1>
        <p className="mb-6 text-muted-foreground">Puede que la planta se haya borrado o que el enlace esté mal.</p>
        <Link
          href="/"
          className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 border-2 border-black neo-brutalist-shadow transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
        >
          Volver a mis plantas
        </Link>
      </div>
    </main>
  )
}
