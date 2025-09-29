import { Vote } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = "Loading..." }: LoadingSpinnerProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center pb-24">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <Vote className="h-16 w-16 text-[--color-zimbabwe-green] animate-pulse" />
          <div className="absolute inset-0 border-4 border-[--color-zimbabwe-green] border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-muted-foreground">{message}</p>
        
        {/* Small flag stripe */}
        <div className="w-12 h-0.5 mx-auto mt-4 flex">
          <div className="flex-1 bg-[--color-zimbabwe-green]"></div>
          <div className="flex-1 bg-[--color-zimbabwe-yellow]"></div>
          <div className="flex-1 bg-[--color-zimbabwe-red]"></div>
          <div className="flex-1 bg-[--color-zimbabwe-black]"></div>
        </div>
      </div>
    </div>
  );
}