export function AddressTag({ address }: { address?: string }) {
  if (!address) return null
  return (
    <span className="rounded border border-ui bg-ui-surface px-2 py-0.5 text-xs text-gray-200" aria-label="Address">
      {address.slice(0, 6)}…{address.slice(-4)}
    </span>
  )
}

export default AddressTag


