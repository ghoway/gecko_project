import { forwardRef } from 'react'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type = 'text', ...props }, ref) => {
    const baseClasses = 'flex h-10 w-full rounded-lg border border-gray-300 bg-white/50 backdrop-blur-sm px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

    return (
      <input
        type={type}
        className={`${baseClasses} ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }