import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Sidebar } from '@/components/admin/Sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  if (session.user.role !== 'admin') {
    redirect('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar userEmail={session.user.email} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
