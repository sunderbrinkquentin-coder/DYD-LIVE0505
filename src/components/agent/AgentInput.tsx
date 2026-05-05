import React from 'react';

interface AgentInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}

export function AgentInput({ value, onChange, placeholder, type = 'text', disabled }: AgentInputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-4 py-3 rounded-lg text-white text-base focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '2px solid rgba(178, 186, 194, 0.2)',
      }}
      onFocus={(e) => {
        e.target.style.borderColor = '#4ECDC4';
      }}
      onBlur={(e) => {
        e.target.style.borderColor = 'rgba(178, 186, 194, 0.2)';
      }}
    />
  );
}

interface AgentTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export function AgentTextarea({ value, onChange, placeholder, rows = 4 }: AgentTextareaProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-4 py-3 rounded-lg text-white text-base focus:outline-none resize-none transition-all"
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '2px solid rgba(178, 186, 194, 0.2)',
      }}
      onFocus={(e) => {
        e.target.style.borderColor = '#4ECDC4';
      }}
      onBlur={(e) => {
        e.target.style.borderColor = 'rgba(178, 186, 194, 0.2)';
      }}
    />
  );
}

interface AgentSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export function AgentSelect({ value, onChange, options, placeholder }: AgentSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 rounded-lg text-white text-base focus:outline-none transition-all cursor-pointer"
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '2px solid rgba(178, 186, 194, 0.2)',
      }}
      onFocus={(e) => {
        e.target.style.borderColor = '#4ECDC4';
      }}
      onBlur={(e) => {
        e.target.style.borderColor = 'rgba(178, 186, 194, 0.2)';
      }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value} className="bg-dark-card">
          {option.label}
        </option>
      ))}
    </select>
  );
}

interface ChoiceCardProps {
  selected: boolean;
  onClick: () => void;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

export function ChoiceCard({ selected, onClick, label, description, icon }: ChoiceCardProps) {
  return (
    <button
      onClick={onClick}
      className="p-6 rounded-xl transition-all text-left w-full hover:scale-[1.02]"
      style={{
        background: selected ? 'rgba(78, 205, 196, 0.1)' : 'rgba(255, 255, 255, 0.03)',
        border: selected ? '3px solid #4ECDC4' : '2px solid rgba(178, 186, 194, 0.2)',
      }}
    >
      <div className="flex items-start gap-3">
        {icon && <div className="text-primary mt-1">{icon}</div>}
        <div className="flex-1">
          <div className="font-semibold text-white text-base mb-1">{label}</div>
          {description && <div className="text-sm text-gray-400">{description}</div>}
        </div>
      </div>
    </button>
  );
}

interface TagInputProps {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (index: number) => void;
  placeholder?: string;
}

export function TagInput({ tags, onAdd, onRemove, placeholder }: TagInputProps) {
  const [input, setInput] = React.useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      onAdd(input.trim());
      setInput('');
    }
  };

  return (
    <div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-lg text-white text-base focus:outline-none transition-all mb-3"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '2px solid rgba(178, 186, 194, 0.2)',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#4ECDC4';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'rgba(178, 186, 194, 0.2)';
        }}
      />
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
            style={{
              background: 'rgba(78, 205, 196, 0.1)',
              border: '1px solid #4ECDC4',
              color: '#4ECDC4',
            }}
          >
            {tag}
            <button
              onClick={() => onRemove(index)}
              className="hover:text-white transition-colors"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
