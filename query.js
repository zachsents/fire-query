import { useFirebaseContext } from "./context.js"


/** @type {import("react-query").UseQueryOptions} */
const DEFAULT_QUERY_OPTIONS = {
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
}

/**
 * @param {import("react-query").UseQueryOptions} options
 * @param {any[]} queryKey
 * @return {import("react-query").UseQueryOptions} 
 */
export function useQueryOptions(options, queryKey) {
    return {
        ...DEFAULT_QUERY_OPTIONS,
        ...useFirebaseContext().documentOptions,
        queryKey,
        ...options,
    }
}