import { Link, useFetcher, useNavigate } from 'react-router';
import type { Route } from './+types/post';

// remix  
export async function clientLoader({ params }: Route.LoaderArgs) {
    const postId = params.postId
    const rest = await fetch(`https://jsonplaceholder.typicode.com/posts/${postId}`)
    return await rest.json()
}

export async function clientAction({ params }: Route.ClientActionArgs) {
    try {
        await fetch(`https://jsonplaceholder.typicode.com/posts/${params.postId}`, {
            method: "DELETE",
        });
        return { isDeleted: true };
    } catch (err) {
        return { isDeleted: false };
    }
}

export default function Post({ loaderData }: Route.ComponentProps) {
    const fetcher = useFetcher();

    const isDeleted = fetcher.data?.isDeleted;
     const navigate = useNavigate();
    return (
        <div>
            {" "}
            {!isDeleted && (
                <>
                    <p>Title: {loaderData.title}</p>
                    <p>Body: {loaderData.body}</p>
                </>
            )}
            <Link to="/about">About</Link> <br></br>
            <button onClick={() => navigate('/')}> Redirect </button>
            <fetcher.Form method="delete">
                <button type="submit"> Delete </button>
            </fetcher.Form>
        </div>
    );
}