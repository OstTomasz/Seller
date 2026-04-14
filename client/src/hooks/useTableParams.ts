import { useSearchParams } from "react-router-dom";

interface UseTableParamsOptions<T extends string> {
  defaultSort: T;
  defaultDir?: "asc" | "desc";
  defaultRows?: 10 | 20;
}

export const useTableParams = <T extends string>({
  defaultSort,
  defaultDir = "asc",
  defaultRows = 10,
}: UseTableParamsOptions<T>) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const sortField = (searchParams.get("sort") ?? defaultSort) as T;
  const sortDirection = (searchParams.get("dir") ?? defaultDir) as "asc" | "desc";
  const page = Number(searchParams.get("page") ?? "1");
  const rowsPerPage = Number(searchParams.get("rows") ?? String(defaultRows)) as 10 | 20;

  const setParam = (key: string, value: string) =>
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      next.set("page", "1");
      return next;
    });

  const setPage = (p: number) =>
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", String(p));
      return next;
    });

  const setRowsPerPage = (n: number) =>
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("rows", String(n));
      next.set("page", "1");
      return next;
    });

  const handleSort = (field: T) =>
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (sortField === field) {
        next.set("dir", sortDirection === "asc" ? "desc" : "asc");
      } else {
        next.set("sort", field);
        next.set("dir", "asc");
      }
      next.set("page", "1");
      return next;
    });

  const getParam = (key: string) => searchParams.get(key) ?? "";

  return {
    search,
    sortField,
    sortDirection,
    page,
    rowsPerPage,
    setParam,
    setPage,
    setRowsPerPage,
    handleSort,
    getParam,
    searchParams,
    setSearchParams,
  };
};
