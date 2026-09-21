import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import TextField from './TextField';

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label: string;
  error?: string | null;
  hint?: string;
}

const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(function PasswordField(props, ref) {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      ref={ref}
      {...props}
      type={visible ? 'text' : 'password'}
      leftIcon={<Lock className="h-4 w-4" />}
      suffix={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="rounded-lg p-2 text-ink-mute hover:bg-pine-50 hover:text-ink"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      }
    />
  );
});

export default PasswordField;
