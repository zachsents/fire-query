# fire-query

A set of hooks to facilitate seamless integration between Firebase (specifically Firestore) and React Query. 

## Installation

```bash
npm install fire-query
```

## Features

- Fetch and subscribe to Firestore documents using React Query.
- Use mutation hooks to `set`, `update`, and `delete` Firestore documents.
- Optimized performance with memoized references and query keys.
- Allows for undefined arguments to minimize wrapping in conditional components.
- JSDoc types.

## Usage

### Setup

Make sure you have initialized Firebase and React Query in your app. 

Then, provide the Firebase context (assumed to be available from `./context.js`) and set any default document options in your Firebase context.

### Fetching and Subscribing to a Firestore Document

```jsx
import { useDocument } from 'fire-query';

function MyComponent() {
  const { data, isLoading } = useDocument(['myCollection', 'myDocId'], { fetch: true, subscribe: true });

  if (isLoading) return 'Loading...';
  if (!data) return 'No document found';

  return <div>{data.myField}</div>;
}
```

### Using Mutations on a Firestore Document

```jsx
import { useDocumentMutators } from 'fire-query';

function MyComponent() {
  const { update, set, delete: deleteDoc } = useDocumentMutators(['myCollection', 'myDocId']);

  const handleUpdate = () => {
    update.mutate({ myField: 'newValue' });
  }

  return (
    <>
      <button onClick={handleUpdate}>Update Document</button>
      {/* Similarly use `set.mutate()` and `deleteDoc.mutate()` */}
    </>
  );
}
```

## API Reference

### `useDocumentReference(pathSegments: string[])`

A hook to get a Firestore `DocumentReference` based on the provided path segments.

### `useDocument(referenceOrPathSegments: DocumentReference | string[], documentOptions?: UseDocumentOptions, reactQueryOptions?: UseQueryOptions)`

The main hook to fetch and/or subscribe to a Firestore document. You can either pass a `DocumentReference` or an array of path segments. 

This hook also provides `set`, `update`, and `delete` mutations based on the `includeMutators` option.

### `useDocumentFromPath(pathSegments: string[], documentOptions?: UseDocumentOptions, reactQueryOptions?: UseQueryOptions)`

A variant of the `useDocument` hook that only takes an array of path segments.

### `useDocumentFromReference(reference: DocumentReference, documentOptions?: UseDocumentOptions, reactQueryOptions?: UseQueryOptions)`

A variant of the `useDocument` hook that only takes a `DocumentReference`.

### `useDocumentMutators(referenceOrPathSegments: DocumentReference | string[])`

A hook that provides only the `set`, `update`, and `delete` mutations without fetching or subscribing to the document.

## Options

- `fetch`: Fetch the document when the component mounts.
- `subscribe`: Listen for real-time updates to the document. Only works if `fetch` is true.
- `raw`: Return the raw Firestore `DocumentSnapshot` instead of formatted data.
- `includeMutators`: Include the mutation methods (`set`, `update`, `delete`).

## Note

Ensure that your Firebase rules are correctly set to permit the desired read/write operations.

## Contributions

Feel free to submit issues and pull requests if you find bugs or have suggestions for improvements.

## License

MIT

---

For detailed documentation and more examples, please visit [official documentation](#).