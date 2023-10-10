import { CollectionReference, Query, QueryConstraint, addDoc, collection, getDocs, onSnapshot, query } from "firebase/firestore"
import objectHash from "object-hash"
import { useEffect, useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "react-query"
import { useFirebaseContext } from "./context.js"
import { formatDocumentSnapshot } from "./documents.js"
import { useReactQueryOptions } from "./react-query.js"


/**
 * @param {...string} pathSegments
 */
export function useCollectionReference(...pathSegments) {
    const { firestore } = useFirebaseContext()
    return useMemo(() => {
        if (pathSegments.every(segment => typeof segment === "string"))
            return collection(firestore, ...pathSegments)

        if (Array.isArray(pathSegments[0]))
            return collection(firestore, ...pathSegments[0])
    }, [firestore, objectHash(pathSegments)])
}

/**
 * @param {string[]} pathSegments
 * @param {QueryConstraint[]} constraints
 */
export function useCollectionQueryReference(pathSegments, constraints) {
    const { firestore } = useFirebaseContext()
    return useMemo(() => {
        if (!Array.isArray(pathSegments) || !pathSegments.every(segment => typeof segment === "string"))
            return

        if (Array.isArray(constraints) && constraints.length > 0) {
            if (constraints.every(constraint => constraint))
                return query(collection(firestore, ...pathSegments), ...constraints)
            return
        }

        return collection(firestore, ...pathSegments)
    }, [firestore, pathSegments && objectHash(pathSegments), constraints && objectHash(constraints)])
}


/**
 * @typedef {object} UseCollectionQueryOptions
 * @property {boolean} [subscribe=true]
 * @property {boolean} [raw=false]
 */

/** @type {UseCollectionQueryOptions} */
const DEFAULT_COLLECTION_QUERY_OPTIONS = {
    subscribe: true,
    raw: false,
}

/**
 * @param {UseCollectionQueryOptions} options
 * @return {UseCollectionQueryOptions} 
 */
export function useCollectionQueryOptions(options) {
    return {
        ...DEFAULT_COLLECTION_QUERY_OPTIONS,
        ...useFirebaseContext().collectionQueryOptions,
        ...options,
    }
}


/**
 * @typedef {{ 
 *   add: import("react-query").UseMutationResult,
 * } & import("react-query").UseQueryResult} UseCollectionQueryResult
 */


/**
 * @param {CollectionReference | Query | string[]} referenceOrPathSegments
 * @param {QueryConstraint[]} constraints
 * @param {UseCollectionQueryOptions} _collectionQueryOptions
 * @param {import("react-query").UseQueryOptions} _reactQueryOptions
 * @return {UseCollectionQueryResult}
 */
export function useCollectionQuery(referenceOrPathSegments, constraints, _collectionQueryOptions, _reactQueryOptions) {
    return Array.isArray(referenceOrPathSegments) ?
        useCollectionQueryFromPath(referenceOrPathSegments, constraints, _collectionQueryOptions, _reactQueryOptions) :
        useCollectionQueryFromReference(referenceOrPathSegments, _collectionQueryOptions, _reactQueryOptions)
}


/**
 * @param {string[]} pathSegments
 * @param {QueryConstraint[]} constraints
 * @param {UseCollectionQueryOptions} _collectionQueryOptions
 * @param {import("react-query").UseQueryOptions} _reactQueryOptions
 * @return {UseCollectionQueryResult}
 */
export function useCollectionQueryFromPath(pathSegments, constraints, _collectionQueryOptions, _reactQueryOptions) {
    const reference = useCollectionQueryReference(pathSegments, constraints)
    return useCollectionQueryFromReference(reference, _collectionQueryOptions, _reactQueryOptions)
}


/**
 * @param {CollectionReference | Query} reference
 * @param {UseCollectionQueryOptions} _collectionQueryOptions
 * @param {import("react-query").UseQueryOptions} _reactQueryOptions
 * @return {UseCollectionQueryResult}
 */
export function useCollectionQueryFromReference(reference, _collectionQueryOptions, _reactQueryOptions) {

    const collectionQueryOptions = useCollectionQueryOptions(_collectionQueryOptions)
    const reactQueryOptions = useReactQueryOptions(_reactQueryOptions, [reference, collectionQueryOptions])

    if (collectionQueryOptions.subscribe) {
        const queryClient = useQueryClient()

        useEffect(() => {
            if (reference) {
                const unsubscribe = onSnapshot(reference, snapshot => {
                    queryClient.setQueryData(
                        reactQueryOptions.queryKey,
                        collectionQueryOptions.raw ? snapshot : formatQuerySnapshot(snapshot),
                    )
                })
                return unsubscribe
            }
        }, [queryClient, reactQueryOptions.queryKey, reference?.path, collectionQueryOptions.raw])
    }

    return useQuery({
        ...reactQueryOptions,
        queryFn: async () => {
            if (!reference) return
            const snapshot = await getDocs(reference)
            return collectionQueryOptions.raw ? snapshot : formatQuerySnapshot(snapshot)
        },
    })
}


/**
 * @param {import("firebase/firestore").QuerySnapshot} snapshot
 * @return {Array<{ id: string, doc: import("firebase/firestore").QuerySnapshot } & import("firebase/firestore").DocumentData>}
 */
export function formatQuerySnapshot(snapshot) {
    return snapshot.docs.map(formatDocumentSnapshot)
}


/**
 * @param {CollectionReference | string[]} referenceOrPathSegments
 */
export function useAddDocument(referenceOrPathSegments,) {
    const reference = Array.isArray(referenceOrPathSegments) ?
        useCollectionReference(...referenceOrPathSegments) :
        referenceOrPathSegments

    return useMutation({
        mutationFn: async (data) => {
            if (!reference) return
            return await addDoc(reference, data)
        },
        mutationKey: ["add", reference?.path],
    })
}