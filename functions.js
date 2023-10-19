import { useMutation, useQuery } from "react-query"
import { useReactQueryOptions } from "./react-query"
import { useFirebaseContext } from "./context"
import { httpsCallable } from "firebase/functions"


/**
 * @param {string} functionName
 * @param {*} data
 * @param {import("react-query").UseQueryOptions} _reactQueryOptions
 * @return {import("react-query").UseQueryResult} 
 */
export function useFunctionQuery(functionName, data, _reactQueryOptions) {

    const { functions } = useFirebaseContext()

    const reactQueryOptions = useReactQueryOptions(_reactQueryOptions, [functionName, data])

    return useQuery({
        ...reactQueryOptions,
        queryFn: () => {
            if (!functionName || data === undefined)
                return

            return httpsCallable(functions, functionName)(data)
        },
    })
}


/**
 * @param {string} functionName
 * @return {import("react-query").UseMutationResult} 
 */
export function useFunctionMutation(functionName) {

    const { functions } = useFirebaseContext()

    return useMutation({
        mutationFn: data => {
            if (!functionName || data === undefined)
                return

            return httpsCallable(functions, functionName)(data)
        },
    })
}