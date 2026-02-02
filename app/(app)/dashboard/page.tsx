import { getUserBands } from '@/actions/bands'
import { getUserInvitations } from '@/actions/invitations'
import Link from 'next/link'

export default async function DashboardPage() {
  const [bands, invitations] = await Promise.all([
    getUserBands(),
    getUserInvitations()
  ])

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">My Bands</h1>
        <Link
          href="/create-band"
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg"
        >
          Create New Band
        </Link>
      </div>

      {invitations.length > 0 && (
        <Link
          href="/invitations"
          className="block mb-6 p-4 bg-purple-900/30 border border-purple-700 rounded-lg hover:bg-purple-900/50"
        >
          <span className="text-purple-300">
            You have {invitations.length} pending invitation{invitations.length !== 1 ? 's' : ''}
          </span>
        </Link>
      )}

      {bands.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-zinc-400 mb-4">You are not a member of any bands yet.</p>
          <Link
            href="/create-band"
            className="text-purple-400 hover:text-purple-300"
          >
            Create your first band
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {bands.map((band) => (
            <li key={band.id}>
              <Link
                href={`/band/${band.id}`}
                className="block p-4 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-700"
              >
                <h2 className="text-lg font-medium text-white">{band.name}</h2>
                {band.description && (
                  <p className="text-zinc-400 text-sm mt-1">{band.description}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
