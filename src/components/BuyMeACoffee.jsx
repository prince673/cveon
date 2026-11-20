const BUY_ME_A_COFFEE_URL = 'https://buymeacoffee.com/0x70'

export default function BuyMeACoffee() {
  return (
    <section className="mb-6 animate-fade-up" aria-label="Support CVEon">
      <div className="card-flat px-6 py-8 text-center hover:border-[#484f58] transition-colors duration-150">
        <div className="text-4xl mb-3" aria-hidden="true">☕</div>
        <h2 className="text-lg font-semibold text-gray-100 mb-1">Buy me a coffee</h2>
        <p className="text-sm text-[#8b949e] mb-6 max-w-md mx-auto leading-relaxed">
          CVEon stays free and tracker-free. Coffee keeps it running.
        </p>
        <a
          href={BUY_ME_A_COFFEE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group btn-primary"
        >
          <span className="inline-block transition-transform duration-300 group-hover:scale-110" aria-hidden="true">☕</span>
          Buy me a coffee
          <span className="text-[10px] opacity-80">· any amount</span>
        </a>
      </div>
    </section>
  )
}