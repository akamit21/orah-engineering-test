import { useState, useEffect } from "react"

export const useDebounce = (value: string, milliSeconds: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), milliSeconds || 1000)

    return () => {
      clearTimeout(timer)
    }
  }, [value, milliSeconds])

  return debouncedValue
}
