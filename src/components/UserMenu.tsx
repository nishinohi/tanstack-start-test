import { useNavigate } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function UserMenu() {
  const { data: session, isPending } = authClient.useSession()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          navigate({ to: '/login', search: {} })
        },
      },
    })
  }

  if (isPending) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 animate-pulse rounded-full bg-gray-700" />
      </div>
    )
  }

  if (!session) {
    return (
      <Button onClick={() => navigate({ to: '/login' })} variant="outline" size="sm">
        ログイン
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-gray-700">
          <Avatar className="h-8 w-8">
            <AvatarImage src={session.user.image || undefined} alt={session.user.name} />
            <AvatarFallback>{session.user.name.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium text-white md:block">{session.user.name}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="font-semibold">{session.user.name}</span>
            <span className="text-xs text-gray-500">{session.user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>ログアウト</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
