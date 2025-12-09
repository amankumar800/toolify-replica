import { clsx } from 'clsx';
import { ComponentProps } from 'react';

export function Container({ className, ...props }: ComponentProps<'div'>) {
    return (
        <div
            className={clsx('container mx-auto px-4 sm:px-6 lg:px-8', className)}
            {...props}
        />
    );
}
