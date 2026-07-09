import * as React from 'react';

/**
 * Mock for @heroui/react Button component.
 * HeroUI v3 uses compound component patterns and semantic variants.
 */
export function Button({
  children,
  onPress,
  className,
  isDisabled,
  isPending,
}: {
  children?: React.ReactNode;
  onPress?: () => void;
  className?: string;
  isDisabled?: boolean;
  isPending?: boolean;
}) {
  return (
    <button onClick={onPress} className={className} disabled={isDisabled} data-pending={isPending}>
      {typeof children === 'function'
        ? (children as (args: { isPending: boolean }) => React.ReactNode)({
            isPending: !!isPending,
          })
        : children}
    </button>
  );
}
