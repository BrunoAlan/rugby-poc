import { useState, useEffect } from 'react'

interface WeightInputProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}

export default function WeightInput({ value, onChange, disabled }: WeightInputProps) {
  const [localValue, setLocalValue] = useState(value.toString())

  useEffect(() => {
    setLocalValue(value.toString())
  }, [value])

  const handleBlur = () => {
    const numValue = parseFloat(localValue)
    if (!isNaN(numValue)) {
      onChange(numValue)
    } else {
      setLocalValue(value.toString())
    }
  }

  return (
    <input
      type="number"
      step="0.1"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      disabled={disabled}
      className="input w-24 text-center"
    />
  )
}
