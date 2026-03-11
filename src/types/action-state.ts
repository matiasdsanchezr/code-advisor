export type ActionState<T> = {
  success: boolean;
  message: string;
  timestamp: number;
  errors?: Record<string, string[]>;
  data?: T;
};

/** Estado inicial de un form action. El campo timestamp se usa para detectar cambios de estado */
export const EMPTY_ACTION_STATE: ActionState<unknown> = {
  success: false,
  message: "",
  errors: {},
  timestamp: 0,
};
