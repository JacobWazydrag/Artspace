import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import TableSkeleton from "./Skeleton/TableSkeleton";

interface ContentWrapperProps {
  children: React.ReactNode;
  loading?: boolean;
  type?: "table" | "default";
  tableProps?: {
    rows?: number;
    columns?: number;
    showHeader?: boolean;
    showActions?: boolean;
  };
}

const ContentWrapper: React.FC<ContentWrapperProps> = ({
  children,
  loading = false,
  type = "default",
  tableProps,
}) => {
  const [isLoading, setIsLoading] = useState(loading);
  const location = useLocation();

  // Reset loading state when route changes
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500); // Minimum loading time to prevent flicker

    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Show loading state
  if (isLoading) {
    if (type === "table") {
      return <TableSkeleton {...tableProps} />;
    }
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ContentWrapper;
