import {getSession} from '@/lib/auth';
import {notFound} from 'next/navigation';
import {UserManager} from '@/components/user-manager';
export default async function UsersPage(){const session=await getSession();if(session?.user.globalRole!=='ADMIN')notFound();return <UserManager/>}
