import { useOracle } from '../../hooks/useOracle'
import { useI18n } from '../../i18n/i18n'
import { Alert } from '../ui/Alert'

export function OracleStatus() {
  const { stale, isLoading } = useOracle()
  const t = useI18n()
  if (isLoading || !stale) return null
  return <Alert variant="warning" className="mx-4 mt-2 text-xs">{t('dashboard.oracle_stale')}</Alert>
}

export default OracleStatus


