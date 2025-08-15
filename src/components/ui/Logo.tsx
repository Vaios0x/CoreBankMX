import React from 'react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  className?: string
}

export function Logo({ size = 'md', showText = false, className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-20 w-20',
    md: 'h-30 w-30',
    lg: 'h-40 w-40',
    xl: 'h-60 w-60'
  }

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  }

  if (showText) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <img 
          src="/src/assets/Logo2.svg" 
          alt="Banobs Logo" 
          className={sizeClasses[size]}
        />
        <span className={`font-semibold tracking-tight ${textSizeClasses[size]}`}>
          Banobs
        </span>
      </div>
    )
  }

  return (
    <img 
      src="/src/assets/Logo2.svg" 
      alt="Banobs Logo" 
      className={`${sizeClasses[size]} ${className}`}
    />
  )
}

export default Logo
