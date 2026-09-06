import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ViewToggle } from './ViewToggle'

describe('ViewToggle', () => {
  it('marks the active mode and reports changes', async () => {
    const onChange = vi.fn()
    render(<ViewToggle value="combined" onChange={onChange} />)
    expect(screen.getByRole('tab', { name: /combined/i })).toHaveAttribute('aria-selected', 'true')
    await userEvent.click(screen.getByRole('tab', { name: /split/i }))
    expect(onChange).toHaveBeenCalledWith('split')
  })
})
