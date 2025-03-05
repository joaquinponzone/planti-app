import Link from "next/link"
import { PlusCircle } from "lucide-react"
import PlantList from "@/components/plant-list"

export default function Home() {
  return (
    <main className="container mx-auto p-4 md:p-8 pt-0">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight border-b-4 border-black dark:border-primary pb-2 mb-2">Planti</h1>
          <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-3">
            <p className="text-lg font-medium text-muted-foreground">Keep your green friends alive!</p>
            <Link
              href="/add-plant"
              className="flex items-center gap-2 bg-primary/30 dark:bg-primary dark:hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 border-2 border-black neo-brutalist-shadow transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none w-fit"
            >
              <PlusCircle size={20} />
              <span>New plant</span>
            </Link>
          </div>
        </header>

        <PlantList />
      </div>
    </main>
  )
}

