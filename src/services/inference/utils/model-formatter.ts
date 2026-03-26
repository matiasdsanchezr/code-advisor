export function formatModelName(model: string): string {
  return model
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatProviderName(provider: string): string {
  const map: Record<string, string> = {
    geminiCli: "Gemini CLI",
    genai: "Google GenAI",
    vertex: "Google Vertex",
    nvidiaNim: "NVIDIA NIM",
    openRouter: "OpenRouter",
  };
  return map[provider] || provider;
}
