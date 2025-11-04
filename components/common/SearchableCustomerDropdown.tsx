import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Customer } from '../types';

interface SearchableCustomerDropdownProps {
    customers: Customer[];
    selectedCustomerId: string;
    onCustomerChange: (id: string) => void;
    disabled?: boolean;
    filter?: (customer: Customer) => boolean;
}

const SearchableCustomerDropdown: React.FC<SearchableCustomerDropdownProps> = ({
    customers,
    selectedCustomerId,
    onCustomerChange,
    disabled = false,
    filter,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const availableCustomers = useMemo(() => {
        return filter ? customers.filter(filter) : customers;
    }, [customers, filter]);
    
    const selectedCustomer = useMemo(() => {
        return customers.find(c => c.id === selectedCustomerId);
    }, [customers, selectedCustomerId]);

    const filteredCustomers = useMemo(() => {
        if (!searchTerm) {
            return availableCustomers;
        }
        const lowerCaseSearch = searchTerm.toLowerCase();
        return availableCustomers.filter(c =>
            c.name.toLowerCase().includes(lowerCaseSearch) ||
            c.phone.toLowerCase().includes(lowerCaseSearch)
        );
    }, [availableCustomers, searchTerm]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleSelectCustomer = (customerId: string) => {
        onCustomerChange(customerId);
        setSearchTerm('');
        setIsOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        if (!isOpen) {
            setIsOpen(true);
        }
    };
    
    const displayValue = isOpen ? searchTerm : selectedCustomer?.name || '';
    
    return (
        <div className="relative" ref={wrapperRef}>
            <input
                type="text"
                value={displayValue}
                onChange={handleInputChange}
                onFocus={() => {
                    setSearchTerm('');
                    setIsOpen(true);
                }}
                placeholder="Search by name or phone..."
                disabled={disabled}
                className="w-full bg-background dark:bg-dark-card border border-border dark:border-dark-border rounded-md p-2 text-sm text-foreground dark:text-dark-foreground focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary"
            />
            {isOpen && !disabled && (
                <ul className="absolute z-10 w-full mt-1 bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredCustomers.length > 0 ? (
                        filteredCustomers.map(c => (
                            <li
                                key={c.id}
                                onClick={() => handleSelectCustomer(c.id)}
                                className="px-4 py-2 text-sm hover:bg-muted dark:hover:bg-dark-muted cursor-pointer"
                            >
                                <p className="font-semibold text-foreground dark:text-dark-foreground">{c.name}</p>
                                <p className="text-xs text-foreground-muted dark:text-dark-foreground-muted">{c.phone}</p>
                            </li>
                        ))
                    ) : (
                        <li className="px-4 py-2 text-sm text-foreground-muted dark:text-dark-foreground-muted">No customers found.</li>
                    )}
                </ul>
            )}
        </div>
    );
};

export default SearchableCustomerDropdown;
