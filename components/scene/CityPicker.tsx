"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  city: string;
  country?: string;
};

export default function CityPicker({ city, country }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(query: string) {
    const trimmed = query.trim();
    if (!trimmed) {
      setEditing(false);
      return;
    }
    startTransition(() => {
      router.push(`/?city=${encodeURIComponent(trimmed)}`);
      setEditing(false);
    });
  }

  if (editing) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
        className="w-full max-w-[16rem]"
      >
        <input
          autoFocus
          type="text"
          inputMode="search"
          autoComplete="off"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => {
            if (!value.trim()) setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setValue("");
              setEditing(false);
            }
          }}
          placeholder="search a city"
          disabled={pending}
          className="w-full bg-transparent border-b border-white/30 outline-none text-base font-medium text-white/95 placeholder:text-white/35 focus:border-white/70 transition-colors disabled:opacity-50"
          aria-label="Search for a city"
        />
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setValue(city);
        setEditing(true);
      }}
      className="text-left text-base font-medium text-white/85 hover:text-white transition-colors -mx-1 px-1 rounded hover:bg-white/[0.04]"
      aria-label={`Change city. Currently ${city}.`}
    >
      {city}
      {country ? <span className="text-white/45">, {country}</span> : null}
    </button>
  );
}
