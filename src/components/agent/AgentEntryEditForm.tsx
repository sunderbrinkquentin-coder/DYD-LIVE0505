import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { sectionFieldsConfig, FieldConfig } from '../../config/sectionFields';

interface AgentEntryEditFormProps {
  sectionId: string;
  entry: any;
  onSave: (updatedEntry: any) => void;
  onCancel: () => void;
}

export default function AgentEntryEditForm({
  sectionId,
  entry,
  onSave,
  onCancel,
}: AgentEntryEditFormProps) {
  const [formData, setFormData] = useState<any>({ ...entry });
  const [isSaving, setIsSaving] = useState(false);

  const fields = sectionFieldsConfig[sectionId] || [];

  const handleChange = (fieldName: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  const renderField = (field: FieldConfig) => {
    const value = formData[field.name] || '';
    const isDisabled = field.disabledIf && formData[field.disabledIf];

    if (field.type === 'checkbox') {
      return (
        <label
          key={field.name}
          className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-white hover:bg-opacity-5 transition-all"
        >
          <input
            type="checkbox"
            checked={!!formData[field.name]}
            onChange={(e) => handleChange(field.name, e.target.checked)}
            className="w-5 h-5 accent-primary"
          />
          <span className="text-white text-sm">{field.label}</span>
        </label>
      );
    }

    if (field.type === 'select') {
      return (
        <div key={field.name} className="mb-3">
          <label className="block text-xs font-semibold text-text-secondary mb-1.5">
            {field.label}
            {field.required && <span className="text-error ml-1">*</span>}
          </label>
          <select
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            required={field.required}
            className="w-full p-2.5 rounded-lg bg-white bg-opacity-5 border-2 border-transparent focus:border-primary outline-none text-white text-sm transition-all"
          >
            <option value="" className="bg-dark-card">
              Auswählen...
            </option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt} className="bg-dark-card">
                {opt}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (field.type === 'textarea') {
      return (
        <div key={field.name} className="mb-3">
          <label className="block text-xs font-semibold text-text-secondary mb-1.5">
            {field.label}
            {field.required && <span className="text-error ml-1">*</span>}
          </label>
          <textarea
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={field.rows || 3}
            className="w-full p-2.5 rounded-lg bg-white bg-opacity-5 border-2 border-transparent focus:border-primary outline-none text-white text-sm resize-vertical transition-all"
          />
        </div>
      );
    }

    return (
      <div key={field.name} className="mb-3">
        <label className="block text-xs font-semibold text-text-secondary mb-1.5">
          {field.label}
          {field.required && <span className="text-error ml-1">*</span>}
        </label>
        <input
          type={field.type}
          value={value}
          onChange={(e) => handleChange(field.name, e.target.value)}
          placeholder={isDisabled ? 'Heute' : field.placeholder}
          required={field.required && !isDisabled}
          disabled={isDisabled}
          className="w-full p-2.5 rounded-lg bg-white bg-opacity-5 border-2 border-transparent focus:border-primary outline-none text-white text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-white bg-opacity-5 rounded-lg p-4 border-2 border-primary"
    >
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          {fields.map((field) => renderField(field))}

          {sectionId === 'berufserfahrung' && formData.bullets && (
            <div className="mb-3">
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Erfolge / Achievements
              </label>
              <div className="space-y-2">
                {(Array.isArray(formData.bullets) ? formData.bullets : []).map(
                  (bullet: string, index: number) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={bullet}
                        onChange={(e) => {
                          const newBullets = [...(formData.bullets || [])];
                          newBullets[index] = e.target.value;
                          handleChange('bullets', newBullets);
                        }}
                        className="flex-1 p-2 rounded-lg bg-white bg-opacity-5 border-2 border-transparent focus:border-primary outline-none text-white text-sm transition-all"
                        placeholder={`Erfolg ${index + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newBullets = (formData.bullets || []).filter(
                            (_: any, i: number) => i !== index
                          );
                          handleChange('bullets', newBullets);
                        }}
                        className="p-2 rounded-lg bg-error bg-opacity-10 hover:bg-opacity-20 text-error transition-all"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )
                )}
                <button
                  type="button"
                  onClick={() => {
                    const newBullets = [...(formData.bullets || []), ''];
                    handleChange('bullets', newBullets);
                  }}
                  className="w-full p-2 rounded-lg bg-primary bg-opacity-10 border-2 border-primary border-opacity-30 text-primary hover:bg-opacity-20 transition-all text-sm font-semibold"
                >
                  + Erfolg hinzufügen
                </button>
              </div>
            </div>
          )}

          {sectionId === 'berufserfahrung' && formData.erfolge && !formData.bullets && (
            <div className="mb-3">
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Erfolge / Achievements
              </label>
              <textarea
                value={
                  Array.isArray(formData.erfolge)
                    ? formData.erfolge.join('\n')
                    : formData.erfolge
                }
                onChange={(e) => handleChange('erfolge', e.target.value)}
                placeholder="Einer pro Zeile..."
                rows={4}
                className="w-full p-2.5 rounded-lg bg-white bg-opacity-5 border-2 border-transparent focus:border-primary outline-none text-white text-sm resize-vertical transition-all"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 flex items-center justify-center gap-2 p-2.5 bg-primary hover:bg-primary-hover rounded-lg text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Speichern...</span>
              </>
            ) : (
              <>
                <Check size={18} />
                <span>Speichern</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="flex-1 flex items-center justify-center gap-2 p-2.5 bg-white bg-opacity-5 hover:bg-opacity-10 rounded-lg text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X size={18} />
            <span>Abbrechen</span>
          </button>
        </div>
      </form>
    </motion.div>
  );
}
