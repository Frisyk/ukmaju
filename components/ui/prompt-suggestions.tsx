interface PromptSuggestionsProps {
  label: string
  append: (message: { role: "user"; content: string }) => void
  suggestions: string[]
}

export function PromptSuggestions({
  label,
  append,
  suggestions,
}: PromptSuggestionsProps) {
  return (
    <div className="space-y-8 my-8">
      <h2 className="text-center text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        {label}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => append({ role: "user", content: suggestion })}
            className="group flex h-max flex-1 rounded-xl border border-border/40 bg-background/80 dark:bg-background/20 backdrop-blur-sm p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30 hover:translate-y-[-2px] hover:bg-accent/5 dark:hover:bg-background/30"
          >
            <p className="text-left group-hover:text-primary transition-colors">{suggestion}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
