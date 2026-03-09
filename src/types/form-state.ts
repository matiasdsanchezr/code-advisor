export type FormState = {
  success: boolean;
  message: string;
  timestamp: number;
  fieldErrors?: Record<string, string[]>;
  data?: unknown;
};

/** Estado inicial de un form action. El campo timestamp se usa para detectar cambios en el estado */
export const EMPTY_FORM_STATE: FormState = {
  success: false,
  message: "",
  fieldErrors: {},
  timestamp: 0,
};
