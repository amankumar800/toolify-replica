import { clsx } from 'clsx';
import { ComponentProps } from 'react';

interface ContainerProps extends ComponentProps<'div'> {
    fluid?: boolean;
}

export function Container({ className, fluid, ...props }: ContainerProps) {
    return (
        <div
            className={clsx(
                'mx-auto px-4 sm:px-6 lg:px-8',
                fluid ? 'max-w-full' : 'container',
                className
            )}
            {...props}
        />
    );
}
