import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useToastStore } from '../ui/Toast'
import Input from '../ui/Input'
import { env } from '../../lib/env'
import { useI18n } from '../../i18n/i18n'

export function Footer() {
  const { push } = useToastStore()
  const [email, setEmail] = useState('')
  const t = useI18n()
  
  const subscribe = (e: React.FormEvent) => {
    e.preventDefault()
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (!ok) {
      push({ type: 'error', message: t('footer.email_error') as string })
      return
    }
    push({ type: 'success', message: t('footer.subscribe_success') as string })
    setEmail('')
  }
  return (
    <footer className="mt-8 border-t border-ui bg-ui-surface text-sm">
      <div className="container mx-auto px-4 py-8 grid grid-cols-1 gap-8 md:grid-cols-5">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <img src="/src/assets/Logo2.svg" alt="Banobs Logo" className="h-12 w-12" />
            <span className="font-semibold tracking-tight text-base">Banobs</span>
          </div>
          <p className="text-ui-muted">
            {t('footer.description') as string}
          </p>
        </div>

        <nav aria-label={t('footer.product') as string} className="grid grid-rows-[auto_1fr] gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ui-muted">{t('footer.product') as string}</h3>
          <ul className="space-y-1">
            <li><Link to="/dashboard" className="link">{t('footer.product_links.dashboard') as string}</Link></li>
            <li><Link to="/borrow" className="link">{t('footer.product_links.borrow') as string}</Link></li>
            <li><Link to="/repay" className="link">{t('footer.product_links.repay') as string}</Link></li>
            <li><Link to="/positions" className="link">{t('footer.product_links.positions') as string}</Link></li>
          </ul>
        </nav>

        <nav aria-label={t('footer.developers') as string} className="grid grid-rows-[auto_1fr] gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ui-muted">{t('footer.developers') as string}</h3>
          <ul className="space-y-1">
            <li><Link to="/docs" className="link">{t('footer.developers_links.docs') as string}</Link></li>
            <li><a href={env.API_URL} target="_blank" rel="noreferrer" className="link">{t('footer.developers_links.api') as string}</a></li>
            <li><a href={env.STATUS_URL} target="_blank" rel="noreferrer" className="link">{t('footer.developers_links.status') as string}</a></li>
            <li><a href={env.GITHUB_URL} target="_blank" rel="noreferrer" className="link">{t('footer.developers_links.github') as string}</a></li>
          </ul>
        </nav>

        <nav aria-label={t('footer.company') as string} className="grid grid-rows-[auto_1fr] gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ui-muted">{t('footer.company') as string}</h3>
          <ul className="space-y-1">
            <li><a href="#" className="link">{t('footer.company_links.about') as string}</a></li>
            <li><a href="#" className="link">{t('footer.company_links.press') as string}</a></li>
            <li><a href="#" className="link">{t('footer.company_links.contact') as string}</a></li>
            <li><a href="#" className="link">{t('footer.company_links.careers') as string}</a></li>
          </ul>
        </nav>

        <div className="grid grid-rows-[auto_1fr] gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ui-muted">{t('footer.subscribe') as string}</h3>
          <form onSubmit={subscribe} className="space-y-2">
            <Input
              name="newsletter_email"
              label={t('footer.email_label') as string}
              value={email}
              onChange={setEmail}
              placeholder="tucorreo@dominio.com"
              type="text"
            />
            <button type="submit" className="btn-primary w-full">{t('footer.subscribe_button') as string}</button>
          </form>
          <p className="text-[11px] text-ui-muted">{t('footer.no_spam') as string}</p>
        </div>
      </div>

      <div className="border-t border-ui">
        <div className="container mx-auto flex flex-col items-start justify-between gap-3 px-4 py-4 text-xs text-ui-muted md:flex-row md:items-center">
          <div className="flex flex-wrap items-center gap-3">
            <a href="#" className="link">{t('footer.privacy') as string}</a>
            <span aria-hidden>·</span>
            <a href="#" className="link">{t('footer.terms') as string}</a>
            <span aria-hidden>·</span>
            <a href="#" className="link">{t('footer.cookies') as string}</a>
          </div>
          <div className="flex items-center gap-3">
            <a aria-label="X" href={env.TWITTER_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 link">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden><path d="M18.243 2H21l-6.543 7.48L22 22h-6.857l-4.37-5.71L5.6 22H3l7.02-8.02L2 2h6.857l3.94 5.2L18.243 2Zm-1.2 18h1.88L7.04 4h-1.9l11.9 16Z"/></svg>
              <span className="sr-only">X</span>
            </a>
            <a aria-label="Discord" href={env.DISCORD_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 link">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden><path d="M20.317 4.369A19.791 19.791 0 0 0 16.886 3a13.277 13.277 0 0 0-1.41 2.887 19.1 19.1 0 0 0-5.0 0A13.278 13.278 0 0 0 9.057 3a19.65 19.65 0 0 0-3.433 1.369C3.07 8.066 2.39 11.64 2.7 15.164A19.9 19.9 0 0 0 7.197 17a14.42 14.42 0 0 0 1.519-2.35c.844.16 1.71.245 2.584.245.873 0 1.74-.085 2.584-.245A14.42 14.42 0 0 0 15.403 17a19.9 19.9 0 0 0 4.497-1.836c.37-3.94-.26-7.513-1.583-10.795ZM9.6 13.6c-.9 0-1.63-.9-1.63-2.005 0-1.106.73-2.006 1.63-2.006.9 0 1.63.9 1.63 2.006 0 1.105-.73 2.005-1.63 2.005Zm4.8 0c-.9 0-1.63-.9-1.63-2.005 0-1.106.73-2.006 1.63-2.006.9 0 1.63.9 1.63 2.006 0 1.105-.73 2.005-1.63 2.005Z"/></svg>
              <span className="sr-only">Discord</span>
            </a>
            <a aria-label="GitHub" href={env.GITHUB_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 link">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden><path d="M12 .5a11.5 11.5 0 0 0-3.637 22.42c.575.108.787-.25.787-.557 0-.276-.01-1.004-.015-1.972-3.201.695-3.878-1.543-3.878-1.543-.523-1.33-1.277-1.684-1.277-1.684-1.044-.714.08-.699.08-.699 1.154.081 1.762 1.185 1.762 1.185 1.027 1.76 2.695 1.251 3.35.957.104-.754.402-1.251.732-1.54-2.555-.29-5.244-1.277-5.244-5.683 0-1.255.449-2.28 1.185-3.083-.119-.29-.513-1.46.113-3.046 0 0 .965-.31 3.165 1.177a10.98 10.98 0 0 1 5.76 0c2.2-1.487 3.163-1.177 3.163-1.177.628 1.586.235 2.756.115 3.046.738.803 1.184 1.828 1.184 3.083 0 4.417-2.694 5.39-5.257 5.675.41.353.777 1.05.777 2.118 0 1.53-.014 2.762-.014 3.139 0 .308.208.67.792.556A11.5 11.5 0 0 0 12 .5Z"/></svg>
              <span className="sr-only">GitHub</span>
            </a>
            <span>© {new Date().getFullYear()} Core Neobank MX</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer


