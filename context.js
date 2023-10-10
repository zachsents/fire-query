import { createContext, useContext } from "react"

const uninitialized = { _notInitialized: true }

const FirebaseContext = createContext(uninitialized)

/**
 * @typedef {object} FirebaseContextValue
 * @property {import("firebase/firestore").Firestore} firestore
 * @property {import("firebase/auth").Auth} auth
 * @property {import("./documents.js").UseDocumentOptions} documentOptions
 * @property {import("react-query").UseQueryOptions} queryOptions
 */

/**
 * @param {{ children: any } & FirebaseContextValue} props
 */
export function FirebaseProvider({ children, firestore, auth, documentOptions, queryOptions }) {
    return (
        <FirebaseContext.Provider value={{ firestore, auth, documentOptions, queryOptions }}>
            {children}
        </FirebaseContext.Provider>
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