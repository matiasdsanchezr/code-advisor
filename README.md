# Code Advisor

Una aplicación web para analizar código fuente utilizando Grandes Modelos de Lenguaje (LLMs) y generar sugerencias. Permite a los desarrolladores seleccionar archivos de un proyecto local, formular una pregunta o tarea, y obtener una respuesta generada por una IA que tiene el contexto completo de los archivos seleccionados.

## Características Principales

- **Explorador de Archivos:** Navega por la estructura de directorios de un proyecto local y selecciona los archivos relevantes para el análisis.
- **Constructor de Prompts:** Combina automáticamente el contenido de los archivos seleccionados con la consulta del usuario para crear un prompt completo y contextualizado.
- **Soporte Multi-proveedor:** Configurable para usar diferentes proveedores de IA como Google (GenAI, Vertex AI), OpenRouter y NVIDIA NIM.
- **Interfaz Intuitiva:** Un flujo de trabajo de dos pasos que guía al usuario desde la selección de archivos hasta la obtención de la respuesta de la IA.
- **Gestión de Estado:** Guarda la selección de archivos y la consulta en `localStorage` para persistir el estado entre sesiones.

## Flujo de Trabajo y Beneficios Clave

A diferencia de otros enfoques que dependen de que el LLM llame `tools` o `agents` externos para leer archivos, Code Advisor adopta una estrategia más directa y eficiente:

1.  **Lectura Local Primero:** La aplicación lee el contenido de los archivos seleccionados directamente desde el sistema de archivos del servidor (definido en `TARGET_PROJECT_PATH`).
2.  **Construcción de Contexto Completo:** Todo el código fuente se inyecta en el `<context>` del prompt _antes_ de enviarlo al LLM.

Este enfoque "in-context" ofrece beneficios significativos:

- **Mayor Velocidad y Eficiencia:** Se elimina la latencia de las llamadas de ida y vuelta que el LLM tendría que hacer para recuperar cada archivo. La respuesta es más rápida ya que el modelo tiene toda la información desde el primer momento.
- **Máxima Compatibilidad:** El prompt generado es puro texto. Puede ser utilizado con **cualquier** Gran Modelo de Lenguaje que admita un contexto extenso, sin necesidad de que el modelo sea compatible con funciones de `tool-calling` o `agents`.
- **Portabilidad y Flexibilidad (No-BYOK):** El usuario puede simplemente copiar el prompt generado y pegarlo en la interfaz web de su LLM preferido (como ChatGPT, Gemini, Claude, etc.). Esto evita la necesidad de configurar una API key en la aplicación (`Bring Your Own Key`), permitiendo usar suscripciones existentes o servicios gratuitos sin comprometer la seguridad de las claves.

## Tecnologías Utilizadas

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/)
- **UI:** [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [Shadcn/ui](https://ui.shadcn.com/), [Radix UI](https://www.radix-ui.com/)
- **Lógica de Backend:** Next.js Server Actions
- **Integraciones IA:** `@google/genai`, `openai`
- **Validación:** [Zod](https://zod.dev/)

---

## Instalación y Uso Local

Sigue estos pasos para configurar y ejecutar el proyecto en tu máquina local.

### 1. Prerrequisitos

- [Node.js](https://nodejs.org/) (versión 20.x o superior)
- `npm`, `yarn` o `pnpm` como gestor de paquetes.

### 2. Clonar el Repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd code-advisor
```

### 3. Instalar Dependencias

Instala todas las dependencias del proyecto usando tu gestor de paquetes preferido.

```bash
npm install
```

### 4. Configuración del Entorno

Este proyecto requiere variables de entorno para funcionar correctamente, especialmente para la conexión con los servicios de IA y para saber qué proyecto analizar.

Crea un archivo llamado `.env.local` en la raíz del proyecto y copia el siguiente contenido.

```ini
# .env.local

# 1. Ruta al proyecto que deseas analizar.
#    Debe ser una ruta absoluta en tu sistema.
#    Ejemplo en macOS/Linux: TARGET_PROJECT_PATH=/Users/tu-usuario/proyectos/mi-proyecto
#    Ejemplo en Windows: TARGET_PROJECT_PATH=C:\Users\tu-usuario\proyectos\mi-proyecto
TARGET_PROJECT_PATH=

# 2. Proveedor de IA a utilizar.
#    Opciones válidas: "genai", "vertex", "open-router", "nvidia-nim" o "gemini-cli"
#    Gemini-cli requiere estar instalado en el sistema y poseer un metodo de autenticación valido
AI_PROVIDER=

# 3. Modelo específico a usar del proveedor.
#    Ejemplo para "genai": "gemini-3.0-pro-preview"
#    Ejemplo para "open-router": "deepseek/deepseek-chat-v3.1:free"
MODEL=

# 4. API Keys (solo necesitas la del proveedor que vayas a usar).
GENAI_API_KEY=
VERTEX_API_KEY=
OPEN_ROUTER_API_KEY=
NVIDIA_NIM_API_KEY=
```

**Importante:**

- Rellena `TARGET_PROJECT_PATH` con la ruta **absoluta** al directorio del código fuente que quieres que la aplicación pueda leer.
- Elige un `AI_PROVIDER` y un `MODEL` compatible.
- Añade la `API Key` correspondiente al proveedor que has seleccionado.

### 5. Ejecutar la Aplicación

Una vez configurado el entorno, inicia el servidor de desarrollo.

```bash
npm run dev
```

La aplicación estará disponible por defecto en [http://127.0.0.1:3000](http://127.0.0.1:3000).
Establece una variable de entorno `PORT` para cambiar de puerto

## Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo.
- `npm run build`: Compila la aplicación para producción.
- `npm run start`: Ejecuta el servidor de producción después de compilar.
- `npm run lint`: Ejecuta el linter de ESLint para analizar el código.

## TODO
- Agregar compatibilidad para archivos con extensiónes no usan
- Agregar capacidad para conversaciones multimodales