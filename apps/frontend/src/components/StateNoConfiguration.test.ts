import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/vue'
import StateNoConfiguration from './StateNoConfiguration.vue'

describe('StateNoConfiguration', () => {
  it('renders the setup heading', () => {
    render(StateNoConfiguration)
    expect(screen.getByText('Set up Cardinal')).toBeDefined()
  })

  it('guides the user to Settings → Integrations → Cardinal', () => {
    render(StateNoConfiguration)
    const hint = screen.getByText('Settings → Integrations → Cardinal')
    expect(hint).toBeDefined()
  })

  it('has an accessible landmark role', () => {
    render(StateNoConfiguration)
    expect(screen.getByRole('main')).toBeDefined()
  })
})
