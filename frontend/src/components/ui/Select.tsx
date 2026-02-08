import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

interface SelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    label?: string;
    error?: string;
    disabled?: boolean;
    className?: string;
}

export function Select({
    value,
    onChange,
    options,
    placeholder = 'Select an option',
    label,
    error,
    disabled = false,
    className,
}: SelectProps) {
    const selectedOption = options.find((opt) => opt.value === value);

    return (
        <div className={cn('w-full', className)}>
            {label && (
                <label className="block text-sm font-medium text-text-primary mb-2">
                    {label}
                </label>
            )}
            <Listbox value={value} onChange={onChange} disabled={disabled}>
                <div className="relative">
                    <Listbox.Button
                        className={cn(
                            'relative w-full cursor-pointer rounded-lg bg-background/50 border py-2.5 pl-3 pr-10 text-left transition-colors',
                            error
                                ? 'border-error focus:ring-error'
                                : 'border-white/10 focus:border-primary focus:ring-1 focus:ring-primary',
                            disabled && 'opacity-50 cursor-not-allowed'
                        )}
                    >
                        <span className={cn(
                            'block truncate',
                            selectedOption ? 'text-text-primary' : 'text-text-secondary'
                        )}>
                            {selectedOption?.label || placeholder}
                        </span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronDown className="h-4 w-4 text-text-secondary" aria-hidden="true" />
                        </span>
                    </Listbox.Button>
                    <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg glass border border-white/10 py-1 shadow-lg focus:outline-none">
                            {options.map((option) => (
                                <Listbox.Option
                                    key={option.value}
                                    className={({ active }) =>
                                        cn(
                                            'relative cursor-pointer select-none py-2.5 pl-10 pr-4 transition-colors',
                                            active ? 'bg-primary/10 text-primary' : 'text-text-primary',
                                            option.disabled && 'opacity-50 cursor-not-allowed'
                                        )
                                    }
                                    value={option.value}
                                    disabled={option.disabled}
                                >
                                    {({ selected }) => (
                                        <>
                                            <span className={cn('block truncate', selected ? 'font-medium' : 'font-normal')}>
                                                {option.label}
                                            </span>
                                            {selected && (
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                                                    <Check className="h-4 w-4" aria-hidden="true" />
                                                </span>
                                            )}
                                        </>
                                    )}
                                </Listbox.Option>
                            ))}
                        </Listbox.Options>
                    </Transition>
                </div>
            </Listbox>
            {error && (
                <p className="mt-1 text-sm text-error">{error}</p>
            )}
        </div>
    );
}
