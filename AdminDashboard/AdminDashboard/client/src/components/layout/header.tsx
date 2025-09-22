import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function Header({ title, description, children }: HeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground" data-testid="page-title">{title}</h1>
        {description && (
          <p className="text-muted-foreground" data-testid="page-description">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
