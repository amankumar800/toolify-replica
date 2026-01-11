import { clsx } from 'clsx';
import { ComponentProps } from 'react';

interface ContainerProps extends ComponentProps<'div'> {
    fluid?: boolean;
    wide?: boolean;
}

export function Container({ className, fluid, wide, ...props }: ContainerProps) {
    return (
        <div
            className={clsx(
                'mx-auto px-4 sm:px-6 lg:px-8',
                fluid ? 'max-w-full' : wide ? 'max-w-[1600px]' : 'container',
                className
            )}
            {...props}
        />
    );
}
