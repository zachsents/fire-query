
import { onAuthStateChanged, signOut } from "firebase/auth"
import objectHash from "hash-it"
import { useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "react-query"
import { useFirebaseContext } from "./context.js"
import { useReactQueryOptions } from "./react-query.js"

/**
 * @param {import("react-query").UseQueryOptions} _reactQueryOptions
 */
export function useUser(_reactQueryOptions) {

    const { auth } = useFirebaseContext()

    const reactQueryOptions = useReactQueryOptions(_reactQueryOptions, ["currentUser"])
    const queryClient = useQueryClient()

    useEffect(() => {
        return onAuthStateChanged(auth, user => {
            queryClient.setQueryData(reactQueryOptions.queryKey, user)
        })
    }, [auth, objectHash(reactQueryOptions.queryKey)])

    const reactQuery = useQuery({
        ...reactQueryOptions,
        queryFn: () => { },
    })

    return {
        signOut: () => signOut(auth),
        hasEmitted: reactQuery.data !== undefined,
        ...reactQuery,
    }
}


export function useSignOut() {
    const { auth } = useFirebaseContext()

    return useMutation({
        mutationFn: () => signOut(auth),
    })
}
