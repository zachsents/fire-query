

/** @type {import("react-query").UseQueryOptions} */
const DEFAULT_REACT_QUERY_OPTIONS = {
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
}

/**
 * @param {import("react-query").UseQueryOptions} options
 * @param {any[]} queryKey
 * @return {import("react-query").UseQueryOptions} 
 */
export function useReactQueryOptions(options, queryKey) {
    return {
        ...DEFAULT_REACT_QUERY_OPTIONS,
        queryKey,
        ...options,
    }
}