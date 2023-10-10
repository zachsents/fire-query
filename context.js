import { createContext, createElement, useContext } from "react"

const uninitialized = { _notInitialized: true }

const FirebaseContext = createContext(uninitialized)

/**
 * @typedef {object} FirebaseContextValue
 * @property {import("firebase/firestore").Firestore} firestore
 * @property {import("firebase/auth").Auth} auth
 * @property {import("./documents.js").UseDocumentOptions} documentOptions
 * @property {import("./collections.js").UseCollectionQueryOptions} collectionQueryOptions
 */

/**
 * @param {{ children: any } & FirebaseContextValue} props
 */
export function FirebaseProvider({ children, ...props }) {
    return createElement(
        FirebaseContext.Provider,
        { value: props },
        children
    )
}

/**
 * @return {FirebaseContextValue} 
 */
export function useFirebaseContext() {
    const contextValue = useContext(FirebaseContext)
    if (contextValue._notInitialized) {
        throw new Error("Must wrap your app in a <FirebaseProvider> component to use the firebase context.")
    }
    return contextValue
}