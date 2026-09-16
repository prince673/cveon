function Icon({ children, size = 16, className = '', ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export const SearchIcon = (p) => (
  <Icon {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Icon>
)

export const ShieldIcon = (p) => (
  <Icon {...p}><path d="M12 3 4 6v6c0 4.6 3.2 7.8 8 9 4.8-1.2 8-4.4 8-9V6l-8-3Z" /></Icon>
)

export const BellIcon = (p) => (
  <Icon {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9" /><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" /></Icon>
)

export const ChartIcon = (p) => (
  <Icon {...p}><path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-8" /><path d="M22 20H2" /></Icon>
)

export const CopyIcon = (p) => (
  <Icon {...p}><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></Icon>
)

export const CheckIcon = (p) => (
  <Icon {...p}><path d="m20 6-11 11-5-5" /></Icon>
)

export const WarningIcon = (p) => (
  <Icon {...p}><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></Icon>
)

export const ExternalIcon = (p) => (
  <Icon {...p}><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></Icon>
)

export const LayersIcon = (p) => (
  <Icon {...p}><path d="m12 3-9 5 9 5 9-5-9-5Z" /><path d="m3 13 9 5 9-5" /><path d="m3 17 9 5 9-5" /></Icon>
)

export const PlusIcon = (p) => (
  <Icon {...p}><path d="M12 5v14" /><path d="M5 12h14" /></Icon>
)

export const ArrowLeftIcon = (p) => (
  <Icon {...p}><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></Icon>
)

export const CrosshairIcon = (p) => (
  <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 2v4" /><path d="M12 18v4" /><path d="M2 12h4" /><path d="M18 12h4" /></Icon>
)

export const ListIcon = (p) => (
  <Icon {...p}><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" /></Icon>
)

export const CompareIcon = (p) => (
  <Icon {...p}><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M6 8.5V17a2 2 0 0 0 2 2h5" /><path d="M18 15.5V7a2 2 0 0 0-2-2h-5" /></Icon>
)

export const UploadIcon = (p) => (
  <Icon {...p}><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M4 20h16" /></Icon>
)

export const SortIcon = (p) => (
  <Icon {...p}><path d="m7 8 5-5 5 5" /><path d="m7 16 5 5 5-5" /></Icon>
)