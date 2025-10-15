import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { serverURL } from '@/constants';

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface UseAdminPaginationProps {
  endpoint: string;
  initialLimit?: number;
}

interface UseAdminPaginationReturn<T> {
  data: T[];
  pagination: PaginationData | null;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  limit: number;
  setLimit: (limit: number) => void;
  refetch: () => void;
}

export function useAdminPagination<T = any>({
  endpoint,
  initialLimit = 10
}: UseAdminPaginationProps): UseAdminPaginationReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        ...(searchQuery && { search: searchQuery })
      });

      const response = await axios.get(`${serverURL}/api/${endpoint}?${params}`);
      
      // Handle different response structures
      if (response.data.users) {
        setData(response.data.users);
      } else if (response.data.courses) {
        setData(response.data.courses);
      } else if (response.data.blogs) {
        setData(response.data.blogs);
      } else if (response.data.contacts) {
        setData(response.data.contacts);
      } else if (response.data.admins) {
        // For admin endpoint, we'll handle both users and admins
        setData([...response.data.users, ...response.data.admins]);
      } else {
        setData(response.data);
      }

      setPagination(response.data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Pagination fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [endpoint, currentPage, limit, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset to first page when search query changes
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchQuery]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    pagination,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    limit,
    setLimit,
    refetch
  };
}