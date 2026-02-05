import React from "react"

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline"
}

export default function Button({ children, variant = "primary", ...rest }: ButtonProps) {
  if (variant === "outline") {
    return (
      <button
        {...rest}
        className={`px-4 py-2 rounded-md border text-sm font-medium hover:bg-gray-50 ${rest.className || ""}`.trim()}
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
      className={`px-4 py-2 rounded-md text-sm font-medium text-white hover:opacity-90 ${rest.className || ""}`.trim()}
      style={{ backgroundColor: "var(--primary)", ...(rest.style || {}) }}
    >
      {children}
    </button>
  )
}
