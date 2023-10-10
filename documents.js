import { DocumentReference, doc, getDoc, onSnapshot } from "firebase/firestore"
import objectHash from "object-hash"
import { useEffect, useMemo } from "react"
import { useQuery, useQueryClient } from "react-query"
import { useFirebaseContext } from "./context.js"
import { useQueryOptions } from "./query.js"


export function useDocumentReference(...pathSegments) {
    const { firestore } = useFirebaseContext()
    return useMemo(() => {
        if (pathSegments.every(segment => typeof segment === "string"))
            return doc(firestore, ...pathSegments)
    }, [firestore, objectHash(pathSegments)])
}


/**
 * @typedef {object} UseDocumentOptions
 * @property {boolean} [subscribe=true]
 * @property {boolean} [raw=false]
 */

/** @type {UseDocumentOptions} */
const DEFAULT_DOCUMENT_OPTIONS = {
    subscribe: true,
    raw: false,
}

/**
 * @param {UseDocumentOptions} options
 * @return {UseDocumentOptions} 
 */
export function useDocumentOptions(options) {
    return {
        ...DEFAULT_DOCUMENT_OPTIONS,
        ...useFirebaseContext().documentOptions,
        ...options,
    }
}


/**
 * @param {DocumentReference | string[]} referenceOrPathSegments
 * @param {UseDocumentOptions} _documentOptions
 * @param {import("react-query").UseQueryOptions} _queryOptions
 * @return {import("react-query").UseQueryResult}
 */
export function useDocument(referenceOrPathSegments, _documentOptions, _queryOptions) {
    if (referenceOrPathSegments instanceof DocumentReference)
        return useDocumentFromReference(referenceOrPathSegments, _documentOptions, _queryOptions)

    if (Array.isArray(referenceOrPathSegments))
        return useDocumentFromPath(referenceOrPathSegments, _documentOptions, _queryOptions)

    throw new Error("Invalid reference or path segments.")
}


/**
 * @param {string[]} pathSegments
 * @param {UseDocumentOptions} _documentOptions
 * @param {import("react-query").UseQueryOptions} _queryOptions
 * @return {import("react-query").UseQueryResult}
 */
export function useDocumentFromPath(pathSegments, _documentOptions, _queryOptions) {
    const reference = useDocumentReference(...pathSegments)
    return useDocumentFromReference(reference, _documentOptions, _queryOptions)
}


/**
 * @param {DocumentReference} reference
 * @param {UseDocumentOptions} _documentOptions
 * @param {import("react-query").UseQueryOptions} _queryOptions
 * @return {import("react-query").UseQueryResult}
 */
export function useDocumentFromReference(reference, _documentOptions, _queryOptions) {

    const documentOptions = useDocumentOptions(_documentOptions)
    const queryOptions = useQueryOptions(_queryOptions, [reference?.path])

    if (documentOptions.subscribe) {
        const queryClient = useQueryClient()

        useEffect(() => {
            if (reference) {
                const unsubscribe = onSnapshot(reference, snapshot => {
                    queryClient.setQueryData(
                        queryOptions.queryKey,
                        documentOptions.raw ? snapshot : formatDocument(snapshot),
                    )
                })
                return unsubscribe
            }
        }, [queryClient, queryOptions.queryKey, reference?.path, documentOptions.raw])
    }

    return useQuery({
        ...queryOptions,
        queryFn: async () => {
            if (!reference) return
            const snapshot = await getDoc(reference)
            return documentOptions.raw ? snapshot : formatDocument(snapshot)
        },
    })
}


/**
 * @param {import("firebase/firestore").DocumentSnapshot} snapshot
 * @return {{ id: string, doc: import("firebase/firestore").DocumentSnapshot } & import("firebase/firestore").DocumentData}
 */
export function formatDocument(snapshot) {

    const result = {
        ...snapshot.data(),
        id: snapshot.id,
    }

    Object.defineProperty(result, "doc", {
        enumerable: false,
        writable: false,
        value: snapshot,
    })

    return result
}