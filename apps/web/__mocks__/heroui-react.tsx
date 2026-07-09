import * as React from 'react';

/**
 * Mock for @heroui/react components.
 * HeroUI v3 uses compound component patterns and semantic variants.
 */

// ── Button ──────────────────────────────────────────────────────────────
export function Button({
  children,
  onPress,
  className,
  isDisabled,
  isPending,
  fullWidth,
  size: _size,
  variant: _variant,
  id,
  'data-testid': dataTestId,
}: {
  children?: React.ReactNode;
  onPress?: () => void;
  className?: string;
  isDisabled?: boolean;
  isPending?: boolean;
  fullWidth?: boolean;
  size?: string;
  variant?: string;
  id?: string;
  'data-testid'?: string;
}) {
  return (
    <button
      onClick={onPress}
      className={className}
      disabled={isDisabled}
      data-pending={isPending}
      data-fullwidth={fullWidth}
      id={id}
      data-testid={dataTestId}
    >
      {typeof children === 'function'
        ? (children as (args: { isPending: boolean }) => React.ReactNode)({
            isPending: !!isPending,
          })
        : children}
    </button>
  );
}

// ── Card ────────────────────────────────────────────────────────────────
function CardHeader({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

function CardTitle({
  children,
  className,
  id,
  'data-testid': dataTestId,
}: {
  children?: React.ReactNode;
  className?: string;
  id?: string;
  'data-testid'?: string;
}) {
  return (
    <h3 id={id} className={className} data-testid={dataTestId}>
      {children}
    </h3>
  );
}

function CardDescription({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return <p className={className}>{children}</p>;
}

function CardContent({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

function CardFooter({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function Card({
  children,
  className,
  variant: _variant,
}: {
  children?: React.ReactNode;
  className?: string;
  variant?: string;
}) {
  return <div className={className}>{children}</div>;
}

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

// ── Spinner ─────────────────────────────────────────────────────────────
export function Spinner({
  className,
  color: _color,
  size: _size,
}: {
  className?: string;
  color?: string;
  size?: string;
}) {
  return <span className={className} data-spinner />;
}
