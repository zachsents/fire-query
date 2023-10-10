import { render, waitFor } from "@testing-library/react"
import { useDocument } from "../documents"
import TestApp from "./TestApp.js"

const dummySnapshot = docRef => ({
    id: docRef.id,
    data: () => ({ a: 5, rand: Math.random().toString(16).substring(2, 8) }),
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

            setTimeout(() => callback(dummySnapshot(docRef)), 50)
            setTimeout(() => callback(dummySnapshot(docRef)), 200)

            return () => { }
        }),
    }
})


test("document retrieval", async () => {

    let result
    function TestComponent() {
        result = useDocument(["test-collection", "test-document"], { subscribe: false })
    }
    render(<TestApp>
        <TestComponent />
    </TestApp>)

    await waitFor(() => {
        expect(result.isLoading).toBe(false)
    })

    expect(result.data).not.toBeUndefined()

    console.log(result.data)
})

test("document subscription", async () => {

    let result
    function TestComponent() {
        result = useDocument(["test-collection", "test-document"], { subscribe: true })
    }
    render(<TestApp>
        <TestComponent />
    </TestApp>)

    await waitFor(() => {
        expect(result.isLoading).toBe(false)
    })
    expect(result.data).not.toBeUndefined()

    const firstData = result.data
    console.log(result.data)

    await waitFor(() => {
        expect(result.data).not.toEqual(firstData)
    })
    expect(result.data).not.toBeUndefined()

    console.log(result.data)
})

test("undefined document subscription", async () => {
    let result
    function TestComponent() {
        result = useDocument(["test-collection", undefined], { subscribe: true })
    }
    render(<TestApp>
        <TestComponent />
    </TestApp>)

    await waitFor(() => {
        expect(result.isLoading).toBe(false)
    })

    expect(result.data).toBeUndefined()
})

// TO DO: test undefined case
// add collection stuff
// add updating stuff
// add query stuff
// delete firebase-init file and test-collection in prod db