import styles from './Button.module.css';

const variants = {
  primary: styles.primary,
  secondary: styles.secondary,
  glass: styles.glass,
};

export default function Button({
  variant = 'primary',
  className = '',
  as: Component = 'button',
  children,
  ...props
}) {
  const classNames = `${variants[variant] ?? styles.primary} ${className}`.trim();
  return (
    <Component className={classNames} {...props}>
      {children}
    </Component>
  );
}
