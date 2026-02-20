// UI Components and Icons
const { useState, useEffect, useMemo, useRef } = React;
const { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid } = Recharts;

// Card Components
window.Card = ({ children, className = '' }) => React.createElement('div', { className: `rounded-lg border bg-card text-card-foreground shadow-sm ${className}` }, children);
window.CardHeader = ({ children, className = '' }) => React.createElement('div', { className: `flex flex-col space-y-1.5 p-6 ${className}` }, children);
window.CardTitle = ({ children, className = '' }) => React.createElement('h3', { className: `text-2xl font-semibold leading-none tracking-tight ${className}` }, children);
window.CardDescription = ({ children, className = '' }) => React.createElement('p', { className: `text-sm text-muted-foreground ${className}` }, children);
window.CardContent = ({ children, className = '' }) => React.createElement('div', { className: `p-6 pt-0 ${className}` }, children);

// Button Component
window.Button = ({ children, onClick, disabled = false, variant = 'default', size = 'default', className = '' }) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  const variantStyles = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    link: 'underline-offset-4 hover:underline text-primary'
  };
  const sizeStyles = { default: 'h-10 py-2 px-4', sm: 'h-9 px-3 rounded-md', lg: 'h-11 px-8 rounded-md', icon: 'h-10 w-10' };
  return React.createElement('button', { onClick, disabled, className: `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}` }, children);
};

// Input & Textarea
window.Input = ({ value, onChange, disabled = false, type = 'text', placeholder = '', className = '' }) =>
  React.createElement('input', { type, value, onChange, disabled, placeholder, className: `flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}` });

window.Textarea = ({ value, onChange, disabled = false, rows = 3, placeholder = '', className = '' }) =>
  React.createElement('textarea', { value, onChange, disabled, rows, placeholder, className: `flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}` });

// Badge
window.Badge = ({ children, variant = 'default', className = '' }) => {
  const variantStyles = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/80',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/80',
    outline: 'text-foreground border border-input'
  };
  return React.createElement('div', { className: `inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variantStyles[variant]} ${className}` }, children);
};

// Tabs
window.Tabs = ({ children, defaultValue, className = '' }) => {
  const [value, setValue] = useState(defaultValue || '');
  return React.createElement('div', { className }, React.Children.map(children, child => React.isValidElement(child) ? React.cloneElement(child, { value, setValue }) : child));
};
window.TabsList = ({ children, className = '', setValue }) =>
  React.createElement('div', { className: `inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground ${className}` }, React.Children.map(children, child => React.isValidElement(child) ? React.cloneElement(child, { setValue }) : child));
window.TabsTrigger = ({ children, value: tabValue, className = '', setValue }) =>
  React.createElement('button', { onClick: () => setValue && setValue(tabValue), className: `inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${className}` }, children);
window.TabsContent = ({ children, value: tabValue, className = '' }) =>
  React.createElement('div', { className: `mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}` }, children);

// Select
window.Select = ({ children, value, onValueChange, className = '' }) => {
  const [open, setOpen] = useState(false);
  return React.createElement('div', { className: `relative ${className}` }, React.Children.map(children, child => React.isValidElement(child) ? React.cloneElement(child, { value, onValueChange, open, setOpen }) : child));
};
window.SelectTrigger = ({ children, disabled = false, setOpen, className = '' }) =>
  React.createElement('button', { onClick: () => setOpen && setOpen(o => !o), disabled, className: `flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}` }, children);
window.SelectValue = ({ placeholder, value }) => React.createElement('span', {}, value || placeholder);
window.SelectContent = ({ children, open, setOpen, onValueChange }) =>
  !open ? null : React.createElement('div', { className: 'absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80' },
    React.createElement('div', { className: 'p-1' }, React.Children.map(children, child => React.isValidElement(child) ? React.cloneElement(child, { onValueChange, setOpen }) : child)));
window.SelectItem = ({ children, value, onValueChange, setOpen }) =>
  React.createElement('div', { onClick: () => { onValueChange && onValueChange(value); setOpen && setOpen(false); }, className: 'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground' }, children);

// Other Components
window.Separator = ({ className = '' }) => React.createElement('div', { className: `shrink-0 bg-border h-[1px] w-full ${className}` });
window.Progress = ({ value = 0, className = '' }) =>
  React.createElement('div', { className: `relative h-4 w-full overflow-hidden rounded-full bg-secondary ${className}` },
    React.createElement('div', { className: 'h-full w-full flex-1 bg-primary transition-all', style: { transform: `translateX(-${100 - (value || 0)}%)` } }));
window.Switch = ({ checked = false, onCheckedChange, disabled = false, className = '' }) =>
  React.createElement('button', { type: 'button', role: 'switch', 'aria-checked': checked, onClick: () => onCheckedChange && onCheckedChange(!checked), disabled, className: `peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-primary' : 'bg-input'} ${className}` },
    React.createElement('span', { className: `pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}` }));

// Alert
window.Alert = ({ children, className = '' }) =>
  React.createElement('div', { className: `relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground ${className}` }, children);
window.AlertTitle = ({ children, className = '' }) =>
  React.createElement('h5', { className: `mb-1 font-medium leading-none tracking-tight ${className}` }, children);
window.AlertDescription = ({ children, className = '' }) =>
  React.createElement('div', { className: `text-sm [&_p]:leading-relaxed ${className}` }, children);

