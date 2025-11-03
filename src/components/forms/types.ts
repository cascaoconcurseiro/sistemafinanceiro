/**
 * 🔧 TIPOS COMPARTILHADOS PARA FORMULÁRIOS
 */

export interface FormProps<T = any> {
  initialData?: T;
  onSubmit: (data: T) => Promise<void> | void;
  onCancel?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState<T = any> {
  data: T;
  errors: ValidationError[];
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
}
