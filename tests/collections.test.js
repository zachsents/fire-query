import { act, render, waitFor } from "@testing-library/react"
import { where } from "firebase/firestore"
import { useAddDocument, useCollectionQuery } from "../collections"
import TestApp from "./TestApp.js"

const subscriptions = {}

const database = {
    "test-collection": {
        doc1: {
            a: 1,
            b: 2,
        },
    },
    "adding": {
        doc1: {},
        doc2: {},
    },
}

const dummyDocSnapshot = docRef => ({
    id: docRef.id,
    data: () => database[docRef.path.split("/")[0]]?.[docRef.id],
    exists: () => !!database[docRef.path.split("/")[0]]?.[docRef.id],
    snapshotId: Math.random().toString(16).substring(2, 8),
})

const dummyQuerySnapshot = ref => ({
    docs: Object.keys(database[ref.id]).map(docId => dummyDocSnapshot({
        id: docId,
        path: `${ref.path}/${docId}`,
    })),
    snapshotId: Math.random().toString(16).substring(2, 8),
})

jest.mock("firebase/firestore", () => {
    return {
        ...jest.requireActual("firebase/firestore"),
        collection: jest.fn((_, ...pathSegments) => ({
            id: pathSegments.at(-1),
            path: pathSegments.join("/"),
            _query: pathSegments.join("/"),
        })),
        query: jest.fn(collectionRef => ({ ...collectionRef, _query: collectionRef._query })),
        getDocs: jest.fn(ref => Promise.resolve(dummyQuerySnapshot(ref))),
        getCountFromServer: jest.fn(ref => Promise.resolve({
            data: () => ({ count: Object.keys(database[ref.id]).length })
        })),
        onSnapshot: jest.fn((ref, callback) => {
            subscriptions[ref.path] ??= new Set()
            const func = () => callback(dummyQuerySnapshot(ref))
            subscriptions[ref.path].add(func)
            return () => subscriptions[ref.path].delete(func)
        }),
        addDoc: jest.fn((ref, data) => {
            const newDocId = "doc" + Math.random().toString(16).substring(2, 8)
            database[ref.id][newDocId] = {
                ...data,
            }
            subscriptions[ref.path]?.forEach(func => func())
        }),
    }
})

test("collection retrieval", async () => {

    /** @type {import("../collections.js").UseCollectionQueryResult} */
    let result
    function TestComponent() {
        result = useCollectionQuery(["test-collection"], undefined, { subscribe: false })
    }
    render(<TestApp>
        <TestComponent />
    </TestApp>)

    await waitFor(() => expect(result.isLoading).toBe(false))
    expect(result.data).not.toBeUndefined()
})

test("raw collection retrieval", async () => {

    /** @type {import("../collections.js").UseCollectionQueryResult} */
    let result
    function TestComponent() {
        result = useCollectionQuery(["test-collection"], undefined, { subscribe: false, raw: true })
    }
    render(<TestApp>
        <TestComponent />
    </TestApp>)

    await waitFor(() => expect(result.isLoading).toBe(false))
    expect(Array.isArray(result.data.docs)).toBe(true)
})

test("collection subscription & adding", async () => {

    /** @type {import("../collections.js").UseCollectionQueryResult} */
    let result
    /** @type {import("react-query").UseMutationResult} */
    let add
    function TestComponent() {
        result = useCollectionQuery(["adding"], undefined, { subscribe: true })
        add = useAddDocument(["adding"])
    }
    render(<TestApp>
        <TestComponent />
    </TestApp>)

    await waitFor(() => expect(result.isLoading).toBe(false))
    expect(result.data.length).toBe(2)
    act(() => add.mutate({ a: 7 }))
    await waitFor(() => expect(result.data.length).toBe(3))
})

test("query retrieval", async () => {

    /** @type {import("../collections.js").UseCollectionQueryResult} */
    let result
    function TestComponent() {
        result = useCollectionQuery(["test-collection"], [where("field", "==", 4)], { subscribe: false })
    }
    render(<TestApp>
        <TestComponent />
    </TestApp>)

    await waitFor(() => expect(result.isLoading).toBe(false))
    expect(result.data).toBeTruthy()
})

test("count query", async () => {

    /** @type {import("../collections.js").UseCollectionQueryResult} */
    let result
    function TestComponent() {
        result = useCollectionQuery(["test-collection"], undefined, {
            subscribe: false,
            aggregation: "count",
        })
    }
    render(<TestApp>
        <TestComponent />
    </TestApp>)

    await waitFor(() => expect(result.isLoading).toBe(false))
    expect(result.data).toBe(1)
})