import { CollectionReference, Query, QueryConstraint, addDoc, collection, getCountFromServer, getDocs, onSnapshot, query } from "firebase/firestore"
import objectHash from "hash-it"
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
    }, [objectHash(pathSegments)])
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
    }, [objectHash(pathSegments), objectHash(constraints)])
}


/**
 * @typedef {object} UseCollectionQueryOptions
 * @property {boolean} [subscribe=true]
 * @property {boolean} [raw=false]
 * @property {"count"} [aggregation] Specifies if an aggregation should be performed on the 
 * query. Currently only "count" is supported. `subscribe` will be ignored if `aggregation` 
 * is set.
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
    const reactQueryOptions = useReactQueryOptions(_reactQueryOptions, [reference?._query, collectionQueryOptions.aggregation])

    const queryClient = useQueryClient()

    useEffect(() => {
        if (collectionQueryOptions.subscribe && reference && !collectionQueryOptions.aggregation) {
            return onSnapshot(reference, snapshot => {
                queryClient.setQueryData(reactQueryOptions.queryKey, snapshot)
            })
        }
    }, [collectionQueryOptions.subscribe, objectHash(reference?._query), objectHash(reactQueryOptions.queryKey)])

    const { data: snapshot, ...reactQuery } = useQuery({
        ...reactQueryOptions,
        queryFn: () => {
            if (!reference)
                return

            switch (collectionQueryOptions.aggregation) {
                case undefined:
                    return getDocs(reference)
                case "count":
                    return getCountFromServer(reference)
                default:
                    throw new Error(`Aggregation "${collectionQueryOptions.aggregation}" is not supported.`)
            }
        },
    })

    let returnData
    if (collectionQueryOptions.raw || !snapshot)
        returnData = snapshot
    else {
        switch (collectionQueryOptions.aggregation) {
            case undefined:
                returnData = formatQuerySnapshot(snapshot)
                break
            case "count":
                returnData = snapshot.data().count
                break
        }
    }

    return {
        ...reactQuery,
        data: returnData,
    }
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
export function useAddDocument(referenceOrPathSegments) {
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