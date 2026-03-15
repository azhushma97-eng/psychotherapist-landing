import { useMutation } from "@tanstack/react-query";
import { api, type CreateAppointmentInput } from "@shared/routes";

export function useCreateAppointment() {
  return useMutation({
    mutationFn: async (data: CreateAppointmentInput) => {
      // Input validation using the shared schema
      const validated = api.appointments.create.input.parse(data);
      
      const res = await fetch(api.appointments.create.path, {
        method: api.appointments.create.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.appointments.create.responses[400].parse(await res.json());
          throw new Error(error.message || "Ошибка валидации");
        }
        throw new Error('Произошла ошибка при отправке. Пожалуйста, попробуйте позже.');
      }
      
      return api.appointments.create.responses[201].parse(await res.json());
    },
  });
}
