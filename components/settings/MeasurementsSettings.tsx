import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings } from '../../types';

interface MeasurementsSettingsProps {
    settings: Settings;
    onUpdateSettings: (settings: Partial<Settings>) => void;
}

const MeasurementsSettings: React.FC<MeasurementsSettingsProps> = ({ settings, onUpdateSettings }) => {
    const [formData, setFormData] = useState(settings.measurements);
    const [newUnit, setNewUnit] = useState('');
    const [newTemplateName, setNewTemplateName] = useState('');

    const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, enabled: e.target.checked }));
    };

    const handleAddUnit = () => {
        if (newUnit && !formData.units.includes(newUnit)) {
            setFormData(prev => ({ ...prev, units: [...prev.units, newUnit] }));
            setNewUnit('');
        }
    };
    
    const handleRemoveUnit = (unitToRemove: string) => {
        setFormData(prev => ({ ...prev, units: prev.units.filter(u => u !== unitToRemove) }));
    };

    const handleAddTemplate = () => {
        if (newTemplateName && !formData.templates.some(t => t.name === newTemplateName)) {
            setFormData(prev => ({ ...prev, templates: [...prev.templates, { name: newTemplateName, fields: [] }] }));
            setNewTemplateName('');
        }
    };

    const handleRemoveTemplate = (templateName: string) => {
        setFormData(prev => ({ ...prev, templates: prev.templates.filter(t => t.name !== templateName) }));
    };

    const handleAddField = (templateName: string, newField: string) => {
        if (!newField) return;
        setFormData(prev => ({
            ...prev,
            templates: prev.templates.map(t => 
                t.name === templateName ? { ...t, fields: [...t.fields, newField] } : t
            )
        }));
    };

    const handleRemoveField = (templateName: string, fieldToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            templates: prev.templates.map(t =>
                t.name === templateName ? { ...t, fields: t.fields.filter(f => f !== fieldToRemove) } : t
            )
        }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateSettings({ measurements: formData });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-muted dark:bg-dark-muted rounded-lg">
                <span className="text-sm font-medium text-foreground dark:text-dark-foreground">Enable Customer Measurements</span>
                <label htmlFor="measure-toggle" className="inline-flex relative items-center cursor-pointer">
                    <input type="checkbox" name="enabled" checked={formData.enabled} onChange={handleToggle} id="measure-toggle" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary dark:peer-focus:ring-dark-primary peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
            </div>
            
            {/* Units Management */}
            <div>
                <h4 className="text-lg font-semibold text-foreground dark:text-dark-foreground mb-2">Measurement Units</h4>
                <div className="flex flex-wrap gap-2 mb-2">
                    {formData.units.map(unit => (
                        <div key={unit} className="bg-muted dark:bg-dark-muted text-foreground dark:text-dark-foreground px-2 py-1 rounded-md flex items-center gap-2 text-sm">
                            {unit}
                            <button type="button" onClick={() => handleRemoveUnit(unit)} className="text-danger hover:text-red-700">&times;</button>
                        </div>
                    ))}
                </div>
                 <div className="flex gap-2">
                    <input type="text" value={newUnit} onChange={e => setNewUnit(e.target.value)} placeholder="e.g. 'in' or 'cm'" className="flex-grow px-3 py-2 bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-primary sm:text-sm"/>
                    <button type="button" onClick={handleAddUnit} className="bg-foreground/80 dark:bg-dark-border text-white dark:text-dark-foreground font-semibold px-4 py-2 rounded-lg hover:bg-foreground dark:hover:bg-dark-border/80 transition-colors text-sm">Add Unit</button>
                </div>
            </div>

            {/* Templates Management */}
            <div>
                 <h4 className="text-lg font-semibold text-foreground dark:text-dark-foreground mb-2">Measurement Templates</h4>
                 <div className="space-y-4">
                     {formData.templates.map(template => (
                         <div key={template.name} className="p-4 bg-muted dark:bg-dark-muted rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                                <h5 className="font-bold text-foreground dark:text-dark-foreground">{template.name}</h5>
                                <button type="button" onClick={() => handleRemoveTemplate(template.name)} className="text-danger text-sm font-bold">Remove</button>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {template.fields.map(field => (
                                    <div key={field} className="bg-card dark:bg-dark-card border border-border dark:border-dark-border text-foreground-muted dark:text-dark-foreground-muted px-2 py-1 rounded-md flex items-center gap-2 text-xs">
                                        {field}
                                        <button type="button" onClick={() => handleRemoveField(template.name, field)} className="text-danger hover:text-red-700">&times;</button>
                                    </div>
                                ))}
                            </div>
                             <div className="flex gap-2">
                                 <input type="text" id={`new-field-${template.name.replace(/\s/g, '-')}`} placeholder="New field name..." className="flex-grow px-3 py-2 bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-primary sm:text-sm"/>
                                 <button type="button" onClick={() => {
                                     const input = document.getElementById(`new-field-${template.name.replace(/\s/g, '-')}`) as HTMLInputElement;
                                     if(input) { handleAddField(template.name, input.value); input.value = ''; }
                                 }} className="bg-foreground/70 text-white font-semibold px-4 py-2 rounded-lg hover:bg-foreground transition-colors text-sm dark:bg-dark-border dark:hover:bg-dark-border/80">Add Field</button>
                            </div>
                         </div>
                     ))}
                 </div>
                 <div className="flex gap-2 mt-4 pt-4 border-t border-border dark:border-dark-border">
                    <input type="text" value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} placeholder="New template name..." className="flex-grow px-3 py-2 bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-primary sm:text-sm"/>
                    <button type="button" onClick={handleAddTemplate} className="bg-foreground/80 dark:bg-dark-border text-white dark:text-dark-foreground font-semibold px-4 py-2 rounded-lg hover:bg-foreground dark:hover:bg-dark-border/80 transition-colors text-sm">Add Template</button>
                </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-border dark:border-dark-border mt-6">
                 <button type="submit" whileTap={{ scale: 0.95 }} className="bg-primary text-primary-content font-semibold px-6 py-2 rounded-lg hover:bg-primary-focus transition-colors shadow-md">
                    Save Measurement Settings
                </button>
            </div>
        </form>
    );
};

export default MeasurementsSettings;
