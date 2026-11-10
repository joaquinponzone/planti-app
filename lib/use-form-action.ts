import { useActionState } from "react"

export type SubmittedValues = Partial<Record<string, string>>

/**
 * `useActionState` que además recuerda lo que se mandó.
 *
 * React 19 resetea un `<form action={...}>` cuando termina la acción, haya
 * salido bien o con error. Con error, los campos vuelven a su `defaultValue` y
 * se pierde lo que la persona escribió (el mensaje dice "Peligro tiene que
 * tener más días que Aviso" y los campos ya muestran lo guardado).
 *
 * El reset usa el `defaultValue` del render que corre al terminar la acción,
 * así que alcanza con devolver lo enviado y usarlo como `defaultValue`:
 * `defaultValue={values.email ?? ""}`.
 *
 * Sólo se guardan los campos de `keep`. Nunca una contraseña: terminaría
 * escrita en el DOM como atributo `value`.
 */
export function useFormAction<S>(
  action: (prev: S, formData: FormData) => Promise<S>,
  initialState: S,
  keep: readonly string[],
) {
  const [[state, values], formAction, pending] = useActionState(
    async ([prev]: [S, SubmittedValues], formData: FormData): Promise<[S, SubmittedValues]> => {
      const submitted: SubmittedValues = {}
      for (const name of keep) {
        const value = formData.get(name)
        if (typeof value === "string") submitted[name] = value
      }
      return [await action(prev, formData), submitted]
    },
    [initialState, {}],
  )
  return [state, formAction, values, pending] as const
}
