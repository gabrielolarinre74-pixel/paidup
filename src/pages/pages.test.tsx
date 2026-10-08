import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { Router } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'
import { useStore } from '@/store'
import { sampleBusiness, sampleClients, sampleDocs } from '@/store/sample'
import { Clients } from './Clients'
import { Documents } from './Documents'
import { Editor } from './Editor'

function renderAt(ui: React.ReactNode, path = '/') {
  const { hook } = memoryLocation({ path })
  return render(<Router hook={hook}>{ui}</Router>)
}

beforeEach(() => useStore.setState({ business: sampleBusiness, clients: sampleClients, docs: sampleDocs() }))

describe('Documents page', () => {
  it('filters by type and status, and searches by client', async () => {
    const user = userEvent.setup()
    renderAt(<Documents />)
    expect(screen.getByText('14 of 14 documents')).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Quotes' }))
    expect(screen.getByText('2 of 14 documents')).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Invoices' }))
    await user.click(screen.getByRole('button', { name: 'Overdue' }))
    expect(screen.getByText('2 of 14 documents')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Overdue' }))
    await user.type(screen.getByLabelText('Search documents'), 'kettle')
    expect(screen.getByText('3 of 14 documents')).toBeInTheDocument()
  })
})

describe('Editor', () => {
  it('updates totals live as line items change', async () => {
    const user = userEvent.setup()
    const id = useStore.getState().createDoc('invoice')
    useStore.getState().updateDoc(id, { taxRate: 10 })
    renderAt(<Editor id={id} />)
    await user.type(screen.getByLabelText('Item 1 description'), 'Logo design')
    const rate = screen.getByLabelText('Item 1 rate')
    await user.clear(rate)
    await user.type(rate, '200')
    const preview = screen.getByRole('article', { name: 'Invoice preview' })
    expect(within(preview).getByText('Logo design')).toBeInTheDocument()
    expect(within(preview).getAllByText('$220.00').length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: /Add line item/ }))
    expect(screen.getByLabelText('Item 2 description')).toBeInTheDocument()
  })

  it('reuses the rate of a past item with the same description', async () => {
    const user = userEvent.setup()
    const id = useStore.getState().createDoc('invoice')
    renderAt(<Editor id={id} />)
    await user.type(screen.getByLabelText('Item 1 description'), 'Website care plan (monthly)')
    expect(screen.getByLabelText('Item 1 rate')).toHaveValue(180)
  })

  it('warns about duplicate numbers and marks an overdue invoice as paid', async () => {
    const user = userEvent.setup()
    const overdue = useStore.getState().docs.find((d) => d.number === 'INV-0008')!
    renderAt(<Editor id={overdue.id} />)
    expect(screen.getAllByText('Overdue').length).toBeGreaterThan(0)
    const number = screen.getByLabelText('Number')
    await user.clear(number)
    await user.type(number, 'INV-0001')
    expect(screen.getByText('Another document already uses this number')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Mark paid/ }))
    expect(useStore.getState().docs.find((d) => d.id === overdue.id)?.status).toBe('paid')
  })

  it('shows a friendly message for a missing document', () => {
    renderAt(<Editor id='missing' />)
    expect(screen.getByText('This document no longer exists')).toBeInTheDocument()
  })
})

describe('Clients page', () => {
  it('validates and adds a client', async () => {
    const user = userEvent.setup()
    renderAt(<Clients />)
    await user.click(screen.getByRole('button', { name: /New client/ }))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText('Email'), 'bad')
    await user.click(within(dialog).getByRole('button', { name: 'Add client' }))
    expect(within(dialog).getByText('Add the business or person you bill')).toBeInTheDocument()
    expect(within(dialog).getByText('Enter a valid email')).toBeInTheDocument()
    await user.type(within(dialog).getByLabelText('Client name'), 'Northwind Florist')
    await user.clear(within(dialog).getByLabelText('Email'))
    await user.click(within(dialog).getByRole('button', { name: 'Add client' }))
    expect(useStore.getState().clients[0].name).toBe('Northwind Florist')
  })
})
