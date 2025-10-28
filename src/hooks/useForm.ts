import { useState, useCallback, ChangeEvent, FormEvent } from 'react';

interface UseFormOptions<T> {
  initialValues: T;
  onSubmit: (values: T) => Promise<void> | void;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
}

interface UseFormResult<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  loading: boolean;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleSubmit: (e: FormEvent) => Promise<void>;
  setFieldValue: (field: keyof T, value: any) => void;
  setValues: (values: Partial<T>) => void;
  resetForm: () => void;
}

/**
 * Hook customizado para gerenciar formulários
 * 
 * @template T - Tipo dos valores do formulário
 * @param options - Opções do formulário
 * @returns Objeto com valores, erros e handlers
 * 
 * @example
 * const { values, errors, handleChange, handleSubmit } = useForm({
 *   initialValues: { name: '', email: '' },
 *   onSubmit: async (values) => {
 *     await api.post('/users', values);
 *   },
 *   validate: (values) => {
 *     const errors: any = {};
 *     if (!values.name) errors.name = 'Name is required';
 *     return errors;
 *   }
 * });
 */
export function useForm<T extends Record<string, any>>({
  initialValues,
  onSubmit,
  validate,
}: UseFormOptions<T>): UseFormResult<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      const fieldValue =
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

      setValues((prev) => ({
        ...prev,
        [name]: fieldValue,
      }));

      // Limpar erro do campo ao digitar
      if (errors[name as keyof T]) {
        setErrors((prev) => ({
          ...prev,
          [name]: undefined,
        }));
      }
    },
    [errors]
  );

  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      // Validar
      if (validate) {
        const validationErrors = validate(values);
        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors);
          return;
        }
      }

      try {
        setLoading(true);
        setErrors({});
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setLoading(false);
      }
    },
    [values, validate, onSubmit]
  );

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setLoading(false);
  }, [initialValues]);

  const setValuesPartial = useCallback((newValues: Partial<T>) => {
    setValues((prev) => ({
      ...prev,
      ...newValues,
    }));
  }, []);

  return {
    values,
    errors,
    loading,
    handleChange,
    handleSubmit,
    setFieldValue,
    setValues: setValuesPartial,
    resetForm,
  };
}