// Icons as simple functions returning SVG elements
window.CheckCircle2 = ({className = "h-4 w-4"}) => React.createElement('svg', { className, xmlns: 'http://www.w3.org/2000/svg', width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }, React.createElement('circle', { cx: '12', cy: '12', r: '10' }), React.createElement('path', { d: 'm9 12 2 2 4-4' }));
window.CircleAlert = ({className = "h-4 w-4"}) => React.createElement('svg', { className, xmlns: 'http://www.w3.org/2000/svg', width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }, React.createElement('circle', { cx: '12', cy: '12', r: '10' }), React.createElement('line', { x1: '12', x2: '12', y1: '8', y2: '12' }), React.createElement('line', { x1: '12', x2: '12.01', y1: '16', y2: '16' }));
window.Clock = ({className = "h-4 w-4"}) => React.createElement('svg', { className, xmlns: 'http://www.w3.org/2000/svg', width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }, React.createElement('circle', { cx: '12', cy: '12', r: '10' }), React.createElement('polyline', { points: '12 6 12 12 16 14' }));
window.FileText = ({className = "h-4 w-4"}) => React.createElement('svg', { className, xmlns: 'http://www.w3.org/2000/svg', width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }, React.createElement('path', { d: 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z' }), React.createElement('path', { d: 'M14 2v4a2 2 0 0 0 2 2h4' }), React.createElement('path', { d: 'M10 9H8' }), React.createElement('path', { d: 'M16 13H8' }), React.createElement('path', { d: 'M16 17H8' }));
window.Mail = ({className = "h-4 w-4"}) => React.createElement('svg', { className, xmlns: 'http://www.w3.org/2000/svg', width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }, React.createElement('rect', { width: '20', height: '16', x: '2', y: '4', rx: '2' }), React.createElement('path', { d: 'm22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7' }));
window.Play = ({className = "h-4 w-4"}) => React.createElement('svg', { className, xmlns: 'http://www.w3.org/2000/svg', width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }, React.createElement('polygon', { points: '6 3 20 12 6 21 6 3' }));
window.Pause = ({className = "h-4 w-4"}) => React.createElement('svg', { className, xmlns: 'http://www.w3.org/2000/svg', width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }, React.createElement('rect', { x: '14', y: '4', width: '4', height: '16', rx: '1' }), React.createElement('rect', { x: '6', y: '4', width: '4', height: '16', rx: '1' }));
window.RefreshCw = ({className = "h-4 w-4"}) => React.createElement('svg', { className, xmlns: 'http://www.w3.org/2000/svg', width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }, React.createElement('path', { d: 'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8' }), React.createElement('path', { d: 'M21 3v5h-5' }), React.createElement('path', { d: 'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16' }), React.createElement('path', { d: 'M8 16H3v5' }));
window.ShieldCheck = ({className = "h-4 w-4"}) => React.createElement('svg', { className, xmlns: 'http://www.w3.org/2000/svg', width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }, React.createElement('path', { d: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z' }), React.createElement('path', { d: 'm9 12 2 2 4-4' }));
window.Sparkles = ({className = "h-4 w-4"}) => React.createElement('svg', { className, xmlns: 'http://www.w3.org/2000/svg', width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }, React.createElement('path', { d: 'M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z' }), React.createElement('path', { d: 'M20 3v4' }), React.createElement('path', { d: 'M22 5h-4' }), React.createElement('path', { d: 'M4 17v2' }), React.createElement('path', { d: 'M5 18H3' }));
window.Upload = ({className = "h-4 w-4"}) => React.createElement('svg', { className, xmlns: 'http://www.w3.org/2000/svg', width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }, React.createElement('path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }), React.createElement('polyline', { points: '17 8 12 3 7 8' }), React.createElement('line', { x1: '12', x2: '12', y1: '3', y2: '15' }));
window.Wand2 = ({className = "h-4 w-4"}) => React.createElement('svg', { className, xmlns: 'http://www.w3.org/2000/svg', width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }, React.createElement('path', { d: 'm21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72' }), React.createElement('path', { d: 'm14 7 3 3' }), React.createElement('path', { d: 'M5 6v4' }), React.createElement('path', { d: 'M19 14v4' }), React.createElement('path', { d: 'M10 2v2' }), React.createElement('path', { d: 'M7 8H3' }), React.createElement('path', { d: 'M21 16h-4' }), React.createElement('path', { d: 'M11 3H9' }));
window.ChevronDown = ({className = "h-4 w-4"}) => React.createElement('svg', { className, xmlns: 'http://www.w3.org/2000/svg', width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }, React.createElement('path', { d: 'm6 9 6 6 6-6' }));
window.ChevronUp = ({className = "h-4 w-4"}) => React.createElement('svg', { className, xmlns: 'http://www.w3.org/2000/svg', width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }, React.createElement('path', { d: 'm18 15-6-6-6 6' }));
window.ChevronLeft = ({className = "h-4 w-4"}) => React.createElement('svg', { className, xmlns: 'http://www.w3.org/2000/svg', width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }, React.createElement('path', { d: 'm15 18-6-6 6-6' }));
window.ChevronRight = ({className = "h-4 w-4"}) => React.createElement('svg', { className, xmlns: 'http://www.w3.org/2000/svg', width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }, React.createElement('path', { d: 'm9 18 6-6-6-6' }));
window.ListOrdered = ({className = "h-4 w-4"}) => React.createElement('svg', { className, xmlns: 'http://www.w3.org/2000/svg', width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }, React.createElement('line', { x1: '10', x2: '21', y1: '6', y2: '6' }), React.createElement('line', { x1: '10', x2: '21', y1: '12', y2: '12' }), React.createElement('line', { x1: '10', x2: '21', y1: '18', y2: '18' }), React.createElement('path', { d: 'M4 6h1v4' }), React.createElement('path', { d: 'M4 10h2' }), React.createElement('path', { d: 'M6 18H4c0-1 2-2 2-3s-1-1.5-2-1' }));

console.log('✓ Components loaded');
