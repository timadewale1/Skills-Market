type ButtonProps = {
  children: React.ReactNode
  variant?: "primary" | "outline"
  onClick?: () => void
}

export default function Button({
  children,
  variant = "primary",
  onClick,
}: ButtonProps) {
  if (variant === "outline") {
    return (
      <button
        onClick={onClick}
        className="px-4 py-2 rounded-md border text-sm font-medium hover:bg-gray-50"
        style={{
          borderColor: "var(--primary)",
          color: "var(--primary)",
        }}
      >
        {children}
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-md text-sm font-medium text-white hover:opacity-90"
      style={{ backgroundColor: "var(--primary)" }}
    >
      {children}
    </button>
  )
}
