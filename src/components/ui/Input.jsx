import { forwardRef } from 'react';

const Input = forwardRef(function Input({ 
  label, 
  error, 
  success, 
  icon: Icon, 
  type = 'text', 
  className = '', 
  labelClassName = '',
  containerClassName = '',
  ...props 
}, ref) {
  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label className={`input-label ${labelClassName}`}>
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={`
            input
            ${Icon ? 'pl-11' : ''}
            ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/30 bg-red-50/50' : ''}
            ${success ? 'border-green-400 focus:border-green-500 focus:ring-green-500/30 bg-green-50/50' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
        {success && !error && (
          <p className="mt-1.5 text-xs text-green-600 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {success}
          </p>
        )}
      </div>
    </div>
  );
});

export default Input;
