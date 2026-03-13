export type ActionState<T = void> = {
  data?: T;
  error?: string;
  validationErrors?: Record<string, string[]>;
};
