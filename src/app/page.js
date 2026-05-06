"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";

export default function Home() {
  const [form, setForm] = useState({
    name: "",
    department: "",
    institute: "",
    phone: "",
    email: "",
    photoBase64: "",
  });
  const [photoPreview, setPhotoPreview] = useState("");
  const [submittedCard, setSubmittedCard] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const cardRef = useRef(null);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const imageData = String(reader.result || "");
      setPhotoPreview(imageData);
      setForm((prev) => ({ ...prev, photoBase64: imageData }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (
      !form.name.trim() ||
      !form.department.trim() ||
      !form.institute.trim() ||
      !form.phone.trim() ||
      !form.email.trim() ||
      !form.photoBase64
    ) {
      setError("Please fill all fields and choose a photo.");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmittedCard({
        id: "Processing...",
        name: form.name.trim(),
        department: form.department.trim(),
        institute: form.institute.trim(),
        photoBase64: form.photoBase64,
      });

      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          department: form.department.trim(),
          institute: form.institute.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          photoBase64: form.photoBase64,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Submission failed");
      }

      setSubmittedCard(result.record);
      setForm({
        name: "",
        department: "",
        institute: "",
        phone: "",
        email: "",
        photoBase64: "",
      });
      setPhotoPreview("");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadCard = async () => {
    if (!cardRef.current || !submittedCard) {
      return;
    }

    try {
      const images = Array.from(cardRef.current.querySelectorAll("img"));
      await Promise.all(
        images.map((image) => {
          if (image.complete && image.naturalWidth > 0) {
            return Promise.resolve();
          }

          return new Promise((resolve, reject) => {
            const handleLoad = () => resolve();
            const handleError = () => reject(new Error("Card image asset failed to load."));

            image.addEventListener("load", handleLoad, { once: true });
            image.addEventListener("error", handleError, { once: true });
          });
        })
      );

      const dataUrl = await toPng(cardRef.current, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        cacheBust: true,
        style: {
          transform: "scale(1)",
        },
      });
      const link = document.createElement("a");
      link.download = `${submittedCard.id}-card.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error while generating card image.";
      console.error("Error generating image", errorMessage, err);
      setError("Failed to download card. Please try again.");
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 p-4 sm:gap-6 sm:p-6 md:p-10">
      <h1 className="text-xl font-bold tracking-wide text-zinc-900 sm:text-2xl">
        এক্সাম এ ধরা রেফার্ড কার্ড এ ভরসা
      </h1>
      <p className="text-xs text-zinc-600 sm:text-sm">
        Form submit করলে data Excel ফাইলে save হবে, এবং card download করা যাবে।
      </p>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-white/70 bg-white/80 p-4 shadow-[0_12px_30px_rgba(99,102,241,0.12)] backdrop-blur sm:p-5"
        >
          <div className="space-y-1">
            <label htmlFor="name" className="text-sm font-medium text-zinc-700">
              Name
            </label>
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              placeholder="Enter full name"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="department" className="text-sm font-medium text-zinc-700">
              Department
            </label>
            <input
              id="department"
              name="department"
              value={form.department}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              placeholder="Enter department name"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="institute" className="text-sm font-medium text-zinc-700">
              Institute
            </label>
            <input
              id="institute"
              name="institute"
              value={form.institute}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              placeholder="Enter institute name"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="phone" className="text-sm font-medium text-zinc-700">
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              value={form.phone}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              placeholder="Enter phone number"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-zinc-700">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              placeholder="Enter email address"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="photo" className="text-sm font-medium text-zinc-700">
              Photo
            </label>
            <input
              id="photo"
              name="photo"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm"
            />
          </div>

          {photoPreview ? (
            <img
              src={photoPreview}
              alt="Preview"
              className="h-24 w-24 rounded-lg border border-zinc-200 object-cover"
            />
          ) : null}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 font-semibold text-white shadow-lg shadow-violet-200 transition hover:brightness-110 disabled:cursor-not-allowed disabled:from-zinc-400 disabled:to-zinc-400"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </form>

        {submittedCard ? <section className="space-y-4">
          <div className="flex justify-center rounded-2xl border border-white/70 bg-white/70 p-3 shadow-[0_12px_30px_rgba(99,102,241,0.12)] backdrop-blur sm:p-6">
            <div
              ref={cardRef}
              className="relative flex aspect-[8/5] w-full max-w-[400px] flex-col overflow-hidden border border-violet-100 bg-white shadow-[0_14px_28px_rgba(109,40,217,0.2)]"
            >
                <div className="flex h-full flex-col">
                {/* Card Header */}
                <div className="flex items-center justify-between border-b border-violet-100 bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-2 sm:px-4 sm:py-3">
                  <div className="flex h-8 w-8 items-center justify-center sm:h-10 sm:w-10">
                      <img
                        src="/odc-logo.png"
                        alt="ODC Logo"
                        className="h-full w-full object-contain"
                      />
                  </div>
                  <div className="flex-1 text-right leading-tight">
                    <h2 className="text-sm font-black uppercase tracking-wider text-white drop-shadow-sm sm:text-lg">
                      REFARD CARD
                    </h2>
                  </div>
                </div>

                {/* Card Body */}
                  <div className="flex flex-1 items-center gap-3 px-3 sm:gap-5 sm:px-6">
                  {/* Photo */}
                  <div className="shrink-0">
                    <img
                      src={submittedCard.photoUrl || submittedCard.photoBase64}
                      alt={submittedCard.name}
                      className="h-[90px] w-[72px] rounded border-2 border-violet-100 object-cover shadow-sm sm:h-[120px] sm:w-[95px]"
                    />
                  </div>

                    {/* Details */}
                    <div className="flex flex-col justify-center">
                      <h3 className="mb-1 line-clamp-2 text-sm font-bold leading-tight text-zinc-900 sm:text-lg">
                        {submittedCard.name}
                      </h3>
                      <p className="line-clamp-1 text-xs font-medium leading-snug text-zinc-700 sm:text-sm">
                        {submittedCard.department}
                      </p>
                      <p className="mb-2 line-clamp-1 text-xs leading-snug text-zinc-600 sm:text-sm">
                        {submittedCard.institute}
                      </p>
                      <p className="text-xs text-zinc-800 sm:text-sm">
                        <span className="font-semibold">Id:</span> {submittedCard.id}
                      </p>
                    </div>
                  </div>
                </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={downloadCard}
              disabled={!submittedCard || isSubmitting}
              className="rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:brightness-110 disabled:cursor-not-allowed disabled:from-blue-300 disabled:to-blue-300"
            >
              {isSubmitting ? "Please wait..." : "Download Card"}
            </button>

          </div>
        </section> : null}
      </div>
    </main>
  );
}
