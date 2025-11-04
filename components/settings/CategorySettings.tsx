
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ToastData, CategoryInfo } from '../../types';
import ConfirmationModal from '../common/ConfirmationModal';

// The Modal for adding/editing categories
const CategoryModal = ({
    onClose,
    onSave,
    categoryToEdit,
    allCategories,
}: {
    onClose: () => void;
    onSave: (data: { name: string; description: string; color: string; parentPath: string; }, originalCategory?: CategoryInfo) => void;
    categoryToEdit?: CategoryInfo | null;
    allCategories: CategoryInfo[];
}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('#FF5722');
    const [parentPath, setParentPath] = useState('root');

    React.useEffect(() => {
        if (categoryToEdit) {
            const parts = categoryToEdit.path.split(' > ');
            const currentName = parts.pop() || '';
            const parent = parts.join(' > ');
            
            setName(currentName);
            setDescription(categoryToEdit.description);
            setColor(categoryToEdit.color);
            setParentPath(parent || 'root');
        }
    }, [categoryToEdit]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSave({ name, description, color, parentPath }, categoryToEdit || undefined);
    };
    
    return (
        <div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="bg-card dark:bg-dark-card rounded-xl shadow-2xl w-full max-w-lg p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold mb-4">{categoryToEdit ? 'Edit Category' : 'Add New Category'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground-muted">Category Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required autoFocus className="w-full mt-1 p-2 bg-card dark:bg-dark-background border border-border dark:border-dark-border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground-muted">Description</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full mt-1 p-2 bg-card dark:bg-dark-background border border-border dark:border-dark-border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground-muted">Color</label>
                        <div className="flex items-center gap-2 mt-1">
                            <input type="color" value={color} onChange={e => setColor(e.target.value)} className="p-0 h-10 w-10 block bg-white dark:bg-dark-card border-none cursor-pointer rounded-md" />
                            <input type="text" value={color} onChange={e => setColor(e.target.value)} className="w-full p-2 bg-card dark:bg-dark-background border border-border dark:border-dark-border rounded-md" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground-muted">Parent Category</label>
                         <select value={parentPath} onChange={(e) => setParentPath(e.target.value)} className="w-full mt-1 p-2 bg-card dark:bg-dark-background border border-border dark:border-dark-border rounded-md">
                            <option value="root">-- No Parent (Root) --</option>
                            {allCategories.filter(c => c.path !== categoryToEdit?.path && !c.path.startsWith(`${categoryToEdit?.path} > `)).sort((a,b) => a.path.localeCompare(b.path)).map(cat => (
                                <option key={cat.path} value={cat.path}>{cat.path}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-muted dark:bg-dark-muted rounded-md font-semibold">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-primary-content rounded-md font-semibold">{categoryToEdit ? 'Save Changes' : 'Create Category'}</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// FIX: Added interface definition for component props to resolve TypeScript error.
interface CategorySettingsProps {
    settings: Settings;
    onUpdateSettings: (settings: Partial<Settings>) => void;
    showToast: (message: string, type: ToastData['type']) => void;
}

export const CategorySettings: React.FC<CategorySettingsProps> = ({ settings, onUpdateSettings, showToast }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryInfo | null>(null);
    const [deletingCategory, setDeletingCategory] = useState<CategoryInfo | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const categories = useMemo(() => (settings.inventory?.definedCategories || []).sort((a, b) => a.path.localeCompare(b.path)), [settings.inventory?.definedCategories]);

    const filteredCategories = useMemo(() =>
        categories.filter(c => c.path.toLowerCase().includes(searchTerm.toLowerCase())),
        [categories, searchTerm]
    );

    const handleOpenAddModal = () => {
        setEditingCategory(null);
        setIsModalOpen(true);
    }

    const handleOpenEditModal = (category: CategoryInfo) => {
        setEditingCategory(category);
        setIsModalOpen(true);
    }

    const handleSave = (data: { name: string; description: string; color: string; parentPath: string; }, originalCategory?: CategoryInfo) => {
        const newPath = data.parentPath === 'root' ? data.name : `${data.parentPath} > ${data.name}`;
        const existingCategories = settings.inventory?.definedCategories || [];

        if (!originalCategory) { // ADDING NEW
            if (existingCategories.some(c => c.path === newPath)) {
                showToast('A category with this name and parent already exists.', 'error');
                return;
            }
            const newCategory: CategoryInfo = { path: newPath, description: data.description, color: data.color };
            const updatedCategories = [...existingCategories, newCategory];
            onUpdateSettings({ inventory: { ...settings.inventory, definedCategories: updatedCategories } });
            showToast('Category added!', 'success');
        } else { // EDITING
            const oldPath = originalCategory.path;
             if (oldPath !== newPath && existingCategories.some(c => c.path === newPath)) {
                showToast('A category with this name and parent already exists.', 'error');
                return;
            }

            const updatedCategories = existingCategories.map(cat => {
                if (cat.path === oldPath) {
                    return { path: newPath, description: data.description, color: data.color };
                }
                if (cat.path.startsWith(`${oldPath} > `)) {
                    return { ...cat, path: cat.path.replace(`${oldPath} > `, `${newPath} > `) };
                }
                return cat;
            });
            onUpdateSettings({ inventory: { ...settings.inventory, definedCategories: updatedCategories } });
            showToast('Category updated!', 'success');
        }

        setIsModalOpen(false);
    };
    
    const handleConfirmDelete = () => {
        if (!deletingCategory) return;
        const updatedCategories = (settings.inventory?.definedCategories || []).filter(cat =>
            cat.path !== deletingCategory.path && !cat.path.startsWith(`${deletingCategory.path} > `)
        );
        onUpdateSettings({ inventory: { ...settings.inventory, definedCategories: updatedCategories } });
        setDeletingCategory(null);
        showToast('Category and its sub-categories deleted.', 'success');
    };

    return (
        <div className="space-y-6">
            <AnimatePresence>
                {isModalOpen && <CategoryModal onClose={() => setIsModalOpen(false)} onSave={handleSave} categoryToEdit={editingCategory} allCategories={categories} />}
                {deletingCategory && (
                    <ConfirmationModal
                        title="Delete Category?"
                        message={`Are you sure you want to delete "${deletingCategory.path}"? This will also delete all its sub-categories.`}
                        onConfirm={handleConfirmDelete}
                        onClose={() => setDeletingCategory(null)}
                        confirmText="Delete"
                        isDestructive
                    />
                )}
            </AnimatePresence>

            <div className="flex justify-between items-center">
                 <div className="relative flex-grow max-w-sm">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-foreground/40 dark:text-dark-foreground/40 absolute top-1/2 left-3 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input
                        type="text"
                        placeholder="Search categories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-border dark:border-dark-border bg-card dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
                <button onClick={handleOpenAddModal} whileTap={{ scale: 0.95 }} className="bg-primary text-primary-content font-semibold px-4 py-2 rounded-lg">Add New Category</button>
            </div>

            <div className="bg-card dark:bg-dark-card rounded-xl shadow-sm border border-border dark:border-dark-border overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-foreground dark:text-dark-foreground uppercase bg-muted dark:bg-dark-muted">
                        <tr>
                            <th className="px-6 py-3">Category Name</th>
                            <th className="px-6 py-3">Description</th>
                            <th className="px-6 py-3">Color</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCategories.map(category => (
                            <tr key={category.path} className="border-b dark:border-dark-border last:border-0">
                                <td className="px-6 py-3 font-semibold text-foreground dark:text-dark-foreground flex items-center">
                                    <span className="w-4 h-4 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: category.color }}></span>
                                    {category.path}
                                </td>
                                <td className="px-6 py-3 text-foreground-muted dark:text-dark-foreground-muted">{category.description || '-'}</td>
                                <td className="px-6 py-3 font-mono text-xs">{category.color}</td>
                                <td className="px-6 py-3 text-right space-x-4">
                                    <button onClick={() => handleOpenEditModal(category)} className="font-medium text-primary dark:text-dark-primary hover:underline">Edit</button>
                                    <button onClick={() => setDeletingCategory(category)} className="font-medium text-danger hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                         {filteredCategories.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-center py-10 text-foreground-muted dark:text-dark-foreground-muted">
                                    No categories found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
