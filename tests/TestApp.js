import { QueryClient, QueryClientProvider } from "react-query"
import { FirebaseProvider } from "../context.js"

const queryClient = new QueryClient()

export default function TestApp({ children }) {
    return (
        <QueryClientProvider client={queryClient}>
            <FirebaseProvider firestore={{}}>
                {children}
            </FirebaseProvider>
        </QueryClientProvider>
    )
}