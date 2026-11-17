export default function Home() {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 text-zinc-900">
      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <span className="text-lg font-semibold tracking-tight">Stockwise</span>
        <span className="text-sm text-zinc-500">Pricing · Docs · Sign in</span>
      </nav>
      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-20">
        <p className="text-sm font-medium text-emerald-700">Inventory, without the spreadsheets</p>
        <h1 className="mt-3 max-w-2xl text-5xl leading-[1.05] font-semibold tracking-tight max-sm:text-4xl">
          Know what&apos;s in stock. Always.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-zinc-600">
          Track products, reorder on time and follow every shipment. Questions? Our assistant is one click away, bottom right.
        </p>
      </section>
    </main>
  );
}
