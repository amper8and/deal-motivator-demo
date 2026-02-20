import * as React from "react"

const Select = React.forwardRef(({ className = "", value, onValueChange, children, ...props }, ref) => {
  const [isOpen, setIsOpen] = React.useState(false)
  
  const contextValue = {
    value,
    onValueChange: (newValue) => {
      onValueChange && onValueChange(newValue)
      setIsOpen(false)
    },
    isOpen,
    setIsOpen
  }
  
  return (
    <div ref={ref} className={`relative ${className}`} {...props}>
      {React.Children.map(children, child =>
        React.isValidElement(child)
          ? React.cloneElement(child, contextValue)
          : child
      )}
    </div>
  )
})
Select.displayName = "Select"

const SelectTrigger = React.forwardRef(({ className = "", children, isOpen, setIsOpen, ...props }, ref) => {
  const handleClick = () => {
    setIsOpen && setIsOpen(!isOpen)
  }
  
  return (
    <button
      type="button"
      ref={ref}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  )
})
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = React.forwardRef(({ className = "", placeholder = "Select...", value, ...props }, ref) => (
  <span ref={ref} className={className} {...props}>
    {value || placeholder}
  </span>
))
SelectValue.displayName = "SelectValue"

const SelectContent = React.forwardRef(({ className = "", children, isOpen, ...props }, ref) => {
  if (!isOpen) return null
  
  return (
    <div
      ref={ref}
      className={`absolute z-50 mt-1 max-h-[300px] w-full min-w-[8rem] overflow-auto rounded-md border border-gray-200 bg-white shadow-md ${className}`}
      {...props}
    >
      {children}
    </div>
  )
})
SelectContent.displayName = "SelectContent"

const SelectItem = React.forwardRef(({ className = "", value, children, onValueChange, ...props }, ref) => (
  <div
    ref={ref}
    className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100 ${className}`}
    onClick={() => onValueChange && onValueChange(value)}
    {...props}
  >
    {children}
  </div>
))
SelectItem.displayName = "SelectItem"

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
