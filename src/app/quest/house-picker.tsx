import Image from "next/image";
import { HOUSES } from "@/lib/houses";
import { chooseHouse } from "./actions";

export function HousePicker() {
  return (
    <section className="mx-auto max-w-4xl">
      <h1 className="font-crest text-4xl font-bold">Choose your house</h1>
      <p className="mt-2 text-muted">
        Every level you finish adds points to your house. You can only choose once, so check with your teacher if
        you&apos;re not sure.
      </p>
      <form action={chooseHouse} className="mt-6 grid gap-4 sm:grid-cols-2">
        {HOUSES.map((h) => (
          <button
            key={h.id}
            name="house"
            value={h.id}
            type="submit"
            style={{ ["--house" as string]: h.color }}
            className="house-panel p-4 text-left transition-shadow hover:shadow-[0_0_0_3px_var(--house),0_24px_48px_-20px_rgb(27_24_56/0.28)]"
          >
            <Image src={h.crest} alt="" width={160} height={160} className="mx-auto h-auto w-28" />
            <span className="mt-2 block text-center">
              <span className="block font-crest text-xl font-bold">{h.name}</span>
              <span className="block text-sm text-muted">{h.trait}</span>
            </span>
          </button>
        ))}
      </form>
    </section>
  );
}
