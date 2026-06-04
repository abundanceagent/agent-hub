'use client'

import { useState } from 'react'
import { updateUserRole, toggleUserActive } from '@/lib/actions/users'
import type { Role } from '@/types/database'

interface Props {
  userId: string
  currentRole: Role
  isActive: boolean
  isSelf: boolean
}

export default function UserActions({ userId, currentRole, isActive, isSelf }: Props) {
  const [role, setRole] = useState<Role>(currentRole)
  const [active, setActive] = useState(isActive)
  const [loadingRole, setLoadingRole] = useState(false)
  const [loadingActive, setLoadingActive] = useState(false)

  async function handleRoleChange(newRole: Role) {
    setLoadingRole(true)
    try {
      await updateUserRole(userId, newRole)
      setRole(newRole)
    } finally {
      setLoadingRole(false)
    }
  }

  async function handleToggleActive() {
    setLoadingActive(true)
    try {
      await toggleUserActive(userId, !active)
      setActive(!active)
    } finally {
      setLoadingActive(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={role}
        disabled={loadingRole || isSelf}
        onChange={(e) => handleRoleChange(e.target.value as Role)}
        className="text-xs px-2 py-1 border border-slate-200 rounded-md bg-white disabled:opacity-50"
      >
        <option value="partner">Partner</option>
        <option value="team">Team</option>
        <option value="admin">Admin</option>
      </select>
      <button
        type="button"
        onClick={handleToggleActive}
        disabled={loadingActive || isSelf}
        className={`text-xs px-3 py-1 rounded-md font-medium transition-colors disabled:opacity-50 ${
          active
            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            : 'bg-green-50 text-green-700 hover:bg-green-100'
        }`}
      >
        {active ? 'Deactivate' : 'Activate'}
      </button>
    </div>
  )
}
