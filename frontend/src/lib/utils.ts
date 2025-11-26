import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const getPriorityColor = (priority: string | undefined) => {
    switch (priority?.toUpperCase()) {
        case 'HIGH':
            return 'bg-red-100 text-red-700 border-red-200';
        case 'MEDIUM':
            return 'bg-amber-100 text-amber-700 border-amber-200';
        case 'LOW':
            return 'bg-green-100 text-green-700 border-green-200';
        default:
            return 'bg-gray-100 text-gray-700 border-gray-200';
    }
};

export const getStatusColor = (status: string | undefined) => {
    switch (status?.toUpperCase()) {
        case 'RESOLVED':
            return 'bg-green-100 text-green-700 border-green-200';
        case 'IN_PROGRESS':
            return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'OPEN':
            return 'bg-purple-100 text-purple-700 border-purple-200';
        default:
            return 'bg-gray-100 text-gray-700 border-gray-200';
    }
};
