import { DocumentReference, deleteDoc, doc, getDoc, onSnapshot, setDoc, updateDoc } from "firebase/firestore"
import objectHash from "hash-it"
import { useEffect, useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "react-query"
import { useFirebaseContext } from "./context.js"
import { useReactQueryOptions } from "./react-query.js"


export function useDocumentReference(...pathSegments) {
    const { firestore } = useFirebaseContext()
    return useMemo(() => {
        if (pathSegments.every(segment => typeof segment === "string"))
            return doc(firestore, ...pathSegments)

        if (Array.isArray(pathSegments[0]))
            return doc(firestore, ...pathSegments[0])
    }, [objectHash(pathSegments)])
}


/**
 * @typedef {object} UseDocumentOptions
 * @property {boolean} [fetch=true]
 * @property {boolean} [subscribe=true]
 * @property {boolean} [raw=false]
 * @property {boolean} [includeMutators=true]
 */

/** @type {UseDocumentOptions} */
const DEFAULT_DOCUMENT_OPTIONS = {
    fetch: true,
    subscribe: true,
    raw: false,
    includeMutators: true,
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
 * @typedef {{ 
 *   update: import("react-query").UseMutationResult,
 *   set: import("react-query").UseMutationResult,
 *   delete: import("react-query").UseMutationResult,
 * } & import("react-query").UseQueryResult} UseDocumentResult
 */


/**
 * @param {DocumentReference | string[]} referenceOrPathSegments
 * @param {UseDocumentOptions} _documentOptions
 * @param {import("react-query").UseQueryOptions} _reactQueryOptions
 * @return {UseDocumentResult}
 */
export function useDocument(referenceOrPathSegments, _documentOptions, _reactQueryOptions) {
    return Array.isArray(referenceOrPathSegments) ?
        useDocumentFromPath(referenceOrPathSegments, _documentOptions, _reactQueryOptions) :
        useDocumentFromReference(referenceOrPathSegments, _documentOptions, _reactQueryOptions)
}


/**
 * @param {string[]} pathSegments
 * @param {UseDocumentOptions} _documentOptions
 * @param {import("react-query").UseQueryOptions} _reactQueryOptions
 * @return {UseDocumentResult}
 */
export function useDocumentFromPath(pathSegments, _documentOptions, _reactQueryOptions) {
    const reference = useDocumentReference(...pathSegments)
    return useDocumentFromReference(reference, _documentOptions, _reactQueryOptions)
}


/**
 * @param {DocumentReference} reference
 * @param {UseDocumentOptions} _documentOptions
 * @param {import("react-query").UseQueryOptions} _reactQueryOptions
 * @return {UseDocumentResult}
 */
export function useDocumentFromReference(reference, _documentOptions, _reactQueryOptions) {

    const documentOptions = useDocumentOptions(_documentOptions)
    const reactQueryOptions = useReactQueryOptions(_reactQueryOptions, [reference?.path])

    const queryClient = useQueryClient()

    useEffect(() => {
        if (documentOptions.subscribe && reference) {
            return onSnapshot(reference, snapshot => {
                queryClient.setQueryData(reactQueryOptions.queryKey, snapshot)
            })
        }
    }, [reference?.path, documentOptions.subscribe, objectHash(reactQueryOptions.queryKey)])

    const { data: snapshot, ...reactQuery } = useQuery({
        ...reactQueryOptions,
        queryFn: () => reference ? getDoc(reference) : undefined,
        enabled: documentOptions.fetch,
    })

    return {
        data: documentOptions.raw ? snapshot : (snapshot && formatDocumentSnapshot(snapshot)),
        ...documentOptions.fetch && reactQuery,
        ...documentOptions.includeMutators && {
            update: useMutation({
                mutationFn: data => reference && updateDoc(reference, data),
                mutationKey: ["update", reference?.path],
            }),
            set: useMutation({
                /** 
                 * @param {{ data: any, options: import("firebase/firestore").SetOptions }} param
                 */
                mutationFn: ({ data, options }) => reference && setDoc(reference, data, options),
                mutationKey: ["set", reference?.path],
            }),
            delete: useMutation({
                mutationFn: () => reference && deleteDoc(reference),
                mutationKey: ["delete", reference?.path],
            }),
        }
    }
}


/**
 * @param {import("firebase/firestore").DocumentSnapshot} snapshot
 * @return {{ id: string, doc: import("firebase/firestore").DocumentSnapshot } & import("firebase/firestore").DocumentData}
 */
export function formatDocumentSnapshot(snapshot) {

    if (snapshot.exists() === false)
        return

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


/**
 * @param {DocumentReference | string[]} referenceOrPathSegments
 */
export function useDocumentMutators(referenceOrPathSegments) {
    return useDocument(referenceOrPathSegments, {
        fetch: false,
        subscribe: false,
        includeMutators: true,
    })
}