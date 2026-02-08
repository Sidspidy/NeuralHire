import { cn } from "@/utils/cn";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'text' | 'circular' | 'rectangular';
}

function Skeleton({ className, variant = 'rectangular', ...props }: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse bg-white/5",
                variant === 'text' && "h-4 rounded",
                variant === 'circular' && "rounded-full",
                variant === 'rectangular' && "rounded-lg",
                className
            )}
            {...props}
        />
    );
}

export { Skeleton };
