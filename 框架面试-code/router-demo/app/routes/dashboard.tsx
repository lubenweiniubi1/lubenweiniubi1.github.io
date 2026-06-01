import { Outlet } from 'react-router';

export default function Dashboard() {
    return <div> 'hi Dashboard page'

        <Outlet />
    </div>;
}