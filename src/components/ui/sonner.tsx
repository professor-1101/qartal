"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "#fff",
          "--normal-text": "#222",
          "--normal-border": "#e5e7eb",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
