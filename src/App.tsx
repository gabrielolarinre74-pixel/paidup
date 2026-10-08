import { Toaster } from 'sonner'
import { Route, Router, Switch } from 'wouter'
import { useHashLocation } from 'wouter/use-hash-location'
import { AppShell } from '@/components/layout/AppShell'
import { useTheme } from '@/lib/theme'
import { Clients } from '@/pages/Clients'
import { Documents } from '@/pages/Documents'
import { Editor } from '@/pages/Editor'
import { NotFound } from '@/pages/NotFound'
import { Overview } from '@/pages/Overview'
import { Settings } from '@/pages/Settings'

export default function App() {
  const { theme } = useTheme()
  return (
    <Router hook={useHashLocation}>
      <AppShell>
        <Switch>
          <Route path='/' component={Overview} />
          <Route path='/documents' component={Documents} />
          <Route path='/documents/:id'>{(p) => <Editor id={p.id} />}</Route>
          <Route path='/clients' component={Clients} />
          <Route path='/settings' component={Settings} />
          <Route>
            <NotFound />
          </Route>
        </Switch>
      </AppShell>
      <Toaster
        position='bottom-right'
        theme={theme === 'system' ? 'system' : theme}
        toastOptions={{ className: 'font-sans' }}
      />
    </Router>
  )
}
