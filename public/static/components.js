// Simplified UI Components Library for the Deal Motivation Demo
import React from 'react';

// Card Components
export const Card: React.FC<{children: React.ReactNode; className?: string}> = ({ children, className = '' }) => (
  <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}>
    {children}
  </div>
);

export const CardHeader: React.FC<{children: React.ReactNode; className?: string}> = ({ children, className = '' }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>
);

export const CardTitle: React.FC<{children: React.ReactNode; className?: string}> = ({ children, className = '' }) => (
  <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`}>{children}</h3>
);

export const CardDescription: React.FC<{children: React.ReactNode; className?: string}> = ({ children, className = '' }) => (
  <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>
);

export const CardContent: React.FC<{children: React.ReactNode; className?: string}> = ({ children, className = '' }) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
);

// Button Component
export const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}> = ({ children, onClick, disabled = false, variant = 'default', size = 'default', className = '' }) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variantStyles = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    link: 'underline-offset-4 hover:underline text-primary'
  };
  
  const sizeStyles = {
    default: 'h-10 py-2 px-4',
    sm: 'h-9 px-3 rounded-md',
    lg: 'h-11 px-8 rounded-md',
    icon: 'h-10 w-10'
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </button>
  );
};

// Input Component
export const Input: React.FC<{
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  type?: string;
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, disabled = false, type = 'text', placeholder = '', className = '' }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    disabled={disabled}
    placeholder={placeholder}
    className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
  />
);

// Textarea Component
export const Textarea: React.FC<{
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  rows?: number;
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, disabled = false, rows = 3, placeholder = '', className = '' }) => (
  <textarea
    value={value}
    onChange={onChange}
    disabled={disabled}
    rows={rows}
    placeholder={placeholder}
    className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
  />
);

// Badge Component
export const Badge: React.FC<{
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
}> = ({ children, variant = 'default', className = '' }) => {
  const variantStyles = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/80',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/80',
    outline: 'text-foreground border border-input'
  };
  
  return (
    <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variantStyles[variant]} ${className}`}>
      {children}
    </div>
  );
};

// Tabs Components
export const Tabs: React.FC<{children: React.ReactNode; defaultValue?: string; className?: string}> = ({ children, defaultValue, className = '' }) => {
  const [value, setValue] = React.useState(defaultValue || '');
  
  return (
    <div className={className} data-tabs-value={value}>
      {React.Children.map(children, child => 
        React.isValidElement(child) ? React.cloneElement(child, { value, setValue } as any) : child
      )}
    </div>
  );
};

export const TabsList: React.FC<{children: React.ReactNode; className?: string; setValue?: any}> = ({ children, className = '', setValue }) => (
  <div className={`inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground ${className}`}>
    {React.Children.map(children, child =>
      React.isValidElement(child) ? React.cloneElement(child, { setValue } as any) : child
    )}
  </div>
);

export const TabsTrigger: React.FC<{children: React.ReactNode; value: string; className?: string; setValue?: any}> = ({ children, value, className = '', setValue }) => (
  <button
    onClick={() => setValue && setValue(value)}
    className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm ${className}`}
  >
    {children}
  </button>
);

export const TabsContent: React.FC<{children: React.ReactNode; value: string; className?: string}> = ({ children, value: tabValue, className = '' }) => (
  <div className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}>
    {children}
  </div>
);

// Select Components
export const Select: React.FC<{
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}> = ({ children, value, onValueChange, className = '' }) => {
  const [open, setOpen] = React.useState(false);
  
  return (
    <div className={`relative ${className}`}>
      {React.Children.map(children, child =>
        React.isValidElement(child) ? React.cloneElement(child, { value, onValueChange, open, setOpen } as any) : child
      )}
    </div>
  );
};

export const SelectTrigger: React.FC<{
  children: React.ReactNode;
  disabled?: boolean;
  value?: string;
  setOpen?: any;
  className?: string;
}> = ({ children, disabled = false, setOpen, className = '' }) => (
  <button
    onClick={() => setOpen && setOpen((o: boolean) => !o)}
    disabled={disabled}
    className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
  >
    {children}
  </button>
);

export const SelectValue: React.FC<{placeholder?: string; value?: string}> = ({ placeholder, value }) => (
  <span>{value || placeholder}</span>
);

export const SelectContent: React.FC<{
  children: React.ReactNode;
  open?: boolean;
  setOpen?: any;
  onValueChange?: any;
}> = ({ children, open, setOpen, onValueChange }) => {
  if (!open) return null;
  
  return (
    <div className="absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80">
      <div className="p-1">
        {React.Children.map(children, child =>
          React.isValidElement(child) ? React.cloneElement(child, { onValueChange, setOpen } as any) : child
        )}
      </div>
    </div>
  );
};

export const SelectItem: React.FC<{
  children: React.ReactNode;
  value: string;
  onValueChange?: any;
  setOpen?: any;
}> = ({ children, value, onValueChange, setOpen }) => (
  <div
    onClick={() => {
      onValueChange && onValueChange(value);
      setOpen && setOpen(false);
    }}
    className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
  >
    {children}
  </div>
);

// Separator Component
export const Separator: React.FC<{className?: string}> = ({ className = '' }) => (
  <div className={`shrink-0 bg-border h-[1px] w-full ${className}`} />
);

// Progress Component
export const Progress: React.FC<{value?: number; className?: string}> = ({ value = 0, className = '' }) => (
  <div className={`relative h-4 w-full overflow-hidden rounded-full bg-secondary ${className}`}>
    <div
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </div>
);

// Switch Component
export const Switch: React.FC<{
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}> = ({ checked = false, onCheckedChange, disabled = false, className = '' }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onCheckedChange && onCheckedChange(!checked)}
    disabled={disabled}
    className={`peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-primary' : 'bg-input'} ${className}`}
  >
    <span
      className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
    />
  </button>
);

// Alert Components
export const Alert: React.FC<{children: React.ReactNode; className?: string}> = ({ children, className = '' }) => (
  <div className={`relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground ${className}`}>
    {children}
  </div>
);

export const AlertTitle: React.FC<{children: React.ReactNode; className?: string}> = ({ children, className = '' }) => (
  <h5 className={`mb-1 font-medium leading-none tracking-tight ${className}`}>{children}</h5>
);

export const AlertDescription: React.FC<{children: React.ReactNode; className?: string}> = ({ children, className = '' }) => (
  <div className={`text-sm [&_p]:leading-relaxed ${className}`}>{children}</div>
);
