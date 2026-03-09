"use client";

interface FrameworkSentencesProps {
  sentences: string[];
}

export default function FrameworkSentences({
  sentences,
}: FrameworkSentencesProps) {
  if (!sentences || sentences.length === 0) return null;

  return (
    <div className="space-y-3">
      {sentences.map((sentence, i) => (
        <div key={i} className="flex gap-3 items-start">
          <span className="text-accent text-sm mt-0.5 shrink-0">
            {String(i + 1).padStart(2, "0")}
          </span>
          <p className="text-sm text-text-primary leading-relaxed">
            {sentence}
          </p>
        </div>
      ))}
    </div>
  );
}
