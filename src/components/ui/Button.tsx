import React from "react"

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline"
}

export default function Button({ children, variant = "primary", ...rest }: ButtonProps) {
  if (variant === "outline") {
    return (
      <button
        {...rest}
        className={`inline-flex shrink-0 items-center justify-center px-4 py-2 rounded-md border text-sm font-medium whitespace-nowrap hover:bg-gray-50 ${rest.className || ""}`.trim()}
        style={{
          borderColor: "var(--primary)",
          color: "var(--primary)",
          ...(rest.style || {}),
        }}
      >
        {children}
      </button>
    )
  }

  return (
    <button
      {...rest}
      className={`inline-flex shrink-0 items-center justify-center px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap text-white hover:opacity-90 ${rest.className || ""}`.trim()}
      style={{ backgroundColor: "var(--primary)", ...(rest.style || {}) }}
    >
      {children}
    </button>
  )
}
