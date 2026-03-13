export const buildPrompt = (
  systemPrompt: string,
  userInput: string,
  joinedsourceCode: string
) => `
Usa la siguiente información contextual para responder

<context>
${joinedsourceCode}
</context>

---

## Instrucciones
<system_instructions>
${systemPrompt}
</system_instructions>

## TAREA
Llevar a cabo la siguiente tarea
<task>
${userInput}
</task>`;
