import { act, render, waitFor } from "@testing-library/react"
import { useDocument } from "../documents"
import TestApp from "./TestApp.js"

const subscriptions = {}

let database = {
    "test-collection/fixed": {
        a: 5,
        b: 6,
    },
    "test-collection/update": {
        a: 24,
        b: 609,
    },
    "test-collection/set": {
        a: 24,
        b: 609,
    },
    "test-collection/delete": {
        hey: "man",
    },
}

const dummySnapshot = docRef => ({
    id: docRef.id,
    data: () => database[docRef.path],
    exists: () => !!database[docRef.path],
    snapshotId: Math.random().toString(16).substring(2, 8),
})

jest.mock("firebase/firestore", () => {
    return {
        ...jest.requireActual("firebase/firestore"),
        doc: jest.fn((_, ...pathSegments) => ({
            id: pathSegments.at(-1),
            path: pathSegments.join("/"),
        })),
        getDoc: jest.fn(docRef => Promise.resolve(dummySnapshot(docRef))),
        onSnapshot: jest.fn((docRef, callback) => {
            subscriptions[docRef.path] ??= new Set()
            const func = () => callback(dummySnapshot(docRef))
            subscriptions[docRef.path].add(func)
            return () => subscriptions[docRef.path].delete(func)
        }),
        updateDoc: jest.fn((docRef, data) => {
            database[docRef.path] = {
                ...database[docRef.path],
                ...data,
            }
            subscriptions[docRef.path]?.forEach(func => func())
        }),
        setDoc: jest.fn((docRef, data, options = {}) => {
            database[docRef.path] = {
                ...options.merge && database[docRef.path],
                ...data,
            }
            subscriptions[docRef.path]?.forEach(func => func())
        }),
        deleteDoc: jest.fn(docRef => {
            delete database[docRef.path]
            subscriptions[docRef.path]?.forEach(func => func())
        }),
    }
})


test("retrieval", async () => {

    /** @type {import("../documents.js").UseDocumentResult} */
    let result
    function TestComponent() {
        result = useDocument(["test-collection", "fixed"], { subscribe: false })
    }
    render(<TestApp>
        <TestComponent />
    </TestApp>)

    await waitFor(() => expect(result.isLoading).toBe(false))
    expect(result.data).not.toBeUndefined()
})

test("undefined doc ID", async () => {

    /** @type {import("../documents.js").UseDocumentResult} */
    let result
    function TestComponent() {
        result = useDocument(["test-collection", undefined], { subscribe: false })
    }
    render(<TestApp>
        <TestComponent />
    </TestApp>)

    await waitFor(() => expect(result.isLoading).toBe(false))
    expect(result.data).toBeUndefined()
})

test("subscription & updating", async () => {

    /** @type {import("../documents.js").UseDocumentResult} */
    let result
    function TestComponent() {
        result = useDocument(["test-collection", "update"], { subscribe: true })
    }
    render(<TestApp>
        <TestComponent />
    </TestApp>)

    await waitFor(() => expect(result.isLoading).toBe(false))
    act(() => result.update.mutate({ a: 7 }))
    await waitFor(() => expect(result.data.a).toBe(7))
})

test("subscription & setting", async () => {

    /** @type {import("../documents.js").UseDocumentResult} */
    let result
    function TestComponent() {
        result = useDocument(["test-collection", "set"], { subscribe: true })
    }
    render(<TestApp>
        <TestComponent />
    </TestApp>)

    await waitFor(() => expect(result.isLoading).toBe(false))

    // set - no merge
    act(() => result.set.mutate({ data: { a: 7 } }))
    await waitFor(() => expect(result.data.a).toBe(7))
    expect(result.data.b).toBeUndefined()

    // set - merge
    act(() => result.set.mutate({
        data: { b: 8 },
        options: { merge: true },
    }))
    await waitFor(() => expect(result.data.b).toBe(8))
    expect(result.data.a).toBe(7)
})

test("subscription & deleting", async () => {

    /** @type {import("../documents.js").UseDocumentResult} */
    let result
    function TestComponent() {
        result = useDocument(["test-collection", "delete"], { subscribe: true })
    }
    render(<TestApp>
        <TestComponent />
    </TestApp>)

    await waitFor(() => expect(result.isLoading).toBe(false))

    act(() => result.delete.mutate())
    await waitFor(() => expect(result.data).toBeUndefined())
})