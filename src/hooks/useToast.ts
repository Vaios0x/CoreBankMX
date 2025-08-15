import { useToastStore } from '../components/ui/Toast'

export function useToast() {
  const { push } = useToastStore()
  
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    push({ type, message })
  }
  
  return {
    showToast,
    push
  }
}
